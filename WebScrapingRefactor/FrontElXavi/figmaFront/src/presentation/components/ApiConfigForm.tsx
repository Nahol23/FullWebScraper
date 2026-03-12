import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { X, Plus, Download, Loader2, FileCode } from "lucide-react";
import type { KeyValueRow } from "../components/AddConfigModal";

interface ApiConfigFormProps {
  baseUrl: string;
  setBaseUrl: (val: string) => void;
  endpoint: string;
  setEndpoint: (val: string) => void;
  queryRows: KeyValueRow[];
  setQueryRows: React.Dispatch<React.SetStateAction<KeyValueRow[]>>;
  dataPath: string;
  setDataPath: (val: string) => void;
  availableFields: string[];
  selectedFields: string[];
  setSelectedFields: React.Dispatch<React.SetStateAction<string[]>>;
  selectAll: boolean;
  setSelectAll: (val: boolean) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysisResult: any;
  lastAnalysis: any;
  onViewDetails: () => void;
  onDownloadFields: (format: "json" | "markdown" | "html") => void;
  addRow: (setter: React.Dispatch<React.SetStateAction<KeyValueRow[]>>) => void;
  removeRow: (id: string, setter: React.Dispatch<React.SetStateAction<KeyValueRow[]>>) => void;
  updateRow: (id: string, field: "key" | "value", newValue: string, setter: React.Dispatch<React.SetStateAction<KeyValueRow[]>>) => void;
}

export function ApiConfigForm({
  baseUrl,
  setBaseUrl,
  endpoint,
  setEndpoint,
  queryRows,
  setQueryRows,
  dataPath,
  setDataPath,
  availableFields,
  selectedFields,
  setSelectedFields,
  selectAll,
  setSelectAll,
  onAnalyze,
  isAnalyzing,
  lastAnalysis,
  onViewDetails,
  onDownloadFields,
  addRow,
  removeRow,
  updateRow,
}: ApiConfigFormProps) {
  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setSelectedFields(newSelectAll ? [...availableFields] : []);
  };

  return (
    <div className="space-y-6">
      {/* Base URL & Endpoint */}
      <div className="grid grid-cols-3 gap-4">
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
        <div className="space-y-2">
          <Label htmlFor="endpoint" className="text-sm text-zinc-300">
            Endpoint *
          </Label>
          <Input
            id="endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/v1/data"
            className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
            required
          />
        </div>
      </div>

      {/* Query Parameters */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
            Query Parameters
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addRow(setQueryRows)}
            className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white gap-1 h-8"
          >
            <Plus className="h-3.5 w-3.5" /> Add Param
          </Button>
        </div>

        <div className="space-y-2">
          {queryRows.map((row) => (
            <div key={row.id} className="flex gap-2">
              <Input
                value={row.key}
                onChange={(e) => updateRow(row.id, "key", e.target.value, setQueryRows)}
                placeholder="Key"
                className="flex-1 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
              />
              <Input
                value={row.value}
                onChange={(e) => updateRow(row.id, "value", e.target.value, setQueryRows)}
                placeholder="Value"
                className="flex-1 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeRow(row.id, setQueryRows)}
                className="bg-zinc-900 border-zinc-800 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {queryRows.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4 italic">
              No query parameters.
            </p>
          )}
        </div>
      </div>

      {/* Analysis Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
            API Analysis
          </h3>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white gap-2 h-8"
            >
              {isAnalyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileCode className="h-3.5 w-3.5" />
              )}
              {isAnalyzing ? "Analyzing..." : "Analyze API"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataPath" className="text-sm text-zinc-300">
            Data Path (Optional)
          </Label>
          <Input
            id="dataPath"
            value={dataPath}
            onChange={(e) => setDataPath(e.target.value)}
            placeholder="e.g. data.results"
            className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
          />
        </div>

        {availableFields.length > 0 && (
          <div className="space-y-3 mt-4 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-zinc-400">
                Discovered Fields ({selectedFields.length}/{availableFields.length} selected):
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="text-xs h-7 px-2 text-indigo-400 hover:text-indigo-300"
              >
                {selectAll ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="max-h-[200px] overflow-y-auto space-y-1 border border-zinc-800 rounded-lg p-2">
              {availableFields.map((field) => (
                <div
                  key={field}
                  className="flex items-center gap-2 p-1 hover:bg-zinc-800/50 rounded"
                >
                  <Checkbox
                    checked={selectedFields.includes(field)}
                    onCheckedChange={(checked) => {
                      if (typeof checked === "boolean") {
                        if (checked) {
                          setSelectedFields((prev) => [...prev, field]);
                        } else {
                          setSelectedFields((prev) => prev.filter((f) => f !== field));
                        }
                        setSelectAll(false);
                      }
                    }}
                    className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <span className="text-xs font-mono text-zinc-300 flex-1 cursor-default">
                    {field}
                  </span>
                </div>
              ))}
            </div>

            {selectedFields.length > 0 && (
              <div className="flex gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadFields("json")}
                  className="flex-1 bg-zinc-900 border-zinc-800 text-xs h-8 gap-1"
                >
                  <Download className="h-3 w-3" /> JSON
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadFields("markdown")}
                  className="flex-1 bg-zinc-900 border-zinc-800 text-xs h-8 gap-1"
                >
                  <Download className="h-3 w-3" /> Markdown
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadFields("html")}
                  className="flex-1 bg-zinc-900 border-zinc-800 text-xs h-8 gap-1"
                >
                  <Download className="h-3 w-3" /> HTML
                </Button>
              </div>
            )}
          </div>
        )}

        {lastAnalysis && (
          <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4">
            <h4 className="text-sm font-medium text-zinc-300">Analysis Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-zinc-500">URL:</span>
              <span className="text-zinc-300 font-mono truncate">{lastAnalysis.url}</span>
              <span className="text-zinc-500">Method:</span>
              <span className="text-zinc-300">{lastAnalysis.method}</span>
              <span className="text-zinc-500">Status:</span>
              <span className="text-emerald-400">{lastAnalysis.status}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="mt-2 w-full bg-zinc-800 border-zinc-700 hover:bg-zinc-700"
            >
              <FileCode className="h-3.5 w-3.5 mr-2" />
              View Full Analysis
            </Button>
          </div>
        )}
      </div>

      {/* Pagination preview */}
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-3">
        <p className="text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">Pagination:</span> Default settings will be applied
        </p>
        <p className="text-xs text-zinc-500 mt-1 font-mono">
          {baseUrl.replace(/\/$/, "")}
          {endpoint.startsWith("/") ? endpoint : "/" + endpoint}
          ?offset=0&limit=50
        </p>
      </div>
    </div>
  );
}