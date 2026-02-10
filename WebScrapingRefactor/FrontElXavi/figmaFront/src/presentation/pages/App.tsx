import { useState, useEffect, useMemo } from "react";
import { TopBar } from "../components/TopBar";
import { ConfigCard } from "../components/ConfigCard";
import { AddConfigModal } from "../components/AddConfigModal";
import { ConfigDrawer } from "../components/ConfigDrawer";

// Controller Hooks
import { useConfigController } from "../hooks/useConfigController";
import { useExecutionController } from "../hooks/useExecutionController";

// Tipi
import type { ApiConfig } from "../../domain/entities/ApiConfig";

export default function App() {
  // --- CONTROLLER CONFIGURAZIONI ---
  const {
    configs,
    isLoading: isConfigsLoading,
    error: configError,
    fetchConfigs,
    saveConfig,
    updateConfig,
    deleteConfig,
  } = useConfigController();

  // --- CONTROLLER ESECUZIONI & LOG ---
  const {
    runExecution,
    logs,
    isLoadingLogs,
    refreshLogs,
    removeLog,
    downloadLogs,
    isExecuting,
  } = useExecutionController();

  // --- STATO UI ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ApiConfig | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  // --- EFFETTI ---
  // Caricamento iniziale dal backend
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // --- LOGICA FILTRI E PAGINAZIONE ---
  const filteredConfigs = useMemo(() => {
    return configs.filter(
      (config) =>
        config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.baseUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.endpoint.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [configs, searchQuery]);

  const paginatedConfigs = useMemo(() => {
    return filteredConfigs.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [filteredConfigs, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredConfigs.length / rowsPerPage);

  // --- HANDLERS AZIONI ---
  const handleAddConfig = async (newConfig: ApiConfig) => {
    try {
      await saveConfig(newConfig);
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Errore salvataggio:", err);
    }
  };

  const handleConfigClick = (config: ApiConfig) => {
    setSelectedConfig(config);
    setIsDrawerOpen(true);
    // Carica la history specifica per questa configurazione
    refreshLogs(config.id);
  };

  const handleUpdateConfig = async (updatedConfig: ApiConfig) => {
    try {
      await updateConfig(updatedConfig);
      setSelectedConfig(updatedConfig);
    } catch (error) {
      console.error("Errore aggiornamento:", error);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (
      window.confirm(
        "Sei sicuro di voler eliminare questa configurazione? Tutti i log associati verranno persi.",
      )
    ) {
      try {
        await deleteConfig(id);
        setIsDrawerOpen(false);
        setSelectedConfig(null);
      } catch (error) {
        console.error("Errore eliminazione:", error);
      }
    }
  };

  // --- RENDER LOADING STATO INIZIALE ---
  if (isConfigsLoading && configs.length === 0) {
    return (
      <div className="dark min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-l-2 border-r-2 border-indigo-500/20 animate-pulse"></div>
        </div>
        <p className="mt-4 text-zinc-400 font-medium animate-pulse">
          Inizializzazione sistema...
        </p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-zinc-950 text-white font-['Inter'] selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPage(0);
          }}
          onAddClick={() => setIsAddModalOpen(true)}
        />

        {/* Main Content */}
        <main className="px-6 pb-12">
          {/* Header Section */}
          <div className="mb-8 pt-8 border-b border-zinc-900 pb-8">
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
              API Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
              <p className="text-zinc-400 font-medium">
                {filteredConfigs.length}{" "}
                {filteredConfigs.length === 1
                  ? "configurazione attiva"
                  : "configurazioni attive"}
              </p>
            </div>

            {configError && (
              <div className="mt-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {configError}
              </div>
            )}
          </div>

          {/* Config Cards Grid */}
          {filteredConfigs.length === 0 ? (
            <div className="text-center py-32 border-2 border-dashed border-zinc-900 rounded-3xl bg-zinc-900/20">
              <div className="bg-zinc-900 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                <svg
                  className="text-zinc-600"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path d="M9 10h.01M15 10h.01M9.5 15.5c1.293 1.293 2.707 1.293 4 0" />
                </svg>
              </div>
              <p className="text-zinc-400 text-xl font-medium">
                Nessuna configurazione trovata
              </p>
              <p className="text-zinc-500 mt-1">
                Aggiungi una nuova configurazione per iniziare i test.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedConfigs.map((config) => (
                  <ConfigCard
                    key={config.id}
                    config={config}
                    onClick={() => handleConfigClick(config)}
                  />
                ))}
              </div>

              {/* Pagination Section */}
              <div className="mt-12 flex items-center justify-between bg-zinc-900/30 p-4 rounded-2xl border border-zinc-900">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-zinc-500">Righe per pagina:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(0);
                    }}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-white outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {[3, 6, 9, 12].map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-6">
                  <span className="text-sm font-medium text-zinc-400">
                    {page * rowsPerPage + 1} -{" "}
                    {Math.min((page + 1) * rowsPerPage, filteredConfigs.length)}{" "}
                    di {filteredConfigs.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-20 transition-all"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={page >= totalPages - 1}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-20 transition-all"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <AddConfigModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddConfig}
      />

      <ConfigDrawer
        isOpen={isDrawerOpen}
        config={selectedConfig}
        onClose={() => setIsDrawerOpen(false)}
        onUpdate={handleUpdateConfig}
        onDelete={handleDeleteConfig}
        // Esecuzione API
        onExecute={runExecution}
        isExecuting={isExecuting}
        // Log & History
        logs={logs}
        isLoadingLogs={isLoadingLogs}
        onRefreshLogs={() => {
          if (selectedConfig) refreshLogs(selectedConfig.id);
        }}
        onDeleteLog={async (logId: string) => {
          if (selectedConfig) await removeLog(selectedConfig.id, logId);
        }}
        onDownload={(format) => {
          if (selectedConfig) downloadLogs(selectedConfig.name, format);
        }}
      />
    </div>
  );
}
