import { Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { cn } from "./ui/utils";
import type { ApiConfig } from "../../domain/entities/ApiConfig";

interface ConfigCardProps {
  config: ApiConfig;
  onClick: () => void;
  onDelete: (config: ApiConfig) => void;
}

export function ConfigCard({ config, onClick, onDelete }: ConfigCardProps) {
  return (
    <Card
      onClick={onClick}
      className="group bg-zinc-900 hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all duration-200"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
            {config.name}
          </h3>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 font-mono text-xs px-2 py-0.5",
              config.method === "GET"
                ? "text-emerald-400 border-emerald-900 bg-emerald-500/10"
                : "text-amber-400 border-amber-900 bg-amber-500/10",
            )}
          >
            {config.method}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-zinc-500">Base URL:</span>
          <span className="text-sm font-mono text-zinc-300 truncate">
            {config.baseUrl}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-zinc-500">Endpoint:</span>
          <span className="text-sm font-mono text-zinc-300 truncate">
            {config.endpoint}
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between w-full text-xs text-zinc-500">
          <span>{config.selectedFields?.length || 0} fields selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation(); // evita di aprire il drawer
                onDelete(config);
              }}
              className="text-zinc-500 hover:text-red-400 transition-colors"
              aria-label="Elimina configurazione"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400">
              View details →
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}