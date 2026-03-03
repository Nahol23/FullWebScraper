import { useState, useEffect } from "react";
import { Loader2, X, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import type { ApiConfig, ApiParam } from "../../domain/entities/ApiConfig";
import type { ScrapingConfig, ExtractionRule } from "../../domain/entities/ScrapingConfig";
import { useConfigController } from "../hooks/useConfigController";
import { useScrapingConfigController } from "../hooks/useScrapingConfigController";
import { useAnalysisController } from "../hooks/useAnalysisController";
import { useScrapingExecutionController } from "../hooks/useScrapingExecutionController";
import { ValidationError } from "../../domain/errors/AppError";
import { AnalysisDetailsModal } from "./AnalysisDetailsModal";
import { ApiConfigForm } from "./ApiConfigForm";
import { ScrapingConfigForm } from "./ScrapingConfigForm";

export interface KeyValueRow {
  id: string;
  key: string;
  value: string;
}

interface AddConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (config: ApiConfig | ScrapingConfig) => void;
}

export function AddConfigModal({
  isOpen,
  onClose,
  onAdd,
}: AddConfigModalProps) {
  // Stato per il tipo di configurazione
  const [configType, setConfigType] = useState<"api" | "scraping">("api");

  // Hook per API
  const { saveConfig } = useConfigController();
  const {
    analyzeApi,
    isAnalyzing: isApiAnalyzing,
    error: apiAnalysisError,
    clearError: clearApiAnalysisError,
    lastAnalysis: apiLastAnalysis,
  } = useAnalysisController();

  // Hook per Scraping
  const { saveConfig: saveScrapingConfig } = useScrapingConfigController();
  const {
    analyze: analyzeScraping,
    isAnalyzing: isScrapingAnalyzing,
    error: scrapingAnalysisError,
    clearError: clearScrapingAnalysisError,
  } = useScrapingExecutionController();

  // Campi comuni
  const [name, setName] = useState("");
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [headerRows, setHeaderRows] = useState<KeyValueRow[]>([
    { id: "1", key: "Content-Type", value: "application/json" },
  ]);
  const [bodyJson, setBodyJson] = useState("{\n  \n}");

  // Campi specifici API
  const [baseUrl, setBaseUrl] = useState("https://");
  const [endpoint, setEndpoint] = useState("/");
  const [queryRows, setQueryRows] = useState<KeyValueRow[]>([]);
  const [dataPath, setDataPath] = useState("");
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [apiAnalysisResult, setApiAnalysisResult] = useState<any>(null);

  // Campi specifici Scraping
  const [url, setUrl] = useState("https://");
  const [rules, setRules] = useState<ExtractionRule[]>([]);
  const [containerSelector, setContainerSelector] = useState("");
  const [waitForSelector, setWaitForSelector] = useState("");
  const [pagination, setPagination] = useState<{
    type: "urlParam" | "nextSelector";
    paramName: string;
    maxPages: number;
  }>({
    type: "urlParam",
    paramName: "page",
    maxPages: 1,
  });
  const [scrapingAnalysis, setScrapingAnalysis] = useState<any>(null);

  // Stato comune
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const defaultPagination = {
    type: "offset" as const,
    paramName: "offset",
    limitParam: "limit",
    defaultLimit: 50,
  };

  // Sincronizza errori degli hook
  useEffect(() => {
    if (apiAnalysisError) {
      setError(apiAnalysisError);
      clearApiAnalysisError();
    }
  }, [apiAnalysisError, clearApiAnalysisError]);

  useEffect(() => {
    if (scrapingAnalysisError) {
      setError(scrapingAnalysisError);
      clearScrapingAnalysisError();
    }
  }, [scrapingAnalysisError, clearScrapingAnalysisError]);

  // Utility per righe key-value
  const addRow = (setter: React.Dispatch<React.SetStateAction<KeyValueRow[]>>) => {
    setter((prev) => [
      ...prev,
      { id: crypto.randomUUID(), key: "", value: "" },
    ]);
  };

  const removeRow = (
    id: string,
    setter: React.Dispatch<React.SetStateAction<KeyValueRow[]>>
  ) => {
    setter((prev) => prev.filter((row) => row.id !== id));
  };

  const updateRow = (
    id: string,
    field: "key" | "value",
    newValue: string,
    setter: React.Dispatch<React.SetStateAction<KeyValueRow[]>>
  ) => {
    setter((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: newValue } : row))
    );
  };

  // Analisi API
  const handleAnalyzeApi = async () => {
    setError(null);
    setApiAnalysisResult(null);
    setAvailableFields([]);
    setSelectedFields([]);
    setSelectAll(false);

    try {
      const cleanBaseUrl = baseUrl.replace(/\/$/, "");
      const cleanEndpoint = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
      const fullUrl = cleanBaseUrl + cleanEndpoint;

      const headers: Record<string, string> = {};
      headerRows.forEach((row) => {
        if (row.key.trim()) headers[row.key.trim()] = row.value;
      });

      let body: any = undefined;
      if (method === "POST" && bodyJson.trim()) {
        try {
          body = JSON.parse(bodyJson);
        } catch {
          setError("Invalid JSON in body parameters");
          return;
        }
      }

      const analysis = await analyzeApi({
        url: fullUrl,
        method,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body,
      });

      setApiAnalysisResult(analysis);

      let fields: string[] = [];
      if (analysis.suggestedFields && Array.isArray(analysis.suggestedFields)) {
        fields = analysis.suggestedFields;
      } else if (analysis.discoveredSchema?.suggestedFields) {
        fields = analysis.discoveredSchema.suggestedFields;
      } else if (analysis.fields && Array.isArray(analysis.fields)) {
        fields = analysis.fields;
      } else if (analysis.data && typeof analysis.data === "object") {
        fields = Object.keys(analysis.data);
      }

      setAvailableFields(fields);
      if (fields.length > 0) {
        setSelectAll(true);
        setSelectedFields(fields);
      }

      if (analysis.discoveredSchema?.dataPath) {
        setDataPath(analysis.discoveredSchema.dataPath);
      } else if (analysis.dataPath) {
        setDataPath(analysis.dataPath);
      }
    } catch (err) {
      console.error("[AddConfigModal] API Analysis error:", err);
    }
  };

  // Analisi Scraping
  const handleAnalyzeScraping = async () => {
    setError(null);
    setScrapingAnalysis(null);
    setRules([]);

    try {
      const headers: Record<string, string> = {};
      headerRows.forEach((row) => {
        if (row.key.trim()) headers[row.key.trim()] = row.value;
      });

      let parsedBody: any = undefined;
      if (method === "POST" && bodyJson.trim()) {
        try {
          parsedBody = JSON.parse(bodyJson);
        } catch {
          setError("Invalid JSON in body parameters");
          return;
        }
      }

      const result = await analyzeScraping(url, {
        method,
        headers,
        body: parsedBody,
        useJavaScript: !!waitForSelector,
        waitForSelector: waitForSelector || undefined,
      });

      setScrapingAnalysis(result);
      if (result.suggestedRules) {
        setRules(result.suggestedRules.map((rule: any) => ({ ...rule, selected: true })));
      }
      if (result.suggestedContainer) {
        setContainerSelector(result.suggestedContainer);
      }
    } catch (err) {
      console.error("[AddConfigModal] Scraping Analysis error:", err);
    }
  };

  const handleDownloadFields = (format: "json" | "markdown" | "html") => {
    if (!apiAnalysisResult) return;

    let content = "";
    let mime = "";
    let ext = "";

    const dataToExport = {
      fields: selectedFields,
      dataPath: dataPath,
      timestamp: new Date().toISOString(),
      url: `${baseUrl}${endpoint}`,
      method: method,
      ...(apiAnalysisResult && { fullAnalysis: apiAnalysisResult }),
    };

    if (format === "json") {
      content = JSON.stringify(dataToExport, null, 2);
      mime = "application/json";
      ext = "json";
    } else if (format === "markdown") {
      content = `# API Analysis Report\n\n`;
      content += `- **URL**: ${baseUrl}${endpoint}\n`;
      content += `- **Method**: ${method}\n`;
      content += `- **Data Path**: ${dataPath || "(root)"}\n`;
      content += `- **Analyzed at**: ${new Date().toLocaleString()}\n\n`;
      content += `## Selected Fields (${selectedFields.length})\n\n`;

      if (selectedFields.length > 0) {
        content += `| Field |\n`;
        content += `|-------|\n`;
        selectedFields.forEach((field) => {
          const escapedField = field.replace(/\|/g, "\\|");
          content += `| \`${escapedField}\` |\n`;
        });
      } else {
        content += `No fields selected.\n`;
      }

      mime = "text/markdown";
      ext = "md";
    } else if (format === "html") {
      content = `<!DOCTYPE html>
<html>
<head>
  <title>API Analysis Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #111; color: #fff; padding: 2rem; }
    h1 { color: #818cf8; }
    .field { background: #1f2937; padding: 0.5rem; border-radius: 0.375rem; margin: 0.25rem 0; }
    .field code { color: #94a3b8; }
    .stats { color: #9ca3af; }
  </style>
</head>
<body>
  <h1>API Analysis Report</h1>
  <div class="stats">
    <p><strong>URL:</strong> ${baseUrl}${endpoint}</p>
    <p><strong>Method:</strong> ${method}</p>
    <p><strong>Data Path:</strong> ${dataPath || "(root)"}</p>
    <p><strong>Analyzed at:</strong> ${new Date().toLocaleString()}</p>
  </div>
  <h2>Selected Fields (${selectedFields.length})</h2>
  <div>
    ${selectedFields.map((field) => `<div class="field"><code>${field}</code></div>`).join("")}
  </div>
</body>
</html>`;
      mime = "text/html";
      ext = "html";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `api-analysis.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Configuration name is required");
      return;
    }

    setIsSaving(true);

    try {
      const headersObject: Record<string, string> = {};
      headerRows.forEach((row) => {
        if (row.key.trim()) headersObject[row.key] = row.value;
      });

      let bodyPayload: any = undefined;
      if (method === "POST" && bodyJson.trim()) {
        try {
          bodyPayload = JSON.parse(bodyJson);
        } catch {
          setError("Invalid JSON in body parameters");
          setIsSaving(false);
          return;
        }
      }

      if (configType === "api") {
        // Validazione API
        if (!baseUrl.trim() || !endpoint.trim()) {
          setError("Base URL and Endpoint are required");
          setIsSaving(false);
          return;
        }

        const validQueryParams: ApiParam[] = queryRows
          .filter((row) => row.key && row.key.trim() !== "")
          .map((row) => ({
            key: row.key.trim(),
            value: row.value?.trim() || "",
          }));

        const configPayload: Omit<ApiConfig, "id"> = {
          name: name.trim(),
          baseUrl: baseUrl.trim(),
          endpoint: endpoint.trim(),
          method,
          ...(Object.keys(headersObject).length > 0 && { headers: headersObject }),
          ...(validQueryParams.length > 0 && { queryParams: validQueryParams }),
          ...(method === "POST" && bodyPayload && { body: bodyPayload }),
          ...(dataPath.trim() && { dataPath: dataPath.trim() }),
          pagination: defaultPagination,
          ...(selectedFields.length > 0 && { selectedFields }),
          executionHistory: [],
        };

        const newConfig = await saveConfig(configPayload);
        onAdd(newConfig);
      } else {
        // Validazione Scraping
        if (!url.trim()) {
          setError("URL is required");
          setIsSaving(false);
          return;
        }

        const selectedRules = rules
          .filter((r: any) => r.selected)
          .map(({ selected, ...rule }: any) => rule);

        const configPayload: Omit<ScrapingConfig, "id"> = {
          name: name.trim(),
          url: url.trim(),
          method,
          ...(Object.keys(headersObject).length > 0 && { headers: headersObject }),
          ...(method === "POST" && bodyPayload && { body: bodyPayload }),
          rules: selectedRules,
          ...(containerSelector.trim() && { containerSelector: containerSelector.trim() }),
          ...(waitForSelector.trim() && { waitForSelector: waitForSelector.trim() }),
          pagination: pagination.maxPages > 1 ? pagination : undefined,
        };

        const newConfig = await saveScrapingConfig(configPayload);
        onAdd(newConfig);
      }

      handleClose();
    } catch (err) {
      console.error("[AddConfigModal] Save error:", err);
      if (err instanceof ValidationError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to save configuration");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset API state
    setName("");
    setMethod("GET");
    setHeaderRows([{ id: "1", key: "Content-Type", value: "application/json" }]);
    setBodyJson("{\n  \n}");
    setError(null);

    // Reset API specific
    setBaseUrl("https://");
    setEndpoint("/");
    setQueryRows([]);
    setDataPath("");
    setAvailableFields([]);
    setSelectedFields([]);
    setSelectAll(false);
    setApiAnalysisResult(null);

    // Reset Scraping specific
    setUrl("https://");
    setRules([]);
    setContainerSelector("");
    setWaitForSelector("");
    setPagination({ type: "urlParam", paramName: "page", maxPages: 1 });
    setScrapingAnalysis(null);

    setConfigType("api");
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-white">
              Add New Configuration
            </DialogTitle>
            <DialogDescription className="sr-only">
              Fill in the details to create a new API or scraping configuration.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={configType} onValueChange={(v) => setConfigType(v as "api" | "scraping")}>
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800 mb-4">
              <TabsTrigger
                value="api"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              >
                API
              </TabsTrigger>
              <TabsTrigger
                value="scraping"
                className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
              >
                Web Scraping
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Campi comuni (nome, metodo, headers, body) */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-zinc-300">
                    Configuration Name *
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Config"
                    className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method" className="text-sm text-zinc-300">
                    HTTP Method
                  </Label>
                  <select
                    id="method"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as "GET" | "POST")}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-zinc-300">HTTP Headers</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addRow(setHeaderRows)}
                      className="bg-zinc-800 hover:bg-zinc-700 border-0 text-white gap-1 h-8"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Header
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {headerRows.map((row) => (
                      <div key={row.id} className="flex gap-2">
                        <Input
                          value={row.key}
                          onChange={(e) => updateRow(row.id, "key", e.target.value, setHeaderRows)}
                          placeholder="Header Key"
                          className="flex-1 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                        />
                        <Input
                          value={row.value}
                          onChange={(e) => updateRow(row.id, "value", e.target.value, setHeaderRows)}
                          placeholder="Header Value"
                          className="flex-1 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeRow(row.id, setHeaderRows)}
                          className="bg-zinc-900 border-zinc-800 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {method === "POST" && (
                  <div className="space-y-2">
                    <Label className="text-sm text-zinc-300">Body (JSON)</Label>
                    <Textarea
                      value={bodyJson}
                      onChange={(e) => setBodyJson(e.target.value)}
                      placeholder='{\n  "key": "value"\n}'
                      className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm min-h-[150px]"
                    />
                  </div>
                )}
              </div>

              {/* Form specifico per API */}
              <TabsContent value="api" className="mt-0 space-y-6">
                <ApiConfigForm
                  baseUrl={baseUrl}
                  setBaseUrl={setBaseUrl}
                  endpoint={endpoint}
                  setEndpoint={setEndpoint}
                  queryRows={queryRows}
                  setQueryRows={setQueryRows}
                  dataPath={dataPath}
                  setDataPath={setDataPath}
                  availableFields={availableFields}
                  selectedFields={selectedFields}
                  setSelectedFields={setSelectedFields}
                  selectAll={selectAll}
                  setSelectAll={setSelectAll}
                  onAnalyze={handleAnalyzeApi}
                  isAnalyzing={isApiAnalyzing}
                  analysisResult={apiAnalysisResult}
                  lastAnalysis={apiLastAnalysis}
                  onViewDetails={() => setIsDetailsModalOpen(true)}
                  onDownloadFields={handleDownloadFields}
                  addRow={addRow}
                  removeRow={removeRow}
                  updateRow={updateRow}
                />
              </TabsContent>

              {/* Form specifico per Scraping */}
              <TabsContent value="scraping" className="mt-0 space-y-6">
                <ScrapingConfigForm
                  url={url}
                  setUrl={setUrl}
                  rules={rules}
                  setRules={setRules}
                  containerSelector={containerSelector}
                  setContainerSelector={setContainerSelector}
                  waitForSelector={waitForSelector}
                  setWaitForSelector={setWaitForSelector}
                  pagination={pagination}
                  setPagination={setPagination}
                  onAnalyze={handleAnalyzeScraping}
                  isAnalyzing={isScrapingAnalyzing}
                  analysisResult={scrapingAnalysis}
                />
              </TabsContent>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Configuration"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AnalysisDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        analysis={apiLastAnalysis}
      />
    </>
  );
}