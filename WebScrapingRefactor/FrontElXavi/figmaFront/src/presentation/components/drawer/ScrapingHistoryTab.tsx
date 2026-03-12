// src/presentation/components/drawer/ScrapingHistoryTab.tsx
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  RefreshCcw,
  FileJson,
  FileText,
} from "lucide-react";
import { cn } from "../../components/ui/utils";
import { Button } from "../ui/button";
import type { ScrapingExecution } from "../../../domain/entities/ScrapingExecution";

interface ScrapingHistoryTabProps {
  logs: ScrapingExecution[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteLog: (logId: string) => Promise<void>;
  onDownload: (format: "json" | "markdown") => void;
}

export function ScrapingHistoryTab({
  logs,
  isLoading,
  onRefresh,
  onDeleteLog,
  onDownload,
}: ScrapingHistoryTabProps) {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2 rounded-lg">
            <Clock className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Execution Logs</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
              {logs.length} Total Runs
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-2 h-8"
        >
          <RefreshCcw
            className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
          />
          <span className="text-xs">Refresh</span>
        </Button>
      </div>

      {logs.length > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={() => onDownload("json")}
            variant="outline"
            className="flex-1 bg-zinc-900 border-zinc-800 text-xs h-9 gap-2 hover:border-indigo-500/50"
          >
            <FileJson className="h-3.5 w-3.5 text-orange-400" />
            Export JSON
          </Button>
          <Button
            onClick={() => onDownload("markdown")}
            variant="outline"
            className="flex-1 bg-zinc-900 border-zinc-800 text-xs h-9 gap-2 hover:border-indigo-500/50"
          >
            <FileText className="h-3.5 w-3.5 text-blue-400" />
            Export MD
          </Button>
        </div>
      )}

      {isLoading && logs.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 w-full bg-zinc-900/50 animate-pulse rounded-xl border border-zinc-800"
            />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-2xl bg-zinc-900/10">
          <div className="bg-zinc-900 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
            <Clock className="h-6 w-6 text-zinc-700" />
          </div>
          <p className="text-zinc-500 font-medium">No history available</p>
          <p className="text-zinc-600 text-xs mt-1">
            Execute the scraping to see logs.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {sortedLogs.map((log) => (
            <Card
              key={log.id}
              className="bg-zinc-900/40 border-zinc-800 p-4 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={cn(
                      "p-2 rounded-full mt-0.5",
                      log.status === "success"
                        ? "bg-emerald-500/10"
                        : "bg-red-500/10",
                    )}
                  >
                    {log.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-200">
                        {log.status === "success" ? "Success" : "Failed"}
                      </span>
                      <span className="text-zinc-600 text-xs">•</span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 bg-zinc-950 border-zinc-800 text-zinc-400"
                      >
                        {log.duration}ms
                      </Badge>
                      {log.resultCount !== undefined && (
                        <span className="text-[11px] text-zinc-500 italic">
                          {log.resultCount} records
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteLog(log.id)}
                    className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {log.errorMessage && (
                <div className="mt-3 p-2 bg-red-500/5 border border-red-500/10 rounded-lg">
                  <p className="text-[11px] text-red-400/80 font-mono line-clamp-2">
                    {log.errorMessage}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
