import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ScrapingConfigForm } from "../ScrapingConfigForm";
import type { ScrapingConfig, ExtractionRule } from "../../../domain/entities/ScrapingConfig";

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
  const [rules, setRules] = useState<ExtractionRule[]>(config.rules);
  const [containerSelector, setContainerSelector] = useState(config.containerSelector || "");
  const [waitForSelector, setWaitForSelector] = useState(config.waitForSelector || "");
  
  // Stato pagination con campi opzionali (per compatibilità con ScrapingConfigForm)
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
    }
  );

  const handleSave = async () => {
    // Costruisci l'oggetto pagination solo se maxPages > 1
    const paginationToSave = pagination.maxPages && pagination.maxPages > 1
      ? {
          type: pagination.type,
          ...(pagination.type === "nextSelector" && pagination.selector ? { selector: pagination.selector } : {}),
          ...(pagination.type === "urlParam" && pagination.paramName ? { paramName: pagination.paramName } : {}),
          maxPages: pagination.maxPages,
        }
      : undefined;

    const updatedConfig: ScrapingConfig = {
      ...config,
      url,
      method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body,
      rules,
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
        onAnalyze={() => {}}
        isAnalyzing={false}
        analysisResult={null}
      />

      <div className="flex gap-3 pt-4 border-t border-zinc-800">
        <Button
          onClick={handleSave}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Save Changes
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