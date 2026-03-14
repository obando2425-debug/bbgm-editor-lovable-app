// BBGM Propagation System — cascade changes for data integrity
import { addNotification } from "./bbgm-notifications";

export interface PropagationResult {
  playersChanged: boolean;
  teamsChanged: boolean;
  draftPicksChanged: boolean;
  players?: any[];
  teams?: any[];
  draftPicks?: any[];
  notifications: string[];
  changeDescriptions: string[];
}

/** Propagate effects of changing a player's tid */
export function propagatePlayerTidChange(
  league: any, playerIdx: number, oldTid: number, newTid: number
): PropagationResult {
  const result: PropagationResult = {
    playersChanged: false, teamsChanged: false, draftPicksChanged: false,
    notifications: [], changeDescriptions: [],
  };

  const player = league.players?.[playerIdx];
  if (!player) return result;
  const name = `${player.firstName} ${player.lastName}`;

  const oldTeam = league.teams?.find((t: any) => t.tid === oldTid);
  const newTeam = league.teams?.find((t: any) => t.tid === newTid);
  const oldName = oldTeam ? `${oldTeam.region} ${oldTeam.name}` : oldTid === -1 ? "Free Agents" : `TID ${oldTid}`;
  const newName = newTeam ? `${newTeam.region} ${newTeam.name}` : newTid === -1 ? "Free Agents" : `TID ${newTid}`;

  const msg = `${name} transferido de ${oldName} a ${newName}`;
  result.notifications.push(msg);
  result.changeDescriptions.push(msg);

  addNotification({
    type: "info",
    title: "Cambio de equipo",
    message: msg,
    section: "players",
    elementId: String(playerIdx),
  });

  return result;
}

/** Propagate effects of deleting a team */
export function propagateTeamDeletion(
  league: any, teamTid: number
): PropagationResult & { affectedPlayerNames: string[]; affectedPlayerIndices: number[] } {
  const result: PropagationResult & { affectedPlayerNames: string[]; affectedPlayerIndices: number[] } = {
    playersChanged: false, teamsChanged: false, draftPicksChanged: false,
    notifications: [], changeDescriptions: [],
    affectedPlayerNames: [], affectedPlayerIndices: [],
  };

  const team = league.teams?.find((t: any) => t.tid === teamTid);
  const teamName = team ? `${team.region} ${team.name}` : `TID ${teamTid}`;
  const players = league.players || [];
  const draftPicks = league.draftPicks || [];

  // Find affected players
  const updatedPlayers = players.map((p: any, i: number) => {
    if (p.tid === teamTid) {
      result.affectedPlayerNames.push(`${p.firstName} ${p.lastName}`);
      result.affectedPlayerIndices.push(i);
      result.playersChanged = true;
      return { ...p, tid: -1 };
    }
    return p;
  });

  // Mark draftPicks
  const updatedPicks = draftPicks.map((dp: any) => {
    if (dp.tid === teamTid || dp.originalTid === teamTid) {
      result.draftPicksChanged = true;
      return { ...dp, tid: dp.tid === teamTid ? -1 : dp.tid, originalTid: dp.originalTid === teamTid ? -1 : dp.originalTid };
    }
    return dp;
  });

  result.players = updatedPlayers;
  result.draftPicks = updatedPicks;

  const playerList = result.affectedPlayerNames.slice(0, 10).join(", ");
  const extra = result.affectedPlayerNames.length > 10 ? ` y ${result.affectedPlayerNames.length - 10} más` : "";
  const msg = `Equipo "${teamName}" eliminado. ${result.affectedPlayerNames.length} jugadores movidos a Free Agents: ${playerList}${extra}`;

  result.notifications.push(msg);
  result.changeDescriptions.push(msg);

  if (result.draftPicksChanged) {
    const dpMsg = `Draft picks del equipo "${teamName}" invalidados`;
    result.notifications.push(dpMsg);
    result.changeDescriptions.push(dpMsg);
  }

  addNotification({
    type: "warning",
    title: `Equipo eliminado: ${teamName}`,
    message: msg,
    section: "teams",
    persistent: true,
  });

  return result;
}

/** Propagate effects of changing salaryCap */
export function propagateSalaryCapChange(
  league: any, newCap: number
): { overCapTeams: { tid: number; name: string; payroll: number; overBy: number }[] } {
  const teams = league.teams || [];
  const players = league.players || [];
  const overCapTeams: { tid: number; name: string; payroll: number; overBy: number }[] = [];

  for (const team of teams) {
    const teamPlayers = players.filter((p: any) => p.tid === team.tid);
    const payroll = teamPlayers.reduce((sum: number, p: any) => sum + (p.contract?.amount || 0), 0);
    if (payroll > newCap) {
      overCapTeams.push({
        tid: team.tid,
        name: `${team.region} ${team.name}`,
        payroll,
        overBy: payroll - newCap,
      });
    }
  }

  if (overCapTeams.length > 0) {
    const names = overCapTeams.slice(0, 5).map(t => t.name).join(", ");
    addNotification({
      type: "warning",
      title: "Equipos sobre el tope salarial",
      message: `${overCapTeams.length} equipos superan el nuevo tope ($${(newCap / 1000).toFixed(0)}M): ${names}`,
      section: "teams",
      persistent: true,
    });
  }

  return { overCapTeams };
}
