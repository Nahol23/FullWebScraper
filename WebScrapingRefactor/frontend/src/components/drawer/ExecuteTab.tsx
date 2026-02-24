import { useState, useEffect } from "react";
import { Play, Loader2,AlertCircle} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

// Tipi Reali
import type { ApiConfig } from "../../types/ApiConfig";
import { useExecution } from "../../hooks/useExecution";

interface ExecuteTabProps {
  config: ApiConfig;
}

export function ExecuteTab({ config }: ExecuteTabProps) {
  const { startExecution, isExecuting, batchResult, error } = useExecution();
  const [viewMode, setViewMode] = useState<"easy" | "raw">("easy");

  const [params, setParams] = useState({
    endpoint: config.endpoint,
    method: config.method,
    headers: config.headers || {},
    body: config.body || {},
    page: config.meta?.page || 1, 
    limit: config.defaultLimit || 100,
    selectedFields: config.selectedFields || []
  });

  const [rawJson, setRawJson] = useState("");

  useEffect(() => {
    const editablePayload = {
      endpoint: params.endpoint,
      method: params.method,
      headers: params.headers,
      body: params.body,
      page: params.page,
      limit: params.limit,
      selectedFields: params.selectedFields
    };
    setRawJson(JSON.stringify(editablePayload, null, 2));
  }, [params]);

  const handleRun = () => {
    let finalPayload = params;
    if (viewMode === "raw") {
      try {
        finalPayload = JSON.parse(rawJson);
      } catch (e) {
        alert("JSON non valido!");
        return;
      }
    }
    startExecution(config.id, finalPayload);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {config.name}
            <Badge variant="outline" className="text-[10px] border-indigo-500/50 text-indigo-400 uppercase">
              {params.method}
            </Badge>
          </h2>
          <p className="text-zinc-500 text-xs font-mono">{config.baseUrl}</p>
        </div>
      </div>
      <div className="flex p-1 bg-zinc-900 rounded-lg border border-zinc-800">
        <button 
          onClick={() => setViewMode("easy")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "easy" ? "bg-indigo-600 text-white" : "text-zinc-500"}`}
        >
          Easy Mode
        </button>
        <button 
          onClick={() => setViewMode("raw")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === "raw" ? "bg-indigo-600 text-white" : "text-zinc-500"}`}
        >
          Raw JSON
        </button>
      </div>
      <div className="min-h-[220px]">
        {viewMode === "easy" ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Endpoint Override</Label>
              <Input 
                value={params.endpoint}
                onChange={(e) => setParams({...params, endpoint: e.target.value})}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-300 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Page</Label>
                <Input 
                  type="number" 
                  value={params.page} 
                  onChange={(e) => setParams({...params, page: Number(e.target.value)})}
                  className="bg-zinc-900/50 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Limit</Label>
                <Input 
                  type="number" 
                  value={params.limit} 
                  onChange={(e) => setParams({...params, limit: Number(e.target.value)})}
                  className="bg-zinc-900/50 border-zinc-800"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2 animate-in fade-in duration-300">
            <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Execution Payload</Label>
            <textarea 
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-[11px] text-indigo-300 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      <Button 
        onClick={handleRun}
        disabled={isExecuting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-white font-bold"
      >
        {isExecuting ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
        Run Extraction
      </Button>
      {(batchResult || error) && (
        <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <Label className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Response Output</Label>
            {batchResult && (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[10px]">
                {batchResult.meta?.validObjectsCount || batchResult.data?.length || 0} Records Found
              </Badge>
            )}
          </div>
          {error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error.message}
            </div>
          ) : batchResult && (
            <div className="space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex justify-between items-center font-mono text-[10px]">
                 <div className="flex gap-4">
                    <span className="text-zinc-500">STATUS: <span className="text-emerald-500">200 OK</span></span>
                    <span className="text-zinc-500">PAGE: <span className="text-zinc-300">{batchResult.meta?.page || params.page}</span></span>
                 </div>
                 {/* <span className="text-zinc-600 italic">DTO Mapping: Active</span> */}
              </div>
              
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <pre className="p-4 text-[11px] font-mono text-indigo-300/80 overflow-auto max-h-[350px] scrollbar-thin scrollbar-thumb-zinc-800">
                  {JSON.stringify(batchResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}