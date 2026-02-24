import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./ui/sheet";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "./ui/utils";
import type {
  ApiConfig,
  ExecutionHistory,
} from "../../domain/entities/ApiConfig";
import { ConfigurationTab } from "./drawer/ConfigurationTab";
import { ExecuteTab } from "./drawer/ExecuteTab";
import { HistoryTab } from "./drawer/HistoryTab";


interface ConfigDrawerProps {
  isOpen: boolean;
  config: ApiConfig | null;
  onClose: () => void;
  onUpdate: (config: ApiConfig) => Promise<void>;
  onDelete: (config: ApiConfig) => void; // Modifica: ora riceve l'intero config
  // Props per Execution (dal controller Execution)
  onExecute: (configId: string, params?: any) => Promise<void>;
  isExecuting: boolean;
  logs: ExecutionHistory[];
  isLoadingLogs: boolean;
  onRefreshLogs: () => void;
  onDeleteLog: (logId: string) => Promise<void>;
  onDownload: (format: "json" | "markdown") => void;
  lastResult?: any;
}

type TabType = "configuration" | "execute" | "history";

export function ConfigDrawer({
  isOpen,
  config,
  onClose,
  onUpdate,
  onDelete,
  onExecute,
  isExecuting,
  logs,
  isLoadingLogs,
  onRefreshLogs,
  onDeleteLog,
  onDownload,
  lastResult,
}: ConfigDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("execute");
  const [editedConfig, setEditedConfig] = useState<ApiConfig | null>(null);

  useEffect(() => {
    if (config) {
      setEditedConfig(JSON.parse(JSON.stringify(config)));
      setActiveTab("execute");
    }
  }, [config]);

  if (!editedConfig) return null;

  const handleConfigUpdate = async (updatedConfig: ApiConfig) => {
    setEditedConfig(updatedConfig);
    await onUpdate(updatedConfig);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-zinc-950 border-zinc-800 p-0 flex flex-col gap-0 h-full max-h-screen"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-zinc-800 space-y-3 shrink-0">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-2xl font-semibold text-white">
              {editedConfig.name}
            </SheetTitle>
            <Badge
              className={cn(
                "border font-mono text-xs px-2 py-0.5",
                editedConfig.method === "GET"
                  ? "bg-green-500/10 border-green-500/50 text-green-400"
                  : "bg-orange-500/10 border-orange-500/50 text-orange-400",
              )}
            >
              {editedConfig.method}
            </Badge>
          </div>
          <SheetDescription className="text-sm text-zinc-400 font-mono flex items-center gap-1">
            <span className="opacity-50 italic">Endpoint:</span>
            <span className="text-zinc-300">
              {editedConfig.baseUrl}
              {editedConfig.endpoint}
            </span>
          </SheetDescription>
        </SheetHeader>

        {/* Tabs System */}
        <Tabs
          value={activeTab}
          onValueChange={(v: string) => setActiveTab(v as TabType)}
          className="flex-1 flex flex-col min-h-0 h-full overflow-hidden"
        >
          <div className="border-b border-zinc-800 px-6 shrink-0 bg-zinc-950/50 backdrop-blur-sm z-10">
            <TabsList className="bg-transparent border-0 p-0 h-auto w-full justify-start gap-2">
              {[
                { id: "configuration", label: "Configuration" },
                { id: "execute", label: "Execute" },
                { id: "history", label: "History" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    "rounded-none border-b-2 px-4 py-3 font-medium text-sm transition-all data-[state=active]:bg-transparent",
                    activeTab === tab.id
                      ? "border-indigo-500 text-white"
                      : "border-transparent text-zinc-500 hover:text-zinc-300",
                  )}
                >
                  {tab.label}
                  {tab.id === "history" && logs.length > 0 && (
                    <span className="ml-2 bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md text-[10px]">
                      {logs.length}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

         {/* Tab Content Area */}
<div className="flex-1 relative min-h-0">

  <TabsContent 
    value="configuration" 
    className="m-0 absolute inset-0 data-[state=inactive]:hidden"
  >
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
      <div className="p-6 w-full min-w-0">
        <ConfigurationTab
          config={editedConfig}
          onUpdate={handleConfigUpdate}
          onDelete={onDelete} 
        />
      </div>
    </div>
  </TabsContent>

  <TabsContent 
    value="execute" 
    className="m-0 absolute inset-0 data-[state=inactive]:hidden"
  >
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
      <div className="p-6 w-full min-w-0">
        <ExecuteTab
          config={editedConfig}
          onUpdate={handleConfigUpdate}
          onExecute={onExecute}
          isExecuting={isExecuting}
          lastLogs={logs.slice(0, 3)}
          lastExecutionResult={lastResult}
        />
      </div>
    </div>
  </TabsContent>

  <TabsContent 
    value="history" 
    className="m-0 absolute inset-0 data-[state=inactive]:hidden"
  >
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
      <div className="p-6 w-full min-w-0">
        <HistoryTab
          logs={logs}
          isLoading={isLoadingLogs}
          onRefresh={onRefreshLogs}
          onDeleteLog={onDeleteLog}
          onDownload={onDownload}
        />
      </div>
    </div>
  </TabsContent>

</div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}