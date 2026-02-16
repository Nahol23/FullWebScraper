import { useState, useEffect, useMemo, useCallback } from "react";
import { toast, Toaster } from "sonner"; // Se usi sonner per i toast
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
    lastResult,
    error: executionError,
    clearError: clearExecutionError,
  } = useExecutionController();

  // --- STATO UI ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ApiConfig | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // --- EFFETTI ---
  // Caricamento iniziale dal backend
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Refresh automatico ogni 30 secondi
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      fetchConfigs();
      if (selectedConfig) {
        refreshLogs(selectedConfig.id);
      }
    }, 30000); // 30 secondi

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, fetchConfigs, selectedConfig, refreshLogs]);

  // Gestione errori di esecuzione
  useEffect(() => {
    if (executionError) {
      toast.error(executionError);
      clearExecutionError();
    }
  }, [executionError, clearExecutionError]);

  // --- LOGICA FILTRI E PAGINAZIONE ---
  const filteredConfigs = useMemo(() => {
    return configs.filter(
      (config) =>
        config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.baseUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (config.selectedFields &&
          config.selectedFields.some((field) =>
            field.toLowerCase().includes(searchQuery.toLowerCase()),
          )),
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
  const handleAddConfig = useCallback(
    async (newConfig: ApiConfig) => {
      try {
        await saveConfig(newConfig);
        setIsAddModalOpen(false);
        toast.success("Configurazione salvata con successo!");
      } catch (err) {
        console.error("Errore salvataggio:", err);
        toast.error("Errore durante il salvataggio della configurazione");
      }
    },
    [saveConfig],
  );

  const handleConfigClick = useCallback(
    (config: ApiConfig) => {
      setSelectedConfig(config);
      setIsDrawerOpen(true);
      // Carica la history specifica per questa configurazione
      refreshLogs(config.id);
    },
    [refreshLogs],
  );

  const handleUpdateConfig = useCallback(
    async (updatedConfig: ApiConfig) => {
      try {
        await updateConfig(updatedConfig);
        setSelectedConfig(updatedConfig);
        toast.success("Configurazione aggiornata con successo!");
      } catch (error) {
        console.error("Errore aggiornamento:", error);
        toast.error("Errore durante l'aggiornamento");
      }
    },
    [updateConfig],
  );

  const handleDeleteConfig = useCallback(
    async (id: string) => {
      if (
        window.confirm(
          "Sei sicuro di voler eliminare questa configurazione? Tutti i log associati verranno persi.",
        )
      ) {
        try {
          await deleteConfig(id);
          setIsDrawerOpen(false);
          setSelectedConfig(null);
          toast.success("Configurazione eliminata con successo!");
        } catch (error) {
          console.error("Errore eliminazione:", error);
          toast.error("Errore durante l'eliminazione");
        }
      }
    },
    [deleteConfig],
  );

  const handleExecuteWithFeedback = useCallback(
    async (configId: string, params?: any) => {
      try {
        await runExecution(configId, params);
        toast.success("Esecuzione completata con successo!");
      } catch (error) {
        // L'errore è già gestito dal controller e mostrato tramite toast
        console.error("Errore durante l'esecuzione:", error);
      }
    },
    [runExecution],
  );

  const handleRefreshAll = useCallback(() => {
    fetchConfigs();
    if (selectedConfig) {
      refreshLogs(selectedConfig.id);
    }
    toast.info("Dati aggiornati");
  }, [fetchConfigs, selectedConfig, refreshLogs]);

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

  // Loading durante l'esecuzione (modalità fullscreen)
  if (isExecuting && selectedConfig) {
    return (
      <div className="dark min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
          <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-l-2 border-r-2 border-indigo-500/20 animate-pulse"></div>
        </div>
        <p className="mt-4 text-zinc-400 font-medium animate-pulse">
          Esecuzione di "{selectedConfig.name}" in corso...
        </p>
        <p className="text-sm text-zinc-600 mt-2">
          Estrazione dei dati dall'API
        </p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-zinc-950 text-white font-['Inter'] selection:bg-indigo-500/30">
      {/* Toast Provider */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: "bg-zinc-900 text-white border border-zinc-800",
          duration: 4000,
        }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPage(0);
          }}
          onAddClick={() => setIsAddModalOpen(true)}
          onRefreshClick={handleRefreshAll}
          autoRefreshEnabled={autoRefreshEnabled}
          onAutoRefreshToggle={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
        />

        {/* Main Content */}
        <main className="px-6 pb-12">
          {/* Header Section */}
          <div className="mb-8 pt-8 border-b border-zinc-900 pb-8">
            <div className="flex items-center justify-between">
              <div>
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
                  {configs.length > 0 && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <p className="text-zinc-500 text-sm">
                        Totale campi estratti:{" "}
                        <span className="text-indigo-400">
                          {configs.reduce(
                            (total, config) =>
                              total + (config.selectedFields?.length || 0),
                            0,
                          )}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Auto Refresh Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshAll}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={isConfigsLoading ? "animate-spin" : ""}
                  >
                    <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9c2.5 0 4.8 1 6.5 2.6L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                  Refresh
                </button>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={autoRefreshEnabled}
                      onChange={() =>
                        setAutoRefreshEnabled(!autoRefreshEnabled)
                      }
                      className="sr-only"
                    />
                    <div
                      className={`block w-10 h-6 rounded-full transition-colors ${
                        autoRefreshEnabled ? "bg-indigo-600" : "bg-zinc-700"
                      }`}
                    ></div>
                    <div
                      className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                        autoRefreshEnabled ? "transform translate-x-4" : ""
                      }`}
                    ></div>
                  </div>
                  <span className="text-sm text-zinc-400">Auto-refresh</span>
                </label>
              </div>
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
                <button
                  onClick={() => fetchConfigs()}
                  className="ml-auto text-sm bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded"
                >
                  Riprova
                </button>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          {configs.length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Total APIs</p>
                    <p className="text-2xl font-bold text-white">
                      {configs.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">GET Methods</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {configs.filter((c) => c.method === "GET").length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 19l7-7 3 3-7 7-3-3z" />
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">POST Methods</p>
                    <p className="text-2xl font-bold text-amber-400">
                      {configs.filter((c) => c.method === "POST").length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                {searchQuery
                  ? "Prova con un'altra ricerca"
                  : "Aggiungi una nuova configurazione per iniziare"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                >
                  Pulisci ricerca
                </button>
              )}
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
        onExecute={handleExecuteWithFeedback}
        isExecuting={isExecuting}
        // Log & History
        logs={logs}
        isLoadingLogs={isLoadingLogs}
        onRefreshLogs={() => {
          if (selectedConfig) refreshLogs(selectedConfig.id);
        }}
        onDeleteLog={async (logId: string) => {
          if (selectedConfig) {
            try {
              await removeLog(selectedConfig.id, logId);
              toast.success("Log eliminato con successo!");
            } catch (error) {
              toast.error("Errore durante l'eliminazione del log");
            }
          }
        }}
        onDownload={(format) => {
          if (selectedConfig) {
            downloadLogs(selectedConfig.name, format);
            toast.info(`Download ${format.toUpperCase()} iniziato`);
          }
        }}
        lastResult={lastResult}
      />
    </div>
  );
}
