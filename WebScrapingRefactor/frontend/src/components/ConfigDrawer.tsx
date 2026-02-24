import { Sheet, SheetContent, SheetHeader, SheetTitle} from "./ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Settings2, PlayCircle, History } from "lucide-react";
import type { ApiConfig } from "../types/ApiConfig";
import { ConfigurationTab } from "./drawer/ConfigurationTab";
import { ExecuteTab } from "./drawer/ExecuteTab";
import { HistoryTab } from "./drawer/HistoryTab";

interface ConfigDrawerProps {
  isOpen: boolean;
  config: ApiConfig | null;
  onClose: () => void;
  onUpdate: (config: ApiConfig) => void;
  onDelete: (id: string) => void;
}

export function ConfigDrawer({ isOpen, config, onClose, onUpdate, onDelete }: ConfigDrawerProps) {
  if (!config) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-2xl bg-zinc-950 border-l border-zinc-800 p-0 overflow-hidden flex flex-col">
        <SheetHeader className="p-6 border-b border-zinc-800 bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              {config.name}
            </SheetTitle>
          </div>
        </SheetHeader>

        <Tabs defaultValue="execute" className="flex-1 flex flex-col">
          <div className="px-6 py-2 border-b border-zinc-800 bg-zinc-900/10">
            <TabsList className="bg-transparent gap-6">
              <TabsTrigger value="configuration" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 border-indigo-500 rounded-none px-0 gap-2">
                <Settings2 className="w-4 h-4" /> Configuration
              </TabsTrigger>
              <TabsTrigger value="execute" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 border-indigo-500 rounded-none px-0 gap-2">
                <PlayCircle className="w-4 h-4" /> Execute
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:text-indigo-400 data-[state=active]:border-b-2 border-indigo-500 rounded-none px-0 gap-2">
                <History className="w-4 h-4" /> History
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-zinc-950">
            <TabsContent value="configuration" className="m-0 focus-visible:ring-0">
              <ConfigurationTab config={config} onUpdate={onUpdate} onDelete={onDelete} />
            </TabsContent>
            
            <TabsContent value="execute" className="m-0 focus-visible:ring-0">
              <ExecuteTab config={config} onUpdate={onUpdate} />
            </TabsContent>

            <TabsContent value="history" className="m-0 focus-visible:ring-0">
              <HistoryTab config={config} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}