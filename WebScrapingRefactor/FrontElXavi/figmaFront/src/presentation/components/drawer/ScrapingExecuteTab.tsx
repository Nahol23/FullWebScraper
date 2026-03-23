import { useState, useEffect, useRef } from "react";
import { Play, Loader2, Eye, RotateCcw } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { ResultViewerModal } from "../ResultViewerModal";
import type { ScrapingConfig } from "../../../domain/entities/ScrapingConfig";
import { toast } from "sonner";

interface ScrapingExecuteTabProps {
  config: ScrapingConfig;
  onExecute: (params?: Record<string, unknown>) => Promise<void>;
  onResume: (maxPages?: number) => Promise<void>;
  isExecuting: boolean;
  isResuming: boolean;
  lastResult?: {
    data?: unknown[];
    nextPageUrl?: string | null;
    meta?: { pagesScraped?: number; totalItems?: number };
  };
}

export function ScrapingExecuteTab({
  config,
  onExecute,
  onResume,
  isExecuting,
  isResuming,
  lastResult,
}: ScrapingExecuteTabProps) {
  const [waitForSelector, setWaitForSelector] = useState(
    config.waitForSelector ?? "",
  );
  const [maxPages, setMaxPages] = useState(
    config.pagination?.maxPages?.toString() ?? "1",
  );
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Contatore esecuzioni — usato come key del modal per forzare remount completo
  // ad ogni nuova esecuzione, evitando stati stale di Radix UI Dialog
  const executionCount = useRef(0);
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    if (lastResult) {
      // Nuovi dati arrivati → aggiorna key per forzare remount del Dialog
      executionCount.current += 1;
      setModalKey(executionCount.current);
    } else {
      // lastResult = null → nuova esecuzione partita → chiudi modal
      setIsResultModalOpen(false);
    }
  }, [lastResult]);

  const hasNextPage = !!lastResult?.nextPageUrl;
  const isLoading = isExecuting || isResuming;

  const handleExecute = async () => {
    if (!config.name) {
      toast.error("Nome configurazione mancante");
      return;
    }

    // Chiudi modal immediatamente prima di avviare l'esecuzione
    setIsResultModalOpen(false);

    const params: Record<string, unknown> = {};
    if (waitForSelector.trim()) params.waitForSelector = waitForSelector.trim();
    if (maxPages && parseInt(maxPages) > 1)
      params.maxPages = parseInt(maxPages);

    await onExecute(Object.keys(params).length > 0 ? params : undefined);
  };

  const handleResume = async () => {
    const pages = maxPages ? parseInt(maxPages) : undefined;
    await onResume(pages && pages > 0 ? pages : undefined);
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

      <div className="flex gap-2">
        <Button
          onClick={handleExecute}
          disabled={isLoading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-12 gap-2"
        >
          {isExecuting ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isExecuting ? "Executing..." : "Run Scraping"}
        </Button>

        <Button
          onClick={handleResume}
          disabled={isLoading || !hasNextPage}
          title={
            hasNextPage
              ? "Resume from where the last execution stopped"
              : "No more pages — scraping is complete"
          }
          className={`h-12 gap-2 px-4 border transition-colors ${
            hasNextPage
              ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white"
              : "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
          }`}
        >
          {isResuming ? (
            <Loader2 className="animate-spin h-4 w-4" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Resume
        </Button>
      </div>

      {lastResult && (
        <Card className="bg-zinc-900 border-zinc-800 p-3 mt-4 space-y-2">
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

          <div className="flex items-center gap-2 flex-wrap">
            {lastResult.meta?.pagesScraped !== undefined && (
              <Badge
                variant="outline"
                className="text-zinc-400 border-zinc-700 text-xs"
              >
                {lastResult.meta.pagesScraped} page
                {lastResult.meta.pagesScraped !== 1 ? "s" : ""} scraped
              </Badge>
            )}
            {lastResult.meta?.totalItems !== undefined && (
              <Badge
                variant="outline"
                className="text-zinc-400 border-zinc-700 text-xs"
              >
                {lastResult.meta.totalItems} items
              </Badge>
            )}
            {hasNextPage ? (
              <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/40 text-xs">
                More pages available — click Resume
              </Badge>
            ) : (
              <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/40 text-xs">
                Scraping complete
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* key=modalKey forza remount completo del Dialog ad ogni nuova esecuzione
          evitando che Radix UI mostri contenuto stale da render precedenti */}
      <ResultViewerModal
        key={modalKey}
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        result={lastResult ?? null}
      />
    </div>
  );
}
