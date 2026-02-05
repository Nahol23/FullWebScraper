

import type { ApiConfig } from "../../../domain/entities/ApiConfig";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { CheckCircle2, XCircle, Clock, Download } from "lucide-react";
import { cn } from "../../components/ui/utils";
import { Button } from "../ui/button";

interface HistoryTabProps {
  config: ApiConfig;
  onDownloadResults: (executionId: string) => void;
}

// 1. CORREZIONE: Aggiunto onDownloadResults qui sotto
export function HistoryTab({ config, onDownloadResults }: HistoryTabProps) {
  
  const sortedHistory = [...config.executionHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Execution History
        </h3>
        <Badge variant="outline" className="text-zinc-400">
          {config.executionHistory.length} executions
        </Badge>
      </div>

      {config.executionHistory.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">No execution history yet</p>
          <p className="text-zinc-500 text-sm mt-2">
            Execute an API call to see history here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 2. CORREZIONE: Usiamo sortedHistory invece di config.executionHistory */}
          {sortedHistory.map((history) => (
            <Card
              key={history.id}
              className="bg-zinc-900 border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {history.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={cn(
                          "text-xs",
                          history.status === "success"
                            ? "bg-green-500/20 text-green-400 border-green-500/50"
                            : "bg-red-500/20 text-red-400 border-red-500/50"
                        )}
                      >
                        {history.status === "success" ? "Success" : "Error"}
                      </Badge>
                      {history.recordsExtracted !== undefined && (
                        <span className="text-xs text-zinc-400">
                          {history.recordsExtracted} records
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-300">
                      {new Date(history.timestamp).toLocaleString()}
                    </p>
                    {history.errorMessage && (
                      <p className="text-xs text-red-400 mt-1">
                        {history.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                {history.status === "success" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDownloadResults(history.id)}
                    className="shrink-0 bg-zinc-950 border-zinc-700 hover:border-indigo-500 hover:text-indigo-400 gap-2 h-8 px-3"
                  >
                    <Download className="h-3 w-3" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">
                      JSON
                    </span>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}