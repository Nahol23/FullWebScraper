import { useState, useEffect } from "react";
import { TopBar } from "./presentation/components/TopBar";
import { ConfigCard } from "./presentation/components/ConfigCard";
import { AddConfigModal } from "./presentation/components/AddConfigModal";
import { ConfigDrawer } from "./presentation/components/ConfigDrawer";
import { useConfigController } from "./presentation/hooks/useConfigController";
import type { ApiConfig } from "./domain/entities/ApiConfig";

export default function App() {
  // 1. Hook del Controller (Sostituisce lo stato locale dei dati)
  const { 
    configs, 
    loading, 
    // error, // Se vuoi gestire gli errori visivamente
    loadConfigs, 
    saveConfig, 
    updateConfig, 
    deleteConfig 
  } = useConfigController();

  // Stati locali SOLO per la UI (apertura modali, ricerca, impaginazione)
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ApiConfig | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  // 2. Carica i dati all'avvio dell'app
  useEffect(() => {
    loadConfigs();
  }, []);

  // --- Logica di UI (Filtri e Paginazione) ---
  const filteredConfigs = configs.filter(
    (config) =>
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.baseUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.endpoint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedConfigs = filteredConfigs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const totalPages = Math.ceil(filteredConfigs.length / rowsPerPage);

  // --- Handlers collegati al Controller ---

  const handleAddConfig = async (newConfigData: Omit<ApiConfig, "id">) => {
    // Creiamo l'oggetto completo. L'ID idealmente lo genera il backend/DB, 
    // ma qui lo generiamo noi o il controller.
    const config: ApiConfig = {
      ...newConfigData,
      id: Date.now().toString(), // O usa uuid() se preferisci
      executionHistory: [],
      headers: newConfigData.headers || {},
      bodyParams: newConfigData.bodyParams || {},
      selectedFields: newConfigData.selectedFields || [],
      paginationSettings: newConfigData.paginationSettings || {
        offsetParam: "offset",
        limitParam: "limit",
        initialOffset: 0,
        limitPerPage: 10,
      }
    };
    
    await saveConfig(config);
    setIsAddModalOpen(false);
  };

  const handleConfigClick = (config: ApiConfig) => {
    setSelectedConfig(config);
    setIsDrawerOpen(true);
  };

  const handleUpdateConfig = async (updatedConfig: ApiConfig) => {
    await updateConfig(updatedConfig);
    setSelectedConfig(updatedConfig); // Aggiorna anche la vista corrente nel drawer
  };

  const handleDeleteConfig = async (id: string) => {
    await deleteConfig(id);
    setIsDrawerOpen(false);
    setSelectedConfig(null);
  };

  return (
    <div className="dark min-h-screen bg-zinc-950 text-white font-['Inter']">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* Main Content */}
        <main className="px-6 pb-12">
          {/* Header */}
          <div className="mb-8 pt-8">
            <h1 className="text-3xl font-bold text-white mb-2">API Configurations</h1>
            <p className="text-zinc-400">
              {filteredConfigs.length} {filteredConfigs.length === 1 ? "configuration" : "configurations"} available
            </p>
          </div>

          {/* Loading State */}
          {loading && configs.length === 0 ? (
             <div className="text-center py-20 text-zinc-500">Loading configurations...</div>
          ) : (
            <>
              {/* Config Cards Grid */}
              {filteredConfigs.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-zinc-400 text-lg">No configurations found</p>
                  <p className="text-zinc-500 text-sm mt-2">
                    {searchQuery ? "Try adjusting your search" : "Get started by adding your first API configuration"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedConfigs.map((config) => (
                      <ConfigCard
                        key={config.id}
                        config={config}
                        onClick={() => handleConfigClick(config)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {/* (Il codice della paginazione è identico a prima, lo lascio invariato per brevità visiva, ma tu incollalo tutto) */}
                  <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-6">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-400">Rows per page:</span>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setPage(0);
                        }}
                        className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value={3}>3</option>
                        <option value={6}>6</option>
                        <option value={9}>9</option>
                        <option value={12}>12</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-zinc-400">
                         {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, filteredConfigs.length)} of {filteredConfigs.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage(Math.max(0, page - 1))}
                          disabled={page === 0}
                          className="p-2 rounded hover:bg-zinc-800 disabled:opacity-30"
                        >
                          Prev
                        </button>
                        <button
                          onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                          disabled={page >= totalPages - 1}
                          className="p-2 rounded hover:bg-zinc-800 disabled:opacity-30"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Add Config Modal */}
      <AddConfigModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddConfig}
      />

      {/* Config Details Drawer */}
      <ConfigDrawer
        isOpen={isDrawerOpen}
        config={selectedConfig}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={handleUpdateConfig}
        onDelete={handleDeleteConfig}
      />
    </div>
  );
}