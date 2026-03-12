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
import type { ScrapingConfig } from "../../domain/entities/ScrapingConfig";
import type { ScrapingExecution } from "../../domain/entities/ScrapingExecution";
import { ScrapingConfigurationTab } from "./drawer/ScrapingConfigurationTab";
import { ScrapingExecuteTab } from "./drawer/ScrapingExecuteTab";
import { ScrapingHistoryTab } from "./drawer/ScrapingHistoryTab";

interface ScrapingConfigDrawerProps {
  isOpen: boolean;
  config: ScrapingConfig | null;
  onClose: () => void;
  onUpdate: (config: ScrapingConfig) => Promise<void>;
  onDelete: (config: ScrapingConfig) => void;
  /**
   * Called with (configName, runtimeParams?) — App.tsx is the single place
   * that knows both the name and the execution use case.
   */
  onExecute: (configName: string, params?: any) => Promise<void>;
  isExecuting: boolean;
  logs: ScrapingExecution[];
  isLoadingLogs: boolean;
  onRefreshLogs: () => void;
  onDeleteLog: (logId: string) => Promise<void>;
  onDownload: (format: "json" | "markdown") => void;
  lastResult?: any;
}

type TabType = "configuration" | "execute" | "history";

export function ScrapingConfigDrawer({
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
}: ScrapingConfigDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("execute");
  const [editedConfig, setEditedConfig] = useState<ScrapingConfig | null>(null);

  useEffect(() => {
    if (config) {
      setEditedConfig({ ...config });
      setActiveTab("execute");
    }
  }, [config]);

  if (!editedConfig) return null;

  const handleUpdate = async (updated: ScrapingConfig) => {
    setEditedConfig(updated);
    await onUpdate(updated);
  };

  /**
   * Bridge: ScrapingExecuteTab only passes runtimeParams (it doesn't know
   * the configName). We close over editedConfig.name here so the correct
   * name is always forwarded to App.tsx → executeScrapingByNameUseCase.
   */
  const handleExecute = async (params?: any) => {
    if (!editedConfig.name) return;
    await onExecute(editedConfig.name, params);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-zinc-950 border-zinc-800 p-0 flex flex-col h-full"
      >
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
              {editedConfig.method || "GET"}
            </Badge>
          </div>
          <SheetDescription className="text-sm text-zinc-400 font-mono flex items-center gap-1">
            <span className="opacity-50 italic">URL:</span>
            <span className="text-zinc-300">{editedConfig.url}</span>
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v: string) => setActiveTab(v as TabType)}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="border-b border-zinc-800 px-6 shrink-0">
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

          <div className="flex-1 relative min-h-0">
            <TabsContent
              value="configuration"
              className="m-0 absolute inset-0 data-[state=inactive]:hidden"
            >
              <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
                <div className="p-6 w-full min-w-0">
                  <ScrapingConfigurationTab
                    config={editedConfig}
                    onUpdate={handleUpdate}
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
                  <ScrapingExecuteTab
                    config={editedConfig}
                    onExecute={handleExecute}
                    isExecuting={isExecuting}
                    lastResult={lastResult}
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
                  <ScrapingHistoryTab
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