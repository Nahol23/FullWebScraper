import { Search, Plus, Zap } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface TopBarProps {
  searchQuery: string | undefined;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
}

export function TopBar({ searchQuery, onSearchChange, onAddClick }: TopBarProps) {
  return (
    <div className="sticky top-0 z-40 backdrop-blur-md bg-zinc-950/70 border-b border-zinc-800/50">
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo Section */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.4)]">
              <Zap className="text-white w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
              API<span className="text-indigo-500">Scraper</span>
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search by name or endpoint..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-zinc-900/50 border-zinc-800 focus-visible:ring-indigo-500/50 text-white"
            />
          </div>

          {/* Action Button */}
          <Button 
            onClick={onAddClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/20 gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">New Config</span>
          </Button>
        </div>
      </div>
    </div>
  );
}