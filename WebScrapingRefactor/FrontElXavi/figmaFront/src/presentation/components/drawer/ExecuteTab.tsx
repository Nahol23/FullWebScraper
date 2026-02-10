/**
 * Presentation Layer: ExecuteTab Component
 * Componente per la configurazione runtime e l'esecuzione delle estrazioni.
 */

import { useState } from "react";
import {
  Play,
  Loader2,
  Download,
  Clock,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { SheetFooter } from "../../components/ui/sheet";
import { Card } from "../../components/ui/card";
import type { ApiConfig, ExecutionHistory } from "../../../domain/entities/ApiConfig";
import type { RuntimeParams } from "../../../domain/entities/RuntimeParams";

interface ExecuteTabProps {
  config: ApiConfig;
  onUpdate: (config: ApiConfig) => Promise<void>;
  onExecute: (configId: string, params?: RuntimeParams) => Promise<void>;
  isExecuting: boolean;
  lastLogs: ExecutionHistory[];
}

export function ExecuteTab({ 
  config, 
  onExecute, 
  isExecuting, 
  lastLogs 
}: ExecuteTabProps) {
  const [inputMode, setInputMode] = useState<"easy" | "raw">("easy");
  const [runtimeParams, setRuntimeParams] = useState(
    JSON.stringify({ page: 1, limit: 100, filters: {} }, null, 2)
  );

  // Easy mode fields
  const [easyUrl, setEasyUrl] = useState(config.baseUrl + config.endpoint);
  const [easyLimit, setEasyLimit] = useState("100");
  const [easyPage, setEasyPage] = useState("1");

  // Prendi l'ultimo risultato per la preview
  const latestResult = lastLogs.length > 0 ? lastLogs[0] : null;

  const handleExecute = async () => {
    let params: RuntimeParams | undefined;

    if (inputMode === "easy") {
      params = {
        page: parseInt(easyPage) || 1,
        limit: parseInt(easyLimit) || 100,
      };
    } else {
      try {
        params = JSON.parse(runtimeParams);
      } catch (e) {
        alert("Invalid JSON in Runtime Parameters");
        return;
      }
    }

    await onExecute(config.id, params);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6 flex-1">
        {/* Input Mode Switcher */}
        <Tabs
          value={inputMode}
          onValueChange={(v: string) => setInputMode(v as "easy" | "raw")}
        >
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800 p-1">
            <TabsTrigger
              value="easy"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
            >
              Easy Mode
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
            >
              Raw JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="easy" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-zinc-400 mb-2 block">API Endpoint URL</Label>
                <Input
                  value={easyUrl}
                  onChange={(e) => setEasyUrl(e.target.value)}
                  disabled
                  className="bg-zinc-900 border-zinc-800 text-zinc-500 font-mono text-xs h-10 opacity-70"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-zinc-400 mb-2 block">Page</Label>
                  <Input
                    type="number"
                    value={easyPage}
                    onChange={(e) => setEasyPage(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-zinc-400 mb-2 block">Limit</Label>
                  <Input
                    type="number"
                    value={easyLimit}
                    onChange={(e) => setEasyLimit(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white h-10"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="raw" className="mt-4">
            <Textarea
              value={runtimeParams}
              onChange={(e) => setRuntimeParams(e.target.value)}
              className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 font-mono text-sm min-h-[150px] text-white"
            />
          </TabsContent>
        </Tabs>

        {/* Action Button */}
        <Button
          onClick={handleExecute}
          disabled={isExecuting}
          size="lg"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 h-12 transition-all shadow-lg shadow-indigo-500/20"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Run Extraction
            </>
          )}
        </Button>

        {/* Latest Result Preview */}
        {latestResult && !isExecuting && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between px-1">
              <Label className="text-sm font-medium text-zinc-300">Last Response Preview</Label>
              <span className="text-[10px] text-zinc-500 font-mono">{latestResult.id}</span>
            </div>
            
            <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
              <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${latestResult.status < 400 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs font-bold text-zinc-300">HTTP {latestResult.status}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <Clock className="h-3 w-3" />
                  {latestResult.duration}ms
                </div>
              </div>
              <div className="p-4 max-h-[250px] overflow-y-auto">
                <pre className="text-[11px] text-zinc-400 font-mono leading-relaxed">
                  {JSON.stringify(latestResult.responsePreview || { message: "No preview available" }, null, 2)}
                </pre>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Footer per download rapido */}
      {latestResult && (
        <SheetFooter className="border-t border-zinc-800 bg-zinc-950 mt-6 pt-4 px-1">
          <div className="w-full">
            <Button
              variant="outline"
              className="w-full bg-zinc-900 border-zinc-800 hover:border-indigo-500 text-zinc-300 gap-2 h-10 transition-all"
              onClick={() => window.alert("Go to History tab for full report download")}
            >
              <Download className="h-4 w-4" />
              View Full Report in History
            </Button>
          </div>
        </SheetFooter>
      )}
    </div>
  );
}