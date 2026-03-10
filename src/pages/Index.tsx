import React from "react";
import { useLeague } from "@/context/LeagueContext";
import { LeagueProvider } from "@/context/LeagueContext";
import FileUpload from "@/components/FileUpload";
import EditorDashboard from "@/components/EditorDashboard";

const IndexContent = () => {
  const { league } = useLeague();

  return (
    <div className="min-h-screen bg-background bg-court-pattern">
      {!league ? <FileUpload /> : <EditorDashboard />}
    </div>
  );
};

const Index = () => (
  <LeagueProvider>
    <IndexContent />
  </LeagueProvider>
);

export default Index;
