import { useState } from "react";
import { Loader2, LayoutGrid } from "lucide-react";

// Componenti locali
import { TopBar } from "@/components/TopBar";
import { ConfigCard } from "@/components/ConfigCard";
import { ConfigDrawer } from "@/components/ConfigDrawer";

// Hooks e Tipi reali
import { useConfigs } from "../hooks/useConfigs"; 
import type { ApiConfig } from "../types/ApiConfig";

export function Dashboard() {
  const { 
    configs, 
    isLoading, 
    filters, 
    setSearch 
  } = useConfigs();

  //  Stati per la gestione del Drawer
  const [selectedConfig, setSelectedConfig] = useState<ApiConfig | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 3. Handlers
  const handleOpenDrawer = (config: ApiConfig) => {
    setSelectedConfig(config);
    setIsDrawerOpen(true);
  };

  const handleAddNew = () => {
    // Qui andrà la logica per aprire la modale di creazione
    console.log("Apertura modale nuova configurazione");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* TopBar cablata con i filtri di useConfigs */}
      <TopBar 
        searchQuery={filters.search} 
        onSearchChange={setSearch} 
        onAddClick={handleAddNew} 
      />

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">API Management</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Monitora e gestisci i tuoi endpoint di scraping.
          </p>
        </header>

        {/* Visualizzazione condizionale basata sullo stato del backend */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
            <p className="text-sm font-medium animate-pulse">Sincronizzazione dati...</p>
          </div>
        ) : configs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {configs.map((config: ApiConfig) => (
              <ConfigCard 
                key={config.id} 
                config={config} 
                onOpen={() => handleOpenDrawer(config)}
                /* Se serve onClick per altre azioni, aggiungilo qui */
                onClick={() => handleOpenDrawer(config)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-zinc-900 rounded-3xl bg-zinc-900/10">
            <LayoutGrid className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500">Nessuna configurazione trovata per "{filters.search}"</p>
          </div>
        )}
      </main>

      {/* Pannello laterale per i dettagli, esecuzione e log */}
      <ConfigDrawer 
        isOpen={isDrawerOpen}
        config={selectedConfig}
        onClose={() => setIsDrawerOpen(false)}
        /* Placeholder per azioni CRUD future */
        onUpdate={() => {}} 
        onDelete={() => {}}
      />
    </div>
  );
}