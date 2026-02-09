import { Play, Loader2, CheckCircle2, AlertCircle, Code2 } from "lucide-react";
import { Button } from "../ui/button";
import { useExecution } from "../../hooks/useExecution";
import type { ApiConfig } from "../../types/ApiConfig";

interface ExecuteTabProps {
  config: ApiConfig;
  onUpdate: (config: ApiConfig) => void;
  //onDownloadResults: (executionId: string) => void;
}

export function ExecuteTab({ config }: ExecuteTabProps) {
  const { startExecution, isExecuting, batchResult, error, reset } = useExecution();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Play className={`w-8 h-8 text-indigo-500 ${isExecuting ? 'animate-pulse' : 'fill-current'}`} />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Pronto all'esecuzione</h3>
        <p className="text-zinc-400 text-sm mb-8 max-w-xs mx-auto">
          Lancia lo scraper per raccogliere i dati da <span className="text-indigo-400 italic">{config.endpoint}</span>
        </p>
        
        <Button 
          onClick={() => startExecution(config.name)}
          disabled={isExecuting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-white shadow-xl shadow-indigo-500/10"
        >
          {isExecuting ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
          {isExecuting ? "Scraping in corso..." : "Avvia Scraper"}
        </Button>
      </div>

      {batchResult && (
        <div className="space-y-4 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-emerald-500 w-5 h-5" />
              <div>
                <p className="text-emerald-400 text-sm font-medium">Completato con successo</p>
                <p className="text-emerald-500/60 text-xs">{batchResult.data.length} record estratti</p>
              </div>
            </div>
            {/* <Button size="sm" variant="secondary" onClick={() => onDownloadResults(config.id)}>
              <Download className="w-4 h-4 mr-2" /> JSON
            </Button> */}
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Code2 className="w-3 h-3 text-zinc-500" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Preview</span>
              </div>
              <button onClick={reset} className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest">Clear</button>
            </div>
            <pre className="p-4 text-[11px] font-mono text-indigo-300/80 overflow-auto max-h-[300px] leading-relaxed">
              {JSON.stringify(batchResult.data.slice(0, 3), null, 2)}
              {batchResult.data.length > 3 && "\n\n// ... e altri " + (batchResult.data.length - 3) + " record"}
            </pre>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400">
          <AlertCircle className="shrink-0 w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}