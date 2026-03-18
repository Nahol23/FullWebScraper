import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  ScrapingConfigForm,
  SelectableExtractionRule,
} from "../ScrapingConfigForm";
import { useScrapingExecutionController } from "../../hooks/useScrapingExecutionController";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";

interface ScrapingConfigurationTabProps {
  config: ScrapingConfig;
  onUpdate: (config: ScrapingConfig) => Promise<void>;
  onDelete: (config: ScrapingConfig) => void;
}

export function ScrapingConfigurationTab({
  config,
  onUpdate,
  onDelete,
}: ScrapingConfigurationTabProps) {
  const [url, setUrl] = useState(config.url);
  const [method, setMethod] = useState(config.method || "GET");
  const [headers, setHeaders] = useState(config.headers || {});
  const [body, setBody] = useState(config.body);
  const [rules, setRules] = useState<SelectableExtractionRule[]>(
    config.rules.map((rule) => ({ ...rule, selected: true })),
  );
  const [containerSelector, setContainerSelector] = useState(
    config.containerSelector || "",
  );
  const [waitForSelector, setWaitForSelector] = useState(
    config.waitForSelector || "",
  );
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectAllRules, setSelectAllRules] = useState(true);

  const { analyze, isAnalyzing, error } = useScrapingExecutionController();

  const [pagination, setPagination] = useState<{
    type: "urlParam" | "nextSelector";
    selector?: string;
    paramName?: string;
    maxPages?: number;
  }>(
    config.pagination || {
      type: "urlParam",
      paramName: "page",
      maxPages: 1,
    },
  );

  const handleAnalyze = async () => {
    try {
      const headersObject: Record<string, string> = {};
      Object.entries(headers).forEach(([key, value]) => {
        if (key.trim()) headersObject[key.trim()] = value;
      });

      let parsedBody: any = undefined;
      if (method === "POST" && body) {
        parsedBody = body;
      }
      const result = await analyze(url, {
        method,
        headers:
          Object.keys(headersObject).length > 0 ? headersObject : undefined,
        body: parsedBody,
        useJavaScript: !!waitForSelector,
        waitForSelector: waitForSelector || undefined,
      });
      setAnalysisResult(result);

      if (result.suggestedRules && result.suggestedRules.length > 0) {
        setRules(
          result.suggestedRules.map((rule: any) => ({
            ...rule,
            selected: true,
          })),
        );
        setSelectAllRules(true);
      }
    } catch (err) {
      console.error("[ScrapingConfigurationTab] Analysis error:", err);
    }
  };

  const handleSave = async () => {
    const selectedRules = rules
      .filter((rule) => rule.selected)
      .map(({ selected, ...rule }) => rule);

    const paginationToSave =
      pagination.maxPages && pagination.maxPages > 1
        ? {
            type: pagination.type,
            ...(pagination.type === "nextSelector" && pagination.selector
              ? { selector: pagination.selector }
              : {}),
            ...(pagination.type === "urlParam" && pagination.paramName
              ? { paramName: pagination.paramName }
              : {}),
            maxPages: pagination.maxPages,
          }
        : undefined;

    const updatedConfig: ScrapingConfig = {
      ...config,
      url,
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body,
      rules: selectedRules,
      containerSelector: containerSelector || undefined,
      waitForSelector: waitForSelector || undefined,
      pagination: paginationToSave,
    };

    await onUpdate(updatedConfig);
  };

  return (
    <div className="space-y-6">
      <ScrapingConfigForm
        url={url}
        setUrl={setUrl}
        method={method}
        setMethod={setMethod}
        headers={headers}
        setHeaders={setHeaders}
        body={body}
        setBody={setBody}
        rules={rules}
        setRules={setRules}
        containerSelector={containerSelector}
        setContainerSelector={setContainerSelector}
        waitForSelector={waitForSelector}
        setWaitForSelector={setWaitForSelector}
        pagination={pagination}
        setPagination={setPagination}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        analysisResult={analysisResult}
        selectAllRules={selectAllRules}
        setSelectAllRules={setSelectAllRules}
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-zinc-800">
        <Button
          onClick={handleSave}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Save Changes ({rules.filter((r) => r.selected).length} rules selected)
        </Button>
        <Button
          onClick={() => onDelete(config)}
          variant="outline"
          className="bg-red-500/10 border-red-500/50 hover:bg-red-500/20 hover:border-red-500 text-red-400 gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
