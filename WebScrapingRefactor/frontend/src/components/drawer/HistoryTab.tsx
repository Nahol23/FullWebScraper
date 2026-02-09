import { Clock, Download, CheckCircle2, XCircle, RefreshCw, Calendar } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useLogs } from "../../hooks/useLogs";
import type { ApiConfig } from "../../types/ApiConfig";
import type { Execution } from '../../types/Execution';

interface HistoryTabProps {
  config: ApiConfig;
  //onDownloadResults: (executionId: string) => void;
}

export function HistoryTab({ config }: HistoryTabProps) {
  const { entries, loading, isRefreshing, refresh } = useLogs(true);

  // Filtriamo le entries (Execution[]) usando il configId della tua entità
  const filteredHistory = (entries as Execution[]).filter(
    (log) => log.configId === config.id
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
        <p className="text-zinc-500 text-sm">Caricamento cronologia...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-3 h-3" /> Ultime Esecuzioni
        </h3>
        <Button variant="ghost" size="sm" onClick={() => refresh()} className="h-7 w-7 p-0">
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl">
          <Clock className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
          <p className="text-zinc-500 text-sm italic">Nessun log trovato per questa API</p>
        </div>
      ) : (
        filteredHistory.map((log) => (
          <div 
            key={log.id} 
            className="group bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:bg-zinc-900 transition-all border-l-2 border-l-transparent hover:border-l-indigo-500"
          >
            <div className="flex items-center gap-4">
              <div className={log.status === "success" ? "text-emerald-500" : "text-red-500"}>
                {log.status === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">
                  {new Date(log.timestamp).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex gap-2 mt-1 items-center">
                  <Badge variant="outline" className="text-[10px] border-zinc-800 text-zinc-500 py-0 px-1.5 h-4">
                    {log.status}
                  </Badge>
                  {log.status === "success" && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {log.resultCount} record
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {log.status === "success" && (
              <Button 
                variant="ghost" 
                size="icon" 
                // onClick={() => onDownloadResults(log.id)}
                className="text-zinc-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
}