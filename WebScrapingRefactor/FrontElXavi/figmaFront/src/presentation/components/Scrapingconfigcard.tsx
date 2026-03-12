// src/presentation/components/ScrapingConfigCard.tsx
import { Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { cn } from "./ui/utils";
import type { ScrapingConfig } from "../../domain/entities/ScrapingConfig";

interface ScrapingConfigCardProps {
  config: ScrapingConfig;
  onClick: () => void;
  onDelete: (config: ScrapingConfig) => void;
}

export function ScrapingConfigCard({
  config,
  onClick,
  onDelete,
}: ScrapingConfigCardProps) {
  const method = config.method || "GET";
  const rulesCount = config.rules?.length || 0;
  const hasContainer = !!config.containerSelector;

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
              method === "GET"
                ? "text-emerald-400 border-emerald-900 bg-emerald-500/10"
                : "text-amber-400 border-amber-900 bg-amber-500/10",
            )}
          >
            {method}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-zinc-500">URL:</span>
          <span className="text-sm font-mono text-zinc-300 truncate">
            {config.url}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-zinc-500">Rules:</span>
          <span className="text-sm font-mono text-zinc-300">
            {rulesCount} {rulesCount === 1 ? "rule" : "rules"}
          </span>
        </div>
        {hasContainer && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-zinc-500">Container:</span>
            <span className="text-xs font-mono text-indigo-400 truncate">
              {config.containerSelector}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between w-full text-xs text-zinc-500">
          <span>
            {config.pagination?.maxPages && config.pagination.maxPages > 1
              ? `Max ${config.pagination.maxPages} pages`
              : "No pagination"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
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
