import { Database, FileJson, History, ScrollText } from "lucide-react";
import { cn } from "./ui/utils";

type NavigationItem = "api-wizard" | "saved-configs" | "analysis-history" | "execution-logs";

interface SidebarProps {
  activeNav: NavigationItem;
  onNavigate: (nav: NavigationItem) => void;
}

const navItems = [
  {
    id: "api-wizard" as NavigationItem,
    label: "API Wizard",
    icon: Database,
  },
  {
    id: "saved-configs" as NavigationItem,
    label: "Saved Configs",
    icon: FileJson,
  },
  {
    id: "analysis-history" as NavigationItem,
    label: "Analysis History",
    icon: History,
  },
  {
    id: "execution-logs" as NavigationItem,
    label: "Execution Logs",
    icon: ScrollText,
  },
];

export function Sidebar({ activeNav, onNavigate }: SidebarProps) {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo Area */}
      <div className="h-16 border-b border-sidebar-border flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Database className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sidebar-foreground">API Tool</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground">
          Version 1.0.0
        </div>
      </div>
    </aside>
  );
}
