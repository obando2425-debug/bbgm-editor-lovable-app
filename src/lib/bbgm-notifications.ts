// BBGM Notification System — centralized notification store

export interface BBGMNotification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  section?: string;
  elementId?: string;
  timestamp: number;
  read: boolean;
  persistent?: boolean;
}

const NOTIF_KEY = "bbgm-notifications";
const MAX_NOTIFICATIONS = 200;

let listeners: Array<() => void> = [];
let notifications: BBGMNotification[] = [];

// Load from localStorage
try {
  notifications = JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
} catch { notifications = []; }

function persist() {
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
  } catch {}
  listeners.forEach(fn => fn());
}

export function addNotification(n: Omit<BBGMNotification, "id" | "timestamp" | "read">) {
  const notif: BBGMNotification = {
    ...n,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    read: false,
  };
  notifications = [notif, ...notifications].slice(0, MAX_NOTIFICATIONS);
  persist();
  return notif;
}

export function getNotifications(): BBGMNotification[] {
  return notifications;
}

export function getUnreadCount(): number {
  return notifications.filter(n => !n.read).length;
}

export function markAsRead(id: string) {
  notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  persist();
}

export function markAllAsRead() {
  notifications = notifications.map(n => ({ ...n, read: true }));
  persist();
}

export function clearNotifications() {
  notifications = [];
  persist();
}

export function subscribeNotifications(fn: () => void) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}
