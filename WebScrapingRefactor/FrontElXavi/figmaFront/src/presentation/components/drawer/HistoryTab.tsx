import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { CheckCircle2, XCircle, Clock, RefreshCcw, Trash2 } from "lucide-react";
import { cn } from "../../components/ui/utils";
import { Button } from "../ui/button";
import type { ExecutionHistory } from "../../../domain/entities/ApiConfig";

interface HistoryTabProps {
  logs: ExecutionHistory[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteLog: (logId: string) => Promise<void>;
}

export function HistoryTab({
  logs,
  isLoading,
  onRefresh,
  onDeleteLog,
}: HistoryTabProps) {
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const isSuccess = (status: ExecutionHistory["status"]) => {
    if (typeof status === "number") return status < 400;
    return status === "success";
  };

  const statusLabel = (status: ExecutionHistory["status"]) => {
    if (typeof status === "number") return `HTTP ${status}`;
    return status === "success" ? "Success" : "Error";
  };

  // Funzione interna per formattare la durata
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

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

      {isLoading && logs.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 w-full bg-zinc-900/50 animate-pulse rounded-xl border border-zinc-800"
            />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-2xl bg-zinc-900/10">
          <p className="text-zinc-500 font-medium">No history available</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {sortedLogs.map((log) => (
            <Card
              key={log.id}
              className="bg-zinc-900/40 border-zinc-800 p-4 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "p-2 rounded-full flex-shrink-0",
                    isSuccess(log.status)
                      ? "bg-emerald-500/10"
                      : "bg-red-500/10",
                  )}
                >
                  {isSuccess(log.status) ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        isSuccess(log.status)
                          ? "text-zinc-200"
                          : "text-red-400",
                      )}
                    >
                      {statusLabel(log.status)}
                    </span>
                    <span className="text-zinc-600 text-xs">•</span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>

                    {log.duration != null && (
                      <>
                        <span className="text-zinc-600 text-xs">•</span>
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 bg-zinc-950 border-zinc-800 text-zinc-400"
                        >
                          {formatDuration(log.duration)}
                        </Badge>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    {/* Campo items aggiunto qui */}
                    {log.totalItems != null && (
                      <Badge
                        variant="outline"
                        className="text-zinc-400 border-zinc-700 text-xs"
                      >
                        {log.totalItems} items extracted
                      </Badge>
                    )}

                    {log.pagesScraped != null && (
                      <Badge
                        variant="outline"
                        className="text-zinc-400 border-zinc-700 text-xs"
                      >
                        {log.pagesScraped} pages
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteLog(log.id)}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 text-zinc-600 hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
