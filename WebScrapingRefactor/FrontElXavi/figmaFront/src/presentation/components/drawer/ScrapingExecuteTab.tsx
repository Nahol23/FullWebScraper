import { useState } from "react";
import { Play, Loader2, Eye } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card } from "../../components/ui/card";
import { ResultViewerModal } from "../ResultViewerModal";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";
import { toast } from "sonner";

interface ScrapingExecuteTabProps {
  config: ScrapingConfig;
  // onExecute receives only runtimeParams — the configName is read from config internally
  onExecute: (params?: any) => Promise<void>;
  isExecuting: boolean;
  lastResult?: any;
}

export function ScrapingExecuteTab({
  config,
  onExecute,
  isExecuting,
  lastResult,
}: ScrapingExecuteTabProps) {
  const [waitForSelector, setWaitForSelector] = useState(
    config.waitForSelector || "",
  );
  const [maxPages, setMaxPages] = useState(
    config.pagination?.maxPages?.toString() || "1",
  );
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const handleExecute = async () => {
    if (!config.name) {
      toast.error("Nome configurazione mancante");
      return;
    }

    const params: any = {};
    if (waitForSelector.trim()) params.waitForSelector = waitForSelector.trim();
    if (maxPages && parseInt(maxPages) > 1) params.maxPages = parseInt(maxPages);
    
    // Pass only the runtime params — caller (ScrapingConfigDrawer) already
    // knows the configName and forwards it to the execution use case.
    await onExecute(Object.keys(params).length > 0 ? params : undefined);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="waitForSelector" className="text-sm text-zinc-300">
            Wait For Selector (optional)
          </Label>
          <Input
            id="waitForSelector"
            value={waitForSelector}
            onChange={(e) => setWaitForSelector(e.target.value)}
            placeholder=".loaded-content"
            className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxPages" className="text-sm text-zinc-300">
            Max Pages
          </Label>
          <Input
            id="maxPages"
            type="number"
            min="1"
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value)}
            className="bg-zinc-900 border-zinc-800 focus:border-indigo-500 text-white"
          />
        </div>
      </div>

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
        {isExecuting ? "Executing..." : "Run Scraping"}
      </Button>

      {lastResult && (
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
        </Card>
      )}

      <ResultViewerModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        result={lastResult}
      />
    </div>
  );
}