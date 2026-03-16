import { Search, Plus, RefreshCw } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  onRefreshClick?: () => void;
  autoRefreshEnabled?: boolean;
  onAutoRefreshToggle?: () => void;
   totalConfigs?: number; 
}

export function TopBar({ 
  searchQuery, 
  onSearchChange, 
  onAddClick,
  onRefreshClick,
}: TopBarProps) {
  return (
    <div className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 11a9 9 0 0 1 9 9" />
                <path d="M4 4a16 16 0 0 1 16 16" />
                <circle cx="5" cy="19" r="1" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">DATA Manager</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search configurations..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white placeholder:text-zinc-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onRefreshClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshClick}
                className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            )}
            
            <Button
              onClick={onAddClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Add New Config
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}