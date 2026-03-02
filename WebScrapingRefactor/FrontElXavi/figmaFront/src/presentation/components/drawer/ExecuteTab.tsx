import { useState, useEffect } from "react";
import { Play, Loader2, Filter, Eye } from "lucide-react";
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
import { flattenJson } from "../../utils/flattenJson";
import { ResultViewerModal } from "../ResultViewerModal";


interface ExecuteTabProps {
  config: ApiConfig;
  onExecute: (configId: string, params?: RuntimeParams) => Promise<void>;
  isExecuting: boolean;
  lastLogs: ExecutionHistory[];
  lastExecutionResult?: any;
  onUpdate?: (updatedConfig: ApiConfig) => Promise<void>;
}

export function ExecuteTab({
  config,
  onExecute,
  isExecuting,
  lastExecutionResult,
}: ExecuteTabProps) {
  const [inputMode, setInputMode] = useState<"easy" | "raw">("easy");

  // --- Easy Mode state ---
  const [easyPage, setEasyPage] = useState("1");
  const [isFieldsOpen, setIsFieldsOpen] = useState(false);
  const [easyLimit, setEasyLimit] = useState("100");
  const [customHeaders, setCustomHeaders] = useState(
    JSON.stringify(config.headers || {}, null, 2),
  );
  const [customBody, setCustomBody] = useState(
    JSON.stringify(config.body || {}, null, 2),
  );
  const [customQueryParams, setCustomQueryParams] = useState(
    JSON.stringify(
      config.queryParams?.reduce(
        (acc, param) => {
          if (param.key) acc[param.key] = param.value;
          return acc;
        },
        {} as Record<string, string>,
      ) || {},
      null,
      2,
    ),
  );

  // --- DataPath override ---
  const [customDataPath, setCustomDataPath] = useState(config.dataPath || "");

  // --- selectedFields override ---
  const [customSelectedFields, setCustomSelectedFields] = useState<string>(
    JSON.stringify(config.selectedFields || [], null, 2),
  );
  const [useCustomSelectedFields, setUseCustomSelectedFields] = useState(false);

  // --- Raw Mode state ---
  const [rawJsonParams, setRawJsonParams] = useState(
    JSON.stringify(
      {
        page: 1,
        limit: 100,
        headers: config.headers || {},
        queryParams:
          config.queryParams?.reduce(
            (acc, param) => {
              if (param.key) acc[param.key] = param.value;
              return acc;
            },
            {} as Record<string, string>,
          ) || {},
        selectedFields: config.selectedFields || [],
        dataPath: config.dataPath,
      },
      null,
      2,
    ),
  );

  const [, setFlattenedData] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const latestResult = lastExecutionResult;

  useEffect(() => {
    if (latestResult?.responsePreview) {
      setFlattenedData(flattenJson(latestResult.responsePreview));
    } else if (latestResult?.data) {
      setFlattenedData(flattenJson(latestResult.data));
    } else {
      setFlattenedData(null);
    }
  }, [latestResult]);

  // Sincronizza stati quando cambia la configurazione
  useEffect(() => {
    setCustomHeaders(JSON.stringify(config.headers || {}, null, 2));
    setCustomBody(JSON.stringify(config.body || {}, null, 2));
    setCustomQueryParams(
      JSON.stringify(
        config.queryParams?.reduce(
          (acc, param) => {
            if (param.key) acc[param.key] = param.value;
            return acc;
          },
          {} as Record<string, string>,
        ) || {},
        null,
        2,
      ),
    );
    setCustomSelectedFields(
      JSON.stringify(config.selectedFields || [], null, 2),
    );
    setCustomDataPath(config.dataPath || "");
    setUseCustomSelectedFields(false);
  }, [config]);
  useEffect(() => {
    console.log("[ExecuteTab] latestResult changed:", latestResult);
  }, [latestResult]);
  const handleExecute = async () => {
    let params: RuntimeParams = {};

    if (inputMode === "easy") {
      try {
        if (easyPage && easyPage.trim() !== "") {
          params.page = parseInt(easyPage, 10);
        }
        if (easyLimit && easyLimit.trim() !== "") {
          params.limit = parseInt(easyLimit, 10);
        }
        if (customDataPath !== undefined) {
          params.dataPath = customDataPath;
        }
        if (
          customHeaders &&
          customHeaders.trim() !== "" &&
          customHeaders !== "{}"
        ) {
          const parsed = JSON.parse(customHeaders);
          if (Object.keys(parsed).length > 0) {
            params.headers = parsed;
          }
        }
        if (
          customQueryParams &&
          customQueryParams.trim() !== "" &&
          customQueryParams !== "{}"
        ) {
          const parsed = JSON.parse(customQueryParams);
          if (Object.keys(parsed).length > 0) {
            params.queryParams = parsed;
          }
        }
        if (config.method !== "GET" && customBody && customBody.trim() !== "") {
          const parsed = JSON.parse(customBody);
          if (Object.keys(parsed).length > 0) {
            params.body = parsed;
          }
        }
        if (useCustomSelectedFields) {
          try {
            const parsed = JSON.parse(customSelectedFields);
            if (Array.isArray(parsed)) {
              params.selectedFields = parsed;
            }
          } catch {
            // ignore
          }
        } else if (config.selectedFields && config.selectedFields.length > 0) {
          params.selectedFields = config.selectedFields;
        }
      } catch (e) {
        alert("Errore nel formato JSON di Headers, Body o Query Parameters.");
        return;
      }
    } else {
      try {
        params = JSON.parse(rawJsonParams);
        if (config.dataPath && !params.dataPath) {
          params.dataPath = config.dataPath;
        }
      } catch (e) {
        alert("Il JSON inserito nella modalità RAW non è valido.");
        return;
      }
    }

    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([key, value]) => {
        if (key === "selectedFields" && Array.isArray(value)) return true;
        if (value === undefined || value === null) return false;
        if (typeof value === "string" && value.trim() === "") return false;
        if (
          typeof value === "object" &&
          !Array.isArray(value) &&
          Object.keys(value).length === 0
        )
          return false;
        if (
          Array.isArray(value) &&
          value.length === 0 &&
          key !== "selectedFields"
        )
          return false;
        return true;
      }),
    );

    await onExecute(config.id, cleanParams);
  };

  const formatSelectedFields = () => {
    const fields = useCustomSelectedFields
      ? (() => {
          try {
            return JSON.parse(customSelectedFields);
          } catch {
            return config.selectedFields || [];
          }
        })()
      : config.selectedFields || [];

    if (!fields || fields.length === 0) {
      return "Nessun campo selezionato";
    }

    return (
      fields
        .slice(0, 3)
        .map((field: string) => {
          const parts = field.split(".");
          return parts[parts.length - 1];
        })
        .join(", ") + (fields.length > 3 ? "..." : "")
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-zinc-100">
      {/* Data Path informativo */}
      {config.dataPath && (
        <Card className="bg-zinc-900 border-zinc-800 p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
            <p className="text-sm text-zinc-400">
              Data Path di default:{" "}
              <span className="text-indigo-400 font-mono">
                {config.dataPath}
              </span>
            </p>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Puoi sovrascriverlo negli advanced override.
          </p>
        </Card>
      )}

      {/* Toggle per selectedFields */}
      <Card className="bg-zinc-900 border-zinc-800 p-4 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-zinc-300">
              Campi da estrarre
            </span>
            <Badge
              variant="outline"
              className="ml-2 bg-indigo-500/10 text-indigo-400"
            >
              {useCustomSelectedFields
                ? (() => {
                    try {
                      const fields = JSON.parse(customSelectedFields);
                      return Array.isArray(fields) ? fields.length : 0;
                    } catch {
                      return 0;
                    }
                  })()
                : config.selectedFields?.length || 0}
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
              <div
                className={`block w-10 h-5 rounded-full transition-colors ${
                  useCustomSelectedFields ? "bg-indigo-600" : "bg-zinc-700"
                }`}
              ></div>
              <div
                className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${
                  useCustomSelectedFields ? "transform translate-x-5" : ""
                }`}
              ></div>
            </div>
            <span className="text-xs text-zinc-500">
              {useCustomSelectedFields ? "Custom" : "Default"}
            </span>
          </label>
        </div>

        <div className="mt-3 pt-3 border-t border-zinc-800 min-w-0">
          <p className="text-xs text-zinc-500 mb-2">
            {useCustomSelectedFields
              ? "Campi personalizzati:"
              : "Campi predefiniti:"}
          </p>
          {(() => {
            const allFields: string[] = useCustomSelectedFields
              ? (() => {
                  try {
                    return JSON.parse(customSelectedFields);
                  } catch {
                    return [];
                  }
                })()
              : config.selectedFields || [];

            if (!allFields || allFields.length === 0) {
              return (
                <p className="text-xs text-zinc-500 mb-2">
                  Nessun campo selezionato.
                </p>
              );
            }

                const MAX_VISIBLE_BADGES = 3;
                const visibleFields = allFields.slice(0, MAX_VISIBLE_BADGES);
                const hiddenCount = allFields.length - visibleFields.length;

           return (
                <div className=" mb-2">
                  {(isFieldsOpen ? allFields : visibleFields).map((field: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-zinc-800 text-zinc-300 font-mono text-xs whitespace-normal mr-2  mb-2 "
                    >
                      {field}
                    </Badge>
                  ))}

                  {hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsFieldsOpen(!isFieldsOpen)}
                      className="px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs border border-zinc-700 hover:bg-zinc-700 transition-colors"
                    >
                      {isFieldsOpen ? "mostra meno" : `+${hiddenCount} altri`}
                    </button>
                  )}
                </div>
              );
          })()}

          {useCustomSelectedFields && (
            <div>
              <Label className="text-xs text-zinc-400 mb-1 block">
                Modifica campi (JSON Array)
              </Label>
              <Textarea
                value={customSelectedFields}
                onChange={(e) => setCustomSelectedFields(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm min-h-[100px]"
                placeholder='["id", "name", "email"]'
              />
              <p className="text-xs text-zinc-500 mt-1">
                Array JSON di percorsi da estrarre (es. ["data.id",
                "data.name"])
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
                Advanced Overrides (Headers, Body, Query, Data Path)
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {/* Data Path Override */}
                <div>
                  <Label className="text-xs text-zinc-400 mb-1 block">
                    Data Path Override (opzionale)
                  </Label>
                  <Input
                    value={customDataPath}
                    onChange={(e) => setCustomDataPath(e.target.value)}
                    placeholder="es. data.items o lascia vuoto"
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm"
                  />
                </div>

                {/* Query Parameters */}
                <div>
                  <Label className="text-xs text-zinc-400 mb-1 block">
                    Query Parameters (JSON)
                  </Label>
                  <Textarea
                    value={customQueryParams}
                    onChange={(e) => setCustomQueryParams(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm min-h-[120px]"
                    placeholder='{"param1": "value1", "param2": "value2"}'
                  />
                </div>

                {/* Headers */}
                <div>
                  <Label className="text-xs text-zinc-400 mb-1 block">
                    Headers (JSON)
                  </Label>
                  <Textarea
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm min-h-[120px]"
                    placeholder='{"Content-Type": "application/json", "Authorization": "Bearer ..."}'
                  />
                </div>

                {/* Body */}
                {config.method !== "GET" && (
                  <div>
                    <Label className="text-xs text-zinc-400 mb-1 block">
                      Body (JSON)
                    </Label>
                    <Textarea
                      value={customBody}
                      onChange={(e) => setCustomBody(e.target.value)}
                      className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm min-h-[150px]"
                      placeholder='{"key": "value"}'
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
            className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white font-mono text-sm min-h-[200px]"
            placeholder={`{
  "page": 1,
  "limit": 100,
  "headers": {...},
  "queryParams": {...},
  "selectedFields": [...],
  "dataPath": "..."
}`}
          />
          <p className="text-xs text-zinc-500 mt-2">
            Includi <code>"selectedFields"</code> e <code>"dataPath"</code> per
            sovrascrivere.
          </p>
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleExecute}
        disabled={isExecuting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 gap-2"
      >
        {isExecuting ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isExecuting ? "Executing..." : "Run Extraction"}
      </Button>

      {/* Last execution raw JSON */}
      {latestResult && (
        <Card className="bg-zinc-900 border-zinc-800 p-3 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">
              Execution completed
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsResultModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white gap-2"
            >
              <Eye className="h-4 w-4" />
              View Full Results
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Click the button to see the result in JSON, Markdown, or HTML.
          </p>
        </Card>
      )}

      {/* Add the modal at the end of the component */}
      <ResultViewerModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        result={latestResult}
      />
      {/* Info Box (opzionale) */}
      <Card className="bg-zinc-900/50 border border-zinc-800 p-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          <p className="text-xs text-zinc-400">
            {useCustomSelectedFields
              ? "Campi personalizzati:"
              : "Campi predefiniti:"}{" "}
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
                : config.selectedFields?.length || 0}
            </span>
          </p>
        </div>
        <p className="text-xs text-zinc-500 mt-1">{formatSelectedFields()}</p>
      </Card>
    </div>
  );
}
