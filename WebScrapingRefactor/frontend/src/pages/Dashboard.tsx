import { useState } from "react";
import { Loader2 } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { ConfigCard } from "@/components/ConfigCard";
import { ConfigDrawer } from "@/components/ConfigDrawer";
import { useConfigs } from "../hooks/useConfigs"; 
import type { ApiConfig } from "../types/ApiConfig";

export function Dashboard() {
  const { configs, isLoading, filters, setSearch } = useConfigs();
  const [selectedConfig, setSelectedConfig] = useState<ApiConfig | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleOpenDrawer = (config: ApiConfig) => {
    setSelectedConfig(config);
    setIsDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <TopBar 
        searchQuery={filters.search} 
        onSearchChange={setSearch} 
        onAddClick={() => {}} 
      />

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {configs.map((config) => (
              <ConfigCard 
                key={config.id} 
                config={config} 
                onOpen={() => handleOpenDrawer(config)} 
              />
            ))}
          </div>
        )}
      </main>

      <ConfigDrawer 
        isOpen={isDrawerOpen}
        config={selectedConfig}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={() => {}} 
        onDelete={() => {}}
      />
    </div>
  );
}