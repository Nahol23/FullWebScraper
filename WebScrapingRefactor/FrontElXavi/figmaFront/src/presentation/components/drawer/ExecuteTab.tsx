// ExecuteTab.tsx - VERSIONE COMPLETA CON CAMPO selectedFields
import { useState, useEffect } from "react";
import { Play, Loader2, Clock, Filter} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
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
  const [inputMode, setInputMode] = useState<"easy" | "raw">("easy");
  //const [showFieldsInfo, setShowFieldsInfo] = useState(false);
  
  const [easyPage, setEasyPage] = useState("1");
  const [easyLimit, setEasyLimit] = useState("100");
  const [customHeaders, setCustomHeaders] = useState(
    JSON.stringify(config.headers || {}, null, 2),
  );
  const [customBody, setCustomBody] = useState(
    JSON.stringify(config.body || {}, null, 2),
  );
  const [customQueryParams, setCustomQueryParams] = useState(
    JSON.stringify(
      config.queryParams?.reduce((acc, param) => {
        if (param.key) acc[param.key] = param.value;
        return acc;
      }, {} as Record<string, string>) || {},
      null,
      2
    )
  );
  
  // STATO PER selectedFields IN RUNTIME
  const [customSelectedFields, setCustomSelectedFields] = useState<string>(
    JSON.stringify(config.selectedFields || [], null, 2)
  );
  const [useCustomSelectedFields, setUseCustomSelectedFields] = useState(false);

  const [rawJsonParams, setRawJsonParams] = useState(
    JSON.stringify({
      page: 1,
      limit: 100,
      headers: config.headers || {},
      queryParams: config.queryParams?.reduce((acc, param) => {
        if (param.key) acc[param.key] = param.value;
        return acc;
      }, {} as Record<string, string>) || {},
      selectedFields: config.selectedFields || [],
    }, null, 2),
  );

  const latestResult = lastLogs.length > 0 ? lastLogs[0] : null;

  useEffect(() => {
    // Reset customSelectedFields quando cambia la config
    setCustomSelectedFields(JSON.stringify(config.selectedFields || [], null, 2));
    setCustomHeaders(JSON.stringify(config.headers || {}, null, 2));
    setCustomBody(JSON.stringify(config.body || {}, null, 2));
    setCustomQueryParams(JSON.stringify(
      config.queryParams?.reduce((acc, param) => {
        if (param.key) acc[param.key] = param.value;
        return acc;
      }, {} as Record<string, string>) || {},
      null,
      2
    ));
    setUseCustomSelectedFields(false); // Reset a false quando cambia config
  }, [config]);

  const handleExecute = async () => {
    let params: RuntimeParams = {};

    if (inputMode === "easy") {
      try {
        // Parsa queryParams
        let parsedQueryParams: Record<string, string> = {};
        try {
          parsedQueryParams = JSON.parse(customQueryParams);
        } catch {
          console.log("No custom query params or invalid JSON");
        }

        // Parsa selectedFields se l'utente li ha modificati
        let parsedSelectedFields: string[] = config.selectedFields || [];
        if (useCustomSelectedFields) {
          try {
            parsedSelectedFields = JSON.parse(customSelectedFields);
            if (!Array.isArray(parsedSelectedFields)) {
              throw new Error("selectedFields deve essere un array");
            }
          } catch (e) {
            alert("Errore nel formato di selectedFields. Deve essere un array JSON valido.");
            console.error("selectedFields parse error:", e);
            return;
          }
        }

        params = {
          page: parseInt(easyPage) || 1,
          limit: parseInt(easyLimit) || 100,
          headers: JSON.parse(customHeaders),
          queryParams: parsedQueryParams,
          body: config.method !== "GET" ? JSON.parse(customBody) : undefined,
          selectedFields: parsedSelectedFields, // Usa quelli custom o quelli di default
        };
      } catch (e) {
        alert("Errore nel formato JSON. Controlla Headers, Body o Query Parameters");
        console.error("JSON parse error:", e);
        return;
      }
    } else {
      try {
        params = JSON.parse(rawJsonParams);
      } catch (e) {
        alert("JSON non valido nei parametri RAW");
        console.error("Raw JSON parse error:", e);
        return;
      }
    }

    console.log("Esecuzione con parametri:", params);
    await onExecute(config.id, params);
  };

  // Funzione per convertire i campi selezionati in formato leggibile
  const formatSelectedFields = () => {
    const fields = useCustomSelectedFields 
      ? (() => {
          try {
            return JSON.parse(customSelectedFields);
          } catch {
            return config.selectedFields || [];
          }
        })()
      : (config.selectedFields || []);
    
    if (!fields || fields.length === 0) {
      return "Nessun campo selezionato";
    }
    
    return fields.slice(0, 3).map((field: string) => {
      const parts = field.split('.');
      return parts[parts.length - 1];
    }).join(', ') + (fields.length > 3 ? '...' : '');
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-zinc-100">
      {/* Data Path Fisso (solo informativo) */}
      {config.dataPath && (
        <Card className="bg-zinc-900 border-zinc-800 p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
            <p className="text-sm text-zinc-400">
              Data Path: <span className="text-indigo-400 font-mono">{config.dataPath}</span>
            </p>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Percorso fisso nella configurazione. Non modificabile in runtime.
          </p>
        </Card>
      )}

      {/* Toggle per selectedFields */}
      <Card className="bg-zinc-900 border-zinc-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-zinc-300">
              Campi da estrarre
            </span>
            <Badge variant="outline" className="ml-2 bg-indigo-500/10 text-indigo-400">
              {useCustomSelectedFields 
                ? (() => {
                    try {
                      const fields = JSON.parse(customSelectedFields);
                      return Array.isArray(fields) ? fields.length : 0;
                    } catch {
                      return 0;
                    }
                  })()
                : (config.selectedFields?.length || 0)
              }
            </Badge>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={useCustomSelectedFields}
                onChange={(e) => setUseCustomSelectedFields(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-10 h-5 rounded-full transition-colors ${
                useCustomSelectedFields ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}></div>
              <div className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                useCustomSelectedFields ? 'transform translate-x-5' : ''
              }`}></div>
            </div>
            <span className="text-xs text-zinc-500">
              {useCustomSelectedFields ? 'Custom' : 'Default'}
            </span>
          </label>
        </div>
        
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">
            {useCustomSelectedFields ? 'Campi personalizzati:' : 'Campi predefiniti:'}
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {(useCustomSelectedFields 
              ? (() => {
                  try {
                    return JSON.parse(customSelectedFields);
                  } catch {
                    return [];
                  }
                })()
              : (config.selectedFields || [])
            ).map((field: string, index: number) => (
              <Badge 
                key={index}
                variant="outline" 
                className="bg-zinc-800 text-zinc-300 font-mono text-xs"
              >
                {field}
              </Badge>
            ))}
          </div>
          
          {useCustomSelectedFields && (
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">
                Modifica campi (JSON Array)
              </Label>
              <Textarea
                value={customSelectedFields}
                onChange={(e) => setCustomSelectedFields(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10 min-h-[100px]"
                placeholder='["id", "name", "email"]'
              />
              <p className="text-xs text-zinc-500 mt-1">
                Array JSON di percorsi da estrarre (es. ["data.id", "data.name"])
              </p>
            </div>
          )}
        </div>
      </Card>

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
                Advanced Overrides (Headers, Body, Query)
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div>
                  <Label className="text-xs text-zinc-400 mb-1 block">
                    Query Parameters (JSON)
                  </Label>
                  <Textarea
                    value={customQueryParams}
                    onChange={(e) => setCustomQueryParams(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10 min-h-[80px]"
                    placeholder='{"param1": "value1", "param2": "value2"}'
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Parametri da aggiungere alla query string.
                  </p>
                </div>
                
                <div>
                  <Label className="text-xs text-zinc-400 mb-1 block">
                    Headers (JSON)
                  </Label>
                  <Textarea
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10 min-h-[80px]"
                    placeholder='{"Content-Type": "application/json", "Authorization": "Bearer ..."}'
                  />
                </div>
                
                {config.method !== "GET" && (
                  <div>
                    <Label className="text-xs text-zinc-400 mb-1 block">
                      Body (JSON)
                    </Label>
                    <Textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10 min-h-[80px]"
                      placeholder='{"key": "value"}'
                    />
                  </div>
                )}
                
                {/* AGGIUNGI QUESTO PER selectedFields */}
                <div className="pt-2 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-zinc-400">
                      Override Selected Fields
                    </Label>
                    <span className="text-xs text-zinc-500">
                      {useCustomSelectedFields ? 'ON' : 'OFF'}
                    </span>
                  </div>
                  <Textarea
                    value={customSelectedFields}
                    onChange={(e) => setCustomSelectedFields(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10 min-h-[80px]"
                    placeholder='["id", "name", "email"]'
                    disabled={!useCustomSelectedFields}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="enableSelectedFields"
                      checked={useCustomSelectedFields}
                      onChange={(e) => setUseCustomSelectedFields(e.target.checked)}
                      className="h-3 w-3 rounded border-zinc-700 bg-zinc-900"
                    />
                    <Label htmlFor="enableSelectedFields" className="text-xs text-zinc-500 cursor-pointer">
                      Abilita override dei campi
                    </Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="raw" className="mt-4">
          <Textarea
            value={rawJsonParams}
            onChange={(e) => setRawJsonParams(e.target.value)}
            className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm h-10 min-h-[200px]"
            placeholder={`{
  "page": 1,
  "limit": 100,
  "headers": ${JSON.stringify(config.headers || {}, null, 2)},
  "queryParams": ${JSON.stringify(config.queryParams?.reduce((acc, param) => {
    if (param.key) acc[param.key] = param.value;
    return acc;
  }, {} as Record<string, string>) || {}, null, 2)},
  "selectedFields": ${JSON.stringify(config.selectedFields || [], null, 2)}
}`}
          />
          <p className="text-xs text-zinc-500 mt-2">
            Includi <code>"selectedFields"</code> per sovrascrivere i campi predefiniti.
          </p>
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

      {/* Info Box */}
      <Card className="bg-zinc-900/50 border border-zinc-800 p-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          <p className="text-xs text-zinc-400">
            {useCustomSelectedFields ? 'Campi personalizzati:' : 'Campi predefiniti:'}{' '}
            <span className="text-emerald-400 font-medium">
              {useCustomSelectedFields 
                ? (() => {
                    try {
                      const fields = JSON.parse(customSelectedFields);
                      return Array.isArray(fields) ? fields.length : 0;
                    } catch {
                      return 0;
                    }
                  })()
                : (config.selectedFields?.length || 0)
              }
            </span>
          </p>
        </div>
        <p className="text-xs text-zinc-500 mt-1">
          {formatSelectedFields()}
        </p>
        {config.dataPath && (
          <p className="text-xs text-zinc-600 mt-2">
            Data Path: <span className="font-mono">{config.dataPath}</span>
          </p>
        )}
      </Card>

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
    </div>
  );
}