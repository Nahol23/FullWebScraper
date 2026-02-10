import { useState, useEffect } from "react";
import { Play, Loader2, Clock } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Card } from "../../components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import type {
  ApiConfig,
  ExecutionHistory,
} from "../../../domain/entities/ApiConfig";
import type { RuntimeParams } from "../../../domain/entities/RuntimeParams";

interface ExecuteTabProps {
  config: ApiConfig;
  onExecute: (configId: string, params?: RuntimeParams) => Promise<void>;
  isExecuting: boolean;
  lastLogs: ExecutionHistory[];
  onUpdate?: (updatedConfig: ApiConfig) => Promise<void>;
}

export function ExecuteTab({
  config,
  onExecute,
  isExecuting,
  lastLogs,
}: ExecuteTabProps) {
  useEffect(() => {
    if (config.selectedFields.length === 0) {
      console.log("Nessun campo selezionato per il filtraggio");
    }
  }, [config]);
  const [inputMode, setInputMode] = useState<"easy" | "raw">("easy");

  const [easyPage, setEasyPage] = useState("1");
  const [easyLimit, setEasyLimit] = useState("100");
  const [customDataPath, setCustomDataPath] = useState(config.dataPath || "");
  const [customHeaders, setCustomHeaders] = useState(
    JSON.stringify(config.headers || {}, null, 2),
  );
  const [customBody, setCustomBody] = useState(
    JSON.stringify(config.body || {}, null, 2),
  );

  const [rawJsonParams, setRawJsonParams] = useState(
    JSON.stringify({ page: 1, limit: 100, dataPath: config.dataPath }, null, 2),
  );

  const latestResult = lastLogs.length > 0 ? lastLogs[0] : null;

  const handleExecute = async () => {
    let params: RuntimeParams = {};

    if (inputMode === "easy") {
      try {
        params = {
          page: parseInt(easyPage) || 1,
          limit: parseInt(easyLimit) || 100,
          dataPath: customDataPath,
          headers: JSON.parse(customHeaders),
          body: config.method !== "GET" ? JSON.parse(customBody) : undefined,
        };
      } catch (e) {
        alert("Errore nel formato JSON di Headers o Body");
        return;
      }
    } else {
      try {
        params = JSON.parse(rawJsonParams);
      } catch (e) {
        alert("JSON non valido nei parametri RAW");
        return;
      }
    }

    await onExecute(config.id, params);
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-zinc-100">
      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as any)}>
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

        <TabsContent value="easy" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Page</Label>
              <Input
                type="number"
                value={easyPage}
                onChange={(e) => setEasyPage(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Limit</Label>
              <Input
                type="number"
                value={easyLimit}
                onChange={(e) => setEasyLimit(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10"
              />
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="overrides" className="border-zinc-800">
              <AccordionTrigger className="text-sm text-indigo-400">
                Advanced Overrides (Headers, Body, Path)
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs text-zinc-400 mb-1 block">
                    Custom Data Path
                  </Label>
                  <Input
                    value={customDataPath}
                    onChange={(e) => setCustomDataPath(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10"
                    placeholder="e.g. data.items"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-400 mb-1 block">
                    Override Headers (JSON)
                  </Label>
                  <Textarea
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10"
                  />
                </div>
                {config.method !== "GET" && (
                  <div>
                    <Label className="text-xs text-zinc-400 mb-1 block">
                      Override Body (JSON)
                    </Label>
                    <Textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10"
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <Textarea
            value={rawJsonParams}
            onChange={(e) => setRawJsonParams(e.target.value)}
            className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10"
          />
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleExecute}
        disabled={isExecuting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 gap-2 mt-4"
      >
        {isExecuting ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isExecuting ? "Executing..." : "Run Extraction"}
      </Button>

      {latestResult && (
        <Card className="bg-zinc-900 border-zinc-800 p-4 mt-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase text-zinc-500">
              Last Execution Stats
            </span>
            <span className="flex items-center gap-1 text-[10px] text-zinc-400">
              <Clock className="h-3 w-3" />
              {typeof latestResult.timestamp === "string"
                ? latestResult.timestamp.split("T")[1]?.split(".")[0]
                : "Now"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/20 p-2 rounded border border-zinc-800">
              <p className="text-[9px] text-zinc-500 uppercase">Status</p>
              <p
                className={`text-xs font-bold ${
                  String(latestResult.status) === "success" ||
                  (Number(latestResult.status) >= 200 &&
                    Number(latestResult.status) < 300)
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {String(latestResult.status).toUpperCase()}
              </p>
            </div>

            <div className="bg-black/20 p-2 rounded border border-zinc-800">
              <p className="text-[9px] text-zinc-500 uppercase">Records</p>
              <p className="text-xs font-bold text-zinc-200">
                {latestResult.recordsExtracted ?? 0}
              </p>
            </div>
          </div>
        </Card>
      )}
      {latestResult?.responsePreview && (
        <Card className="bg-zinc-900 border-zinc-800 p-4 mt-2">
          <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2">
            Response Preview
          </p>

          <pre className="text-xs text-zinc-300 bg-black/30 p-3 rounded overflow-auto max-h-[300px]">
            {JSON.stringify(latestResult.responsePreview, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
