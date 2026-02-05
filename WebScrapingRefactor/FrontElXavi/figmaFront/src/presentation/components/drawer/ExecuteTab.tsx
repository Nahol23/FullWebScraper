/**
 * Presentation Layer: ExecuteTab Component
 * Dumb UI Component - Uses Controller Hook
 */

import { useState, useEffect } from "react";
import {
  Play,
  Loader2,
  CheckCircle2,
  Download, // 👈 Usiamo un'icona generica di download
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { SheetFooter } from "../../components/ui/sheet";
import { Card } from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import type { ApiConfig } from "../../../domain/entities/ApiConfig";
import { useExecutionController } from "../../hooks/useExecutionController";
import type { RuntimeParams } from "../../../domain/entities/RuntimeParams";

interface ExecuteTabProps {
  config: ApiConfig;
  onUpdate: (config: ApiConfig) => void;
  // 👇 1. Nuova prop: deleghiamo il download al genitore (che ha il Controller)
  onDownloadResults: (executionId: string) => void;
}

export function ExecuteTab({ config, onUpdate, onDownloadResults }: ExecuteTabProps) {
  const [inputMode, setInputMode] = useState<"easy" | "raw">("easy");
  // 👇 2. Stato per memorizzare l'ID dell'esecuzione appena conclusa
  const [lastExecutionId, setLastExecutionId] = useState<string | null>(null);

  const [runtimeParams, setRuntimeParams] = useState(
    JSON.stringify(
      {
        page: 1,
        limit: 100,
        filters: {},
      },
      null,
      2
    )
  );

  // Easy mode fields
  const [easyUrl, setEasyUrl] = useState(config.baseUrl + config.endpoint);
  const [easyLimit, setEasyLimit] = useState("100");
  const [easyPage, setEasyPage] = useState("1");

  const { runExecution, isExecuting, error, result, updatedConfig, reset } =
    useExecutionController();

  // Update parent when config is updated from execution
  useEffect(() => {
    if (updatedConfig) {
      // 👇 3. Catturiamo l'ID della nuova esecuzione (è la prima della lista)
      if (updatedConfig.executionHistory.length > 0) {
        setLastExecutionId(updatedConfig.executionHistory[0].id);
      }
      
      onUpdate(updatedConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updatedConfig]);

  const handleExecute = async () => {
    reset();
    setLastExecutionId(null); // Reset dell'ID precedente

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
        return;
      }
    }

    await runExecution(config.id, params);
  };

  // 👇 4. Rimosse le funzioni handleDownloadJson e handleDownloadMarkdown locali
  // Ora usiamo direttamente onDownloadResults nel JSX

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6 flex-1">
        {/* Error Display */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/50 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Input Mode Switcher */}
        <Tabs
          value={inputMode}
          onValueChange={(v: string) => setInputMode(v as "easy" | "raw")}
        >
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800">
            <TabsTrigger
              value="easy"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Easy Mode
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
            >
              Raw JSON
            </TabsTrigger>
          </TabsList>

          {/* Easy Mode */}
          <TabsContent value="easy" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-300 mb-2 block flex items-center gap-2">
                  <span>API Endpoint URL</span>
                  <span className="text-xs text-gray-500 font-normal">
                    (Optional override)
                  </span>
                </Label>
                <Input
                  value={easyUrl}
                  onChange={(e) => setEasyUrl(e.target.value)}
                  placeholder="https://api.example.com/v1/data"
                  className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-300 mb-2 block">
                    Page
                  </Label>
                  <Input
                    type="number"
                    value={easyPage}
                    onChange={(e) => setEasyPage(e.target.value)}
                    placeholder="1"
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white h-10"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-300 mb-2 block">
                    Limit
                  </Label>
                  <Input
                    type="number"
                    value={easyLimit}
                    onChange={(e) => setEasyLimit(e.target.value)}
                    placeholder="100"
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white h-10"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Raw JSON Mode */}
          <TabsContent value="raw" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-300">
                  Runtime Parameters
                </Label>
                <span className="text-xs text-gray-500">JSON format</span>
              </div>
              <Textarea
                value={runtimeParams}
                onChange={(e) => setRuntimeParams(e.target.value)}
                placeholder='{\n  "page": 1,\n  "limit": 100,\n  "filters": {}\n}'
                className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 focus:bg-zinc-900 font-mono text-sm min-h-[200px] text-white"
              />
              <p className="text-xs text-gray-500">
                These parameters will be merged with the configuration settings
                during execution
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Run Extraction Button */}
        <Button
          onClick={handleExecute}
          disabled={isExecuting}
          size="lg"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-base h-12 disabled:opacity-50"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Running Extraction...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 fill-current" />
              Run Extraction
            </>
          )}
        </Button>

        {/* Response Preview - Only show after execution */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Status Header */}
            <Card className="flex items-center justify-between p-4 bg-zinc-900 border-zinc-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50 font-semibold">
                  Status: {result.status} {result.statusText}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Time: {result.duration}ms</span>
              </div>
            </Card>

            {/* Response Data Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-300">Response Data</Label>
                <span className="text-xs text-gray-500">
                  {result.data.data?.length || 0} records
                </span>
              </div>
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="p-4 overflow-x-auto max-h-[400px] overflow-y-auto">
                  <pre className="text-xs text-gray-300 font-mono leading-relaxed">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Download Results Footer - Mostrato solo se abbiamo un risultato e un ID valido */}
      {result && lastExecutionId && (
        <SheetFooter className="border-t border-zinc-800 bg-zinc-950 mt-6 pt-4">
          <div className="w-full space-y-3">
            <Label className="text-sm text-gray-300 font-semibold">
              Download Results
            </Label>
            <div className="flex gap-3">
              {/* 👇 5. Bottone unico che chiama il Controller */}
              <Button
                onClick={() => onDownloadResults(lastExecutionId)}
                variant="outline"
                className="w-full bg-zinc-900 border-zinc-700 hover:border-indigo-500 hover:bg-zinc-800 text-white gap-2 group transition-all"
              >
                <Download className="h-4 w-4 group-hover:text-indigo-400 transition-colors" />
                Download Full Report
              </Button>
            </div>
          </div>
        </SheetFooter>
      )}
    </div>
  );
}