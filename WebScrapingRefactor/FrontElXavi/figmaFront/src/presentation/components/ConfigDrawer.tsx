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
import type { ApiConfig } from "../../domain/entities/ApiConfig";
import { ConfigurationTab } from "./drawer/ConfigurationTab";
import { ExecuteTab } from "./drawer/ExecuteTab";
import { HistoryTab } from "./drawer/HistoryTab";
import { useConfigController } from "../hooks/useConfigController";

interface ConfigDrawerProps {
  isOpen: boolean;
  config: ApiConfig | null;
  onClose: () => void;
  onUpdate: (config: ApiConfig) => void;
  onDelete: (id: string) => void;
}

type TabType = "configuration" | "execute" | "history";

export function ConfigDrawer({
  isOpen,
  config,
  onClose,
  onUpdate,
  onDelete,
}: ConfigDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>("execute");
  const [editedConfig, setEditedConfig] = useState<ApiConfig | null>(null);

  // 1. CORREZIONE: L'hook deve stare DENTRO il componente
  const { downloadExecutionReport } = useConfigController();

  useEffect(() => {
    if (config) {
      setEditedConfig(JSON.parse(JSON.stringify(config)));
      setActiveTab("execute");
    }
  }, [config]);

  if (!editedConfig) return null;

  const handleConfigUpdate = (updatedConfig: ApiConfig) => {
    setEditedConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-zinc-950 border-zinc-800 p-0 flex flex-col gap-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-2xl font-semibold text-white">
              {editedConfig.name}
            </SheetTitle>
            <Badge
              className={cn(
                "border font-mono text-xs px-2 py-0.5",
                editedConfig.method === "GET"
                  ? "bg-green-500/10 border-green-500/50 text-green-400"
                  : "bg-orange-500/10 border-orange-500/50 text-orange-400"
              )}
            >
              {editedConfig.method}
            </Badge>
          </div>
          <SheetDescription className="text-sm text-gray-400 font-mono">
            {editedConfig.baseUrl}
            {editedConfig.endpoint}
          </SheetDescription>
        </SheetHeader>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v: string) => setActiveTab(v as TabType)}
          className="flex-1 flex flex-col"
        >
          <div className="border-b border-zinc-800 px-6">
            <TabsList className="bg-transparent border-0 p-0 h-auto w-full justify-start gap-0">
              <TabsTrigger
                value="configuration"
                className={cn(
                  "rounded-none border-b-2 px-4 py-3 font-medium text-sm data-[state=active]:bg-transparent",
                  activeTab === "configuration"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-gray-400"
                )}
              >
                Configuration
              </TabsTrigger>
              <TabsTrigger
                value="execute"
                className={cn(
                  "rounded-none border-b-2 px-4 py-3 font-medium text-sm data-[state=active]:bg-transparent",
                  activeTab === "execute"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-gray-400"
                )}
              >
                Execute
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className={cn(
                  "rounded-none border-b-2 px-4 py-3 font-medium text-sm data-[state=active]:bg-transparent",
                  activeTab === "history"
                    ? "border-indigo-500 text-white"
                    : "border-transparent text-gray-400"
                )}
              >
                History
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="configuration" className="p-6 mt-0">
              <ConfigurationTab
                config={editedConfig}
                onUpdate={handleConfigUpdate}
                onDelete={onDelete}
              />
            </TabsContent>

            <TabsContent value="execute" className="p-6 mt-0 h-full">
              {/* 2. CORREZIONE: Passiamo la prop onDownloadResults */}
              <ExecuteTab 
                config={editedConfig} 
                onUpdate={handleConfigUpdate}
                onDownloadResults={(id) => downloadExecutionReport(editedConfig, id)}
              />
            </TabsContent>

            <TabsContent value="history" className="p-6 mt-0">
               {/* 3. CONSIGLIO: Passala anche qui, così History funziona uguale */}
              <HistoryTab 
                config={editedConfig}
                onDownloadResults={(id) => downloadExecutionReport(editedConfig, id)}
              />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}