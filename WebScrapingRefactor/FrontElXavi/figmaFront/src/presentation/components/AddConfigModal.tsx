import { useState } from "react";
import { Sparkles, Loader2, FileCode, ChevronDown, ChevronRight, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import type { ApiConfig } from "../../domain/entities/ApiConfig";
import { useConfigController } from "../hooks/useConfigController";
import { ValidationError } from "../../domain/errors/AppError";

interface AddConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (config: ApiConfig) => void;
}

export function AddConfigModal({ isOpen, onClose, onAdd }: AddConfigModalProps) {
  const { saveConfig } = useConfigController();
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://");
  const [endpoint, setEndpoint] = useState("/");
  const [method, setMethod] = useState<"GET" | "POST">("GET");

  // Headers
  const [headers, setHeaders] = useState<Record<string, string>>({
    "Content-Type": "application/json",
  });

  // Body (for POST)
  const [bodyJson, setBodyJson] = useState("{\n  \n}");

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Smart Analyze states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedFields, setAnalyzedFields] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    // Simulate API analysis
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock discovered fields based on endpoint
    const mockFields = ["id", "name", "email", "created_at", "updated_at"];

    setAnalyzedFields(mockFields);
    setIsAnalyzing(false);
  };

  const handlePasteFromCurl = () => {
    // Mock cURL paste functionality
    setBaseUrl("https://api.example.com");
    setEndpoint("/v1/users");
    setMethod("GET");
    setHeaders({
      Authorization: "Bearer token123",
      "Content-Type": "application/json",
    });
  };

  const handleAddHeader = () => {
    const newKey = `Header-${Object.keys(headers).length + 1}`;
    setHeaders({ ...headers, [newKey]: "" });
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    setHeaders(newHeaders);
  };

  const handleHeaderKeyChange = (oldKey: string, newKey: string) => {
    const newHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([k, v]) => {
      if (k === oldKey) {
        newHeaders[newKey] = v;
      } else {
        newHeaders[k] = v;
      }
    });
    setHeaders(newHeaders);
  };

  const handleHeaderValueChange = (key: string, value: string) => {
    setHeaders({ ...headers, [key]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !baseUrl.trim() || !endpoint.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSaving(true);

    try {
      let bodyParams: Record<string, any> = {};
      if (method === "POST") {
        try {
          bodyParams = JSON.parse(bodyJson);
        } catch {
          setError("Invalid JSON in body parameters");
          setIsSaving(false);
          return;
        }
      }

      const newConfig = await saveConfig({
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        endpoint: endpoint.trim(),
        method,
        headers,
        bodyParams,
        paginationSettings: {
          offsetParam: "offset",
          limitParam: "limit",
          initialOffset: 0,
          limitPerPage: 50,
        },
        selectedFields: analyzedFields,
        executionHistory: [],
      });

      onAdd(newConfig);
      
      // Reset form
      setName("");
      setBaseUrl("https://");
      setEndpoint("/");
      setMethod("GET");
      setHeaders({ "Content-Type": "application/json" });
      setBodyJson("{\n  \n}");
      setAnalyzedFields([]);
      setShowAdvanced(false);
      setError(null);
      onClose();
    } catch (err) {
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
    setName("");
    setBaseUrl("https://");
    setEndpoint("/");
    setMethod("GET");
    setHeaders({ "Content-Type": "application/json" });
    setBodyJson("{\n  \n}");
    setAnalyzedFields([]);
    setShowAdvanced(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-white">
            Add New API Configuration
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Basic Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
              Basic Configuration
            </h3>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-zinc-300">
                Configuration Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My API Config"
                className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
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

              <div className="col-span-2 space-y-2">
                <Label htmlFor="baseUrl" className="text-sm text-zinc-300">
                  Base URL *
                </Label>
                <Input
                  id="baseUrl"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.example.com"
                  className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint" className="text-sm text-zinc-300">
                Endpoint Path *
              </Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/v1/data"
                className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
                required
              />
            </div>
          </div>

          {/* Headers */}
          <div className="space-y-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
                HTTP Headers
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddHeader}
                className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white gap-1 h-8"
              >
                <X className="h-3.5 w-3.5 rotate-45" />
                Add Header
              </Button>
            </div>

            <div className="space-y-2">
              {Object.entries(headers).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <Input
                    value={key}
                    onChange={(e) => handleHeaderKeyChange(key, e.target.value)}
                    placeholder="Header name"
                    className="flex-1 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                  />
                  <Input
                    value={value}
                    onChange={(e) => handleHeaderValueChange(key, e.target.value)}
                    placeholder="Header value"
                    className="flex-1 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveHeader(key)}
                    className="bg-zinc-900 border-zinc-800 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Body Parameters (POST only) */}
          {method === "POST" && (
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
                Body Parameters (JSON)
              </h3>
              <Textarea
                value={bodyJson}
                onChange={(e) => setBodyJson(e.target.value)}
                placeholder='{\n  "key": "value"\n}'
                className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm min-h-[150px]"
              />
            </div>
          )}

          {/* Advanced Settings */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              {showAdvanced ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Advanced Settings
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Smart Tools</span>
                  
                  <div className="flex gap-2">
                    {/* cURL Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePasteFromCurl}
                      className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white gap-2 h-8"
                    >
                      <FileCode className="h-3.5 w-3.5" />
                      Paste cURL
                    </Button>

                    {/* Analyze Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white gap-2 h-8"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          Analyze API
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {analyzedFields.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-zinc-400">
                      Discovered Fields:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {analyzedFields.map((field) => (
                        <span
                          key={field}
                          className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs border border-indigo-500/30"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

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
      </DialogContent>
    </Dialog>
  );
}