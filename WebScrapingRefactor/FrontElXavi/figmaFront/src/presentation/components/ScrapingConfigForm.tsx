import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { X, Plus, Loader2, Sparkles } from "lucide-react";
import type { ExtractionRule } from "../../domain/entities/ScrapingConfig";

export interface SelectableExtractionRule extends ExtractionRule {
  selected?: boolean;
}

export interface ScrapingConfigFormProps {
  url: string;
  setUrl: (val: string) => void;
  method?: string;
  setMethod?: (val: "GET" | "POST") => void;
  headers?: Record<string, string>;
  setHeaders?: (headers: Record<string, string>) => void;
  body?: any;
  setBody?: (body: any) => void;
  rules: SelectableExtractionRule[];
  setRules: React.Dispatch<React.SetStateAction<SelectableExtractionRule[]>>;
  containerSelector: string;
  setContainerSelector: (val: string) => void;
  waitForSelector: string;
  setWaitForSelector: (val: string) => void;
  pagination: {
    type: "urlParam" | "nextSelector";
    selector?: string;
    paramName?: string;
    maxPages?: number;
  };
  setPagination: React.Dispatch<
    React.SetStateAction<{
      type: "urlParam" | "nextSelector";
      selector?: string;
      paramName?: string;
      maxPages?: number;
    }>
  >;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  analysisResult: any;
  selectAllRules?: boolean;
  setSelectAllRules?: (val: boolean) => void;
}

export function ScrapingConfigForm({
  url,
  setUrl,
  method = "GET",
  setMethod,
  headers = {},
  setHeaders,
  body,
  setBody,
  rules,
  setRules,
  containerSelector,
  setContainerSelector,
  waitForSelector,
  setWaitForSelector,
  pagination,
  setPagination,
  onAnalyze,
  isAnalyzing,
  analysisResult,
  selectAllRules = false,
  setSelectAllRules,
}: ScrapingConfigFormProps) {
  // Keep raw string so user can type freely without JSON.parse interrupting
  const [bodyRaw, setBodyRaw] = useState<string>(() => {
    if (!body) return "";
    if (typeof body === "string") return body;
    try { return JSON.stringify(body, null, 2); } catch { return ""; }
  });

  // Sync bodyRaw when body prop changes from outside (e.g. on config open)
  useEffect(() => {
    if (!body) { setBodyRaw(""); return; }
    if (typeof body === "string") { setBodyRaw(body); return; }
    try { setBodyRaw(JSON.stringify(body, null, 2)); } catch { setBodyRaw(""); }
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  const handleBodyChange = (value: string) => {
    setBodyRaw(value);
    if (!setBody) return;
    // Always store the raw string — caller is responsible for parsing on submit
    try {
      setBody(JSON.parse(value));
    } catch {
      // Keep the string so parent can show it, but don't crash
      setBody(value);
    }
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        fieldName: "",
        selector: "",
        attribute: "text",
        multiple: false,
        selected: true,
      },
    ]);
  };

  const updateRule = (
    index: number,
    field: keyof ExtractionRule,
    value: any,
  ) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const addHeader = () => {
    if (setHeaders) {
      const newKey = `header-${Object.keys(headers).length + 1}`;
      setHeaders({ ...headers, [newKey]: "" });
    }
  };

  const updateHeader = (oldKey: string, newKey: string, value: string) => {
    if (setHeaders) {
      const newHeaders = { ...headers };
      delete newHeaders[oldKey];
      newHeaders[newKey] = value;
      setHeaders(newHeaders);
    }
  };

  const removeHeader = (key: string) => {
    if (setHeaders) {
      const newHeaders = { ...headers };
      delete newHeaders[key];
      setHeaders(newHeaders);
    }
  };

  const handleSelectAllRules = () => {
    if (setSelectAllRules) {
      const newSelectAll = !selectAllRules;
      setSelectAllRules(newSelectAll);
      setRules((prev) =>
        prev.map((rule) => ({ ...rule, selected: newSelectAll })),
      );
    }
  };

  const handleRuleSelect = (index: number, selected: boolean) => {
    setRules((prev) => {
      const newRules = [...prev];
      newRules[index] = { ...newRules[index], selected };
      return newRules;
    });
    if (setSelectAllRules) {
      setSelectAllRules(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full overflow-hidden">
      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="url" className="text-sm text-zinc-300">
          URL *
        </Label>
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/page"
          className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
          required
        />
      </div>

      {/* Method (if provided) */}
      {setMethod && (
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
      )}

      {/* Headers (if provided) */}
      {setHeaders && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-300">HTTP Headers</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addHeader}
              className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white gap-1 h-8"
            >
              <Plus className="h-3.5 w-3.5" /> Add Header
            </Button>
          </div>
          <div className="space-y-2">
            {Object.entries(headers).map(([key, value], index) => (
              <div key={index} className="flex gap-2 min-w-0">
                <Input
                  value={key}
                  onChange={(e) => updateHeader(key, e.target.value, value)}
                  placeholder="Header Key"
                  className="flex-1 min-w-0 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                />
                <Input
                  value={value}
                  onChange={(e) => updateHeader(key, key, e.target.value)}
                  placeholder="Header Value"
                  className="flex-1 min-w-0 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeHeader(key)}
                  className="bg-zinc-900 border-zinc-800 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {Object.keys(headers).length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4 italic">
                No headers.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Body (if POST and setBody provided) */}
      {setBody && method === "POST" && (
        <div className="space-y-2">
          <Label htmlFor="body" className="text-sm text-zinc-300">
            Body (JSON)
          </Label>
          <textarea
            id="body"
            value={bodyRaw}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder='{\n  "key": "value"\n}'
            rows={5}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
      )}

      {/* Analyze Button */}
      <div className="flex justify-end">
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
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {isAnalyzing ? "Analyzing..." : "Analyze Page"}
        </Button>
      </div>

      {/* Container Selector */}
      <div className="space-y-2">
        <Label htmlFor="containerSelector" className="text-sm text-zinc-300">
          Container Selector (optional)
        </Label>
        <Input
          id="containerSelector"
          value={containerSelector}
          onChange={(e) => setContainerSelector(e.target.value)}
          placeholder="e.g. .exhibitor, tr.item"
          className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
        />
        <p className="text-xs text-zinc-500">
          CSS selector for the element that contains each repeated item.
        </p>
      </div>

      {/* Extraction Rules */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
            Extraction Rules
          </h3>
          <div className="flex gap-2">
            {setSelectAllRules && rules.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllRules}
                className="bg-zinc-800 hover:bg-zinc-700 border-0 text-white text-xs h-8"
              >
                {selectAllRules ? "Deselect All" : "Select All"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRule}
              className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white gap-1 h-8"
            >
              <Plus className="h-3.5 w-3.5" /> Add Rule
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div
              key={index}
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={rule.selected || false}
                  onChange={(e) => handleRuleSelect(index, e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900 flex-shrink-0"
                />
                <Input
                  value={rule.fieldName}
                  onChange={(e) =>
                    updateRule(index, "fieldName", e.target.value)
                  }
                  placeholder="Field name"
                  className="flex-1 min-w-0 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                />
                <Input
                  value={rule.selector}
                  onChange={(e) =>
                    updateRule(index, "selector", e.target.value)
                  }
                  placeholder="CSS selector"
                  className="flex-1 min-w-0 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeRule(index)}
                  className="bg-zinc-900 border-zinc-800 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4 ml-6">
                <select
                  value={rule.attribute || "text"}
                  onChange={(e) =>
                    updateRule(index, "attribute", e.target.value as any)
                  }
                  className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs text-white"
                >
                  <option value="text">Text</option>
                  <option value="html">HTML</option>
                  <option value="href">Href</option>
                  <option value="src">Src</option>
                  <option value="innerText">Inner Text</option>
                  <option value="style">Style (background-image)</option>{" "}
                </select>
                <label className="flex items-center gap-1 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={rule.multiple || false}
                    onChange={(e) =>
                      updateRule(index, "multiple", e.target.checked)
                    }
                    className="rounded border-zinc-600"
                  />
                  Multiple
                </label>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4 italic">
              No extraction rules defined.
            </p>
          )}
        </div>
      </div>

      {/* Wait For Selector */}
      <div className="space-y-2">
        <Label htmlFor="waitForSelector" className="text-sm text-zinc-300">
          Wait For Selector (optional)
        </Label>
        <Input
          id="waitForSelector"
          value={waitForSelector}
          onChange={(e) => setWaitForSelector(e.target.value)}
          placeholder="e.g. .loaded-content"
          className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
        />
        <p className="text-xs text-zinc-500">
          Wait for this selector to appear before extracting data (useful for
          dynamic pages).
        </p>
      </div>

      {/* Pagination */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
          Pagination
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Type</Label>
            <select
              value={pagination.type}
              onChange={(e) =>
                setPagination((prev) => ({
                  ...prev,
                  type: e.target.value as "urlParam" | "nextSelector",
                }))
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-white text-sm"
            >
              <option value="urlParam">URL Parameter</option>
              <option value="nextSelector">Next Selector</option>
            </select>
          </div>
          {pagination.type === "urlParam" ? (
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Parameter Name</Label>
              <Input
                value={pagination.paramName || "page"}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    paramName: e.target.value,
                  }))
                }
                placeholder="page"
                className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Next Selector</Label>
              <Input
                value={pagination.selector || ""}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    selector: e.target.value,
                  }))
                }
                placeholder="a.next"
                className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Max Pages</Label>
            <Input
              type="number"
              value={pagination.maxPages || 1}
              onChange={(e) =>
                setPagination((prev) => ({
                  ...prev,
                  maxPages: parseInt(e.target.value) || 1,
                }))
              }
              min="1"
              className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Sample Data Preview */}
      {analysisResult && (
        <div className="space-y-2 border-t border-zinc-800 pt-4">
          <h4 className="text-sm font-medium text-zinc-300">Analysis Result</h4>

          {/* Suggested Rules con selezione */}
          {analysisResult.suggestedRules &&
            analysisResult.suggestedRules.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-medium text-zinc-400">
                    Suggested Rules:
                  </h5>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newRules = analysisResult.suggestedRules.map(
                        (rule: any) => ({
                          ...rule,
                          selected: true,
                        }),
                      );
                      setRules((prev) => [...prev, ...newRules]);
                      if (setSelectAllRules) setSelectAllRules(true);
                    }}
                    className="text-xs h-6 px-2 text-indigo-400 hover:text-indigo-300"
                  >
                    Add All
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {analysisResult.suggestedRules.map(
                    (rule: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 bg-zinc-900/50 rounded border border-zinc-800 hover:border-zinc-700"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-400 font-medium text-sm">
                              {rule.fieldName}
                            </span>
                            <span className="text-zinc-600 text-xs">→</span>
                            <span className="text-zinc-300 font-mono text-xs">
                              {rule.selector}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-1">
                            {rule.attribute && rule.attribute !== "text" && (
                              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
                                {rule.attribute}
                              </span>
                            )}
                            {rule.multiple && (
                              <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded">
                                multiple
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          className="text-indigo-500 hover:text-indigo-400 text-xs px-2 py-1 rounded hover:bg-indigo-500/10"
                          onClick={() => {
                            setRules((prev) => [
                              ...prev,
                              { ...rule, selected: true },
                            ]);
                          }}
                        >
                          Add
                        </button>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Sample Data */}
          {analysisResult.sampleData && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-zinc-400 mb-1">
                Sample Data:
              </h5>
              <pre className="text-xs bg-zinc-900 p-3 rounded-lg overflow-x-auto max-h-60 text-zinc-300 whitespace-pre-wrap break-words max-w-full">
                {JSON.stringify(analysisResult.sampleData, null, 2)}
              </pre>
            </div>
          )}

          {/* Detected List Selectors */}
          {analysisResult.detectedListSelectors &&
            analysisResult.detectedListSelectors.length > 0 && (
              <div className="mb-3">
                <h5 className="text-xs font-medium text-zinc-400 mb-1">
                  Detected List Selectors:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.detectedListSelectors.map(
                    (selector: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs bg-zinc-900 px-2 py-1 rounded border border-zinc-700 text-zinc-300 font-mono cursor-pointer hover:border-indigo-500"
                        onClick={() => setContainerSelector(selector)}
                      >
                        {selector}
                      </span>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* Title */}
          {analysisResult.title && (
            <div className="text-xs text-zinc-400">
              <span className="font-medium">Page Title:</span>{" "}
              {analysisResult.title}
            </div>
          )}
        </div>
      )}
    </div>
  );
}