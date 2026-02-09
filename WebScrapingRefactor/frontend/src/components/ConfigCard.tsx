import { Badge } from "./ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Globe, Clock, ArrowRight } from "lucide-react";
import type { ApiConfig} from '../types/ApiConfig';


interface ConfigCardProps {
  config: ApiConfig;
  onOpen : () => void;
}

export function ConfigCard({ config, onOpen }: ConfigCardProps) {
  return (
    <Card 
      onClick={onOpen}
      className="group bg-zinc-900/40 border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900/60 transition-all duration-300 cursor-pointer relative overflow-hidden"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-zinc-100 group-hover:text-indigo-400 transition-colors">
              {config.name}
            </h3>
            <div className="flex items-center gap-2 text-zinc-500 text-xs">
              <Globe className="w-3 h-3" />
              <span className="truncate max-w-[150px]">{config.baseUrl}</span>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={config.method === "GET" 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"}
          >
            {config.method}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="bg-zinc-950/50 rounded-md p-3 border border-zinc-800/50">
          <code className="text-xs text-indigo-300 font-mono break-all">
            {config.endpoint}
          </code>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex justify-between items-center text-zinc-500">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold">
          <Clock className="w-3 h-3" />
          <span>Last run: 2h ago</span>
        </div>
        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-500" />
      </CardFooter>
    </Card>
  );
}