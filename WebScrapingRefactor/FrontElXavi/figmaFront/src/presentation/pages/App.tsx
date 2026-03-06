// src/presentation/pages/App.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { TopBar } from "../components/TopBar";
import { ConfigCard } from "../components/ConfigCard";
import { ScrapingConfigCard } from "../components/Scrapingconfigcard";
import { AddConfigModal } from "../components/AddConfigModal";
import { ConfigDrawer } from "../components/ConfigDrawer";
import { ScrapingConfigDrawer } from "../components/ScrapingConfigDrawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

// Controller Hooks
import { useConfigController } from "../hooks/useConfigController";
import { useExecutionController } from "../hooks/useExecutionController";
import { useScrapingConfigController } from "../hooks/useScrapingConfigController";
import { useScrapingExecutionController } from "../hooks/useScrapingExecutionController";

// Tipi
import type { ApiConfig } from "../../domain/entities/ApiConfig";
import type { ScrapingConfig } from "../../domain/entities/ScrapingConfig";

export default function App() {
  // --- STATO UI ---
  const [configType, setConfigType] = useState<"api" | "scraping">("api");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // --- CONTROLLER API ---
  const {
    configs: apiConfigs,
    isLoading: isApiLoading,
    error: apiError,
    fetchConfigs: fetchApiConfigs,
    saveConfig: saveApiConfig,
    updateConfig: updateApiConfig,
    deleteConfig: deleteApiConfig,
  } = useConfigController();

  // --- CONTROLLER ESECUZIONI API ---
  const {
    runExecution: runApiExecution,
    logs: apiLogs,
    isLoadingLogs: isApiLogsLoading,
    refreshLogs: refreshApiLogs,
    removeLog: removeApiLog,
    downloadLogs: downloadApiLogs,
    isExecuting: isApiExecuting,
    lastResult: lastApiResult,
    error: apiExecutionError,
    clearError: clearApiExecutionError,
  } = useExecutionController();

  // --- CONTROLLER SCRAPING ---
  const {
    configs: scrapingConfigs,
    isLoading: isScrapingLoading,
    error: scrapingError,
    fetchConfigs: fetchScrapingConfigs,
    saveScrapingConfig: saveScrapingConfig,
    updateConfig: updateScrapingConfig,
    deleteConfig: deleteScrapingConfig,
  } = useScrapingConfigController();

  // --- CONTROLLER ESECUZIONI SCRAPING ---
  const {
    execute: executeScraping,
    logs: scrapingLogs,
    isLoadingLogs: isScrapingLogsLoading,
    fetchLogs: fetchScrapingLogs,
    deleteLog: deleteScrapingLog,
    downloadLogs: downloadScrapingLogs,
    isExecuting: isScrapingExecuting,
    lastResult: lastScrapingResult,
    error: scrapingExecutionError,
    clearError: clearScrapingExecutionError,
  } = useScrapingExecutionController();

  // --- STATO API DRAWER ---
  const [selectedApiConfig, setSelectedApiConfig] = useState<ApiConfig | null>(
    null,
  );
  const [isApiDrawerOpen, setIsApiDrawerOpen] = useState(false);
  const [apiConfigToDelete, setApiConfigToDelete] = useState<ApiConfig | null>(
    null,
  );

  // --- STATO SCRAPING DRAWER ---
  const [selectedScrapingConfig, setSelectedScrapingConfig] =
    useState<ScrapingConfig | null>(null);
  const [isScrapingDrawerOpen, setIsScrapingDrawerOpen] = useState(false);
  const [scrapingConfigToDelete, setScrapingConfigToDelete] =
    useState<ScrapingConfig | null>(null);

  // --- EFFETTI ---
  // Caricamento iniziale
  useEffect(() => {
    fetchApiConfigs();
  }, [fetchApiConfigs]);

  useEffect(() => {
    console.log("[App] configType changed to:", configType);
    if (configType === "scraping") {
      console.log("[App] Calling fetchScrapingConfigs...");
      fetchScrapingConfigs().then(() => {
        console.log(
          "[App] fetchScrapingConfigs done, scrapingConfigs:",
          scrapingConfigs,
        );
      });
    }
  }, [configType, fetchScrapingConfigs]);

  // Refresh automatico ogni 30 secondi
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      if (configType === "api") {
        fetchApiConfigs();
        if (selectedApiConfig) {
          refreshApiLogs(selectedApiConfig.id);
        }
      } else {
        fetchScrapingConfigs();
        if (selectedScrapingConfig) {
          fetchScrapingLogs(selectedScrapingConfig.id);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [
    autoRefreshEnabled,
    configType,
    fetchApiConfigs,
    fetchScrapingConfigs,
    selectedApiConfig,
    selectedScrapingConfig,
    refreshApiLogs,
    fetchScrapingLogs,
  ]);

  // Gestione errori
  useEffect(() => {
    if (apiExecutionError) {
      toast.error(apiExecutionError);
      clearApiExecutionError();
    }
  }, [apiExecutionError, clearApiExecutionError]);

  useEffect(() => {
    if (scrapingExecutionError) {
      toast.error(scrapingExecutionError);
      clearScrapingExecutionError();
    }
  }, [scrapingExecutionError, clearScrapingExecutionError]);

  // --- LOGICA FILTRI E PAGINAZIONE ---
  const filteredApiConfigs = useMemo(() => {
    return apiConfigs.filter(
      (config) =>
        config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.baseUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (config.selectedFields &&
          config.selectedFields.some((field) =>
            field.toLowerCase().includes(searchQuery.toLowerCase()),
          )),
    );
  }, [apiConfigs, searchQuery]);

  const filteredScrapingConfigs = useMemo(() => {
    return scrapingConfigs.filter(
      (config) =>
        config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        config.url.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [scrapingConfigs, searchQuery]);

  const paginatedApiConfigs = useMemo(() => {
    return filteredApiConfigs.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [filteredApiConfigs, page, rowsPerPage]);

  const paginatedScrapingConfigs = useMemo(() => {
    return filteredScrapingConfigs.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [filteredScrapingConfigs, page, rowsPerPage]);

  const totalApiPages = Math.ceil(filteredApiConfigs.length / rowsPerPage);
  const totalScrapingPages = Math.ceil(
    filteredScrapingConfigs.length / rowsPerPage,
  );
  const currentTotalPages =
    configType === "api" ? totalApiPages : totalScrapingPages;
  const currentPaginatedConfigs =
    configType === "api" ? paginatedApiConfigs : paginatedScrapingConfigs;
  const isLoading = configType === "api" ? isApiLoading : isScrapingLoading;
  const error = configType === "api" ? apiError : scrapingError;

  // --- HANDLERS API ---
  const handleAddConfig = useCallback(
    async (
      newConfig: Omit<ApiConfig, "id"> | Omit<ScrapingConfig, "id">,
      type: "api" | "scraping",
    ) => {
      try {
        if (type === "api") {
          await saveApiConfig(newConfig as ApiConfig);
          await fetchApiConfigs();
          setConfigType("api");
          toast.success("Configurazione API salvata con successo!");
        } else {
          await saveScrapingConfig(newConfig as Omit<ScrapingConfig, "id">);
          await fetchScrapingConfigs();
          setConfigType("scraping");
          toast.success("Configurazione scraping salvata con successo!");
        }
        setIsAddModalOpen(false);
      } catch (err) {
        console.error("Errore salvataggio:", err);
        toast.error("Errore durante il salvataggio della configurazione");
      }
    },
    [saveApiConfig, saveScrapingConfig, fetchApiConfigs, fetchScrapingConfigs],
  );

  const handleApiConfigClick = useCallback(
    (config: ApiConfig) => {
      setSelectedApiConfig(config);
      setIsApiDrawerOpen(true);
      refreshApiLogs(config.id);
    },
    [refreshApiLogs],
  );

  const handleScrapingConfigClick = useCallback(
    (config: ScrapingConfig) => {
      setSelectedScrapingConfig(config);
      setIsScrapingDrawerOpen(true);
      fetchScrapingLogs(config.id);
    },
    [fetchScrapingLogs],
  );

  const handleUpdateApiConfig = useCallback(
    async (updatedConfig: ApiConfig) => {
      try {
        await updateApiConfig(updatedConfig);
        setSelectedApiConfig(updatedConfig);
        toast.success("Configurazione API aggiornata con successo!");
      } catch (error) {
        console.error("Errore aggiornamento:", error);
        toast.error("Errore durante l'aggiornamento");
      }
    },
    [updateApiConfig],
  );

  const handleUpdateScrapingConfig = useCallback(
    async (updatedConfig: ScrapingConfig) => {
      try {
        await updateScrapingConfig(updatedConfig.id, updatedConfig);
        setSelectedScrapingConfig(updatedConfig);
        toast.success("Configurazione scraping aggiornata con successo!");
      } catch (error) {
        console.error("Errore aggiornamento:", error);
        toast.error("Errore durante l'aggiornamento");
      }
    },
    [updateScrapingConfig],
  );

  // --- HANDLERS ELIMINAZIONE ---
  const handleApiDeleteClick = useCallback((config: ApiConfig) => {
    setApiConfigToDelete(config);
  }, []);

  const handleScrapingDeleteClick = useCallback((config: ScrapingConfig) => {
    setScrapingConfigToDelete(config);
  }, []);

  const handleConfirmApiDelete = useCallback(async () => {
    if (!apiConfigToDelete) return;
    try {
      await deleteApiConfig(apiConfigToDelete.id);
      if (selectedApiConfig?.id === apiConfigToDelete.id) {
        setIsApiDrawerOpen(false);
        setSelectedApiConfig(null);
      }
      toast.success("Configurazione API eliminata con successo!");
    } catch (error) {
      console.error("Errore eliminazione:", error);
      toast.error("Errore durante l'eliminazione");
    } finally {
      setApiConfigToDelete(null);
    }
  }, [apiConfigToDelete, deleteApiConfig, selectedApiConfig]);

  const handleConfirmScrapingDelete = useCallback(async () => {
    if (!scrapingConfigToDelete) return;
    try {
      await deleteScrapingConfig(scrapingConfigToDelete.id);
      if (selectedScrapingConfig?.id === scrapingConfigToDelete.id) {
        setIsScrapingDrawerOpen(false);
        setSelectedScrapingConfig(null);
      }
      toast.success("Configurazione scraping eliminata con successo!");
    } catch (error) {
      console.error("Errore eliminazione:", error);
      toast.error("Errore durante l'eliminazione");
    } finally {
      setScrapingConfigToDelete(null);
    }
  }, [scrapingConfigToDelete, deleteScrapingConfig, selectedScrapingConfig]);

  // --- HANDLERS ESECUZIONE ---
  const handleApiExecuteWithFeedback = useCallback(
    async (configId: string, params?: any) => {
      try {
        await runApiExecution(configId, params);
        toast.success("Esecuzione API completata con successo!");
      } catch (error) {
        console.error("Errore durante l'esecuzione:", error);
      }
    },
    [runApiExecution],
  );

  const handleScrapingExecuteWithFeedback = useCallback(
    async (configId: string, params?: any) => {
      try {
        await executeScraping(configId, params);
        toast.success("Esecuzione scraping completata con successo!");
      } catch (error) {
        console.error("Errore durante l'esecuzione:", error);
      }
    },
    [executeScraping],
  );

  // --- HANDLER REFRESH ---
  const handleRefreshAll = useCallback(() => {
    if (configType === "api") {
      fetchApiConfigs();
      if (selectedApiConfig) {
        refreshApiLogs(selectedApiConfig.id);
      }
    } else {
      fetchScrapingConfigs();
      if (selectedScrapingConfig) {
        fetchScrapingLogs(selectedScrapingConfig.id);
      }
    }
    toast.info("Dati aggiornati");
  }, [
    configType,
    fetchApiConfigs,
    fetchScrapingConfigs,
    selectedApiConfig,
    selectedScrapingConfig,
    refreshApiLogs,
    fetchScrapingLogs,
  ]);

  // --- RENDER LOADING STATO INIZIALE ---
  // Solo al primissimo caricamento API (non blocca il tab switch)
  if (isApiLoading && apiConfigs.length === 0 && scrapingConfigs.length === 0) {
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
      <Toaster
        position="top-right"
        toastOptions={{
          className: "bg-zinc-900 text-white border border-zinc-800",
          duration: 4000,
        }}
      />

      <div className="max-w-7xl mx-auto">
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

        {/* Tab Switcher */}
        <div className="px-6 pt-4">
          <div className="inline-flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => setConfigType("api")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                configType === "api"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              API Configurations
            </button>
            <button
              onClick={() => {
                console.log("BUTTON CLICKED - scraping");
                setConfigType("scraping");
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                configType === "scraping"
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Scraping Configurations
            </button>
          </div>
        </div>

        <main className="px-6 pb-12">
          {/* Header Section */}
          <div className="mb-8 pt-8 border-b border-zinc-900 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                  {configType === "api"
                    ? "API Dashboard"
                    : "Scraping Dashboard"}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  <p className="text-zinc-400 font-medium">
                    {configType === "api"
                      ? filteredApiConfigs.length
                      : filteredScrapingConfigs.length}{" "}
                    configurazioni attive
                  </p>
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
                    className={isLoading ? "animate-spin" : ""}
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

            {error && (
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
                {error}
                <button
                  onClick={
                    configType === "api"
                      ? fetchApiConfigs
                      : fetchScrapingConfigs
                  }
                  className="ml-auto text-sm bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded"
                >
                  Riprova
                </button>
              </div>
            )}
          </div>

          {/* Config Cards Grid */}
          {currentPaginatedConfigs.length === 0 ? (
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
                {configType === "api"
                  ? paginatedApiConfigs.map((config) => (
                      <ConfigCard
                        key={config.id}
                        config={config}
                        onClick={() => handleApiConfigClick(config)}
                        onDelete={handleApiDeleteClick}
                      />
                    ))
                  : paginatedScrapingConfigs.map((config) => (
                      <ScrapingConfigCard
                        key={config.id}
                        config={config}
                        onClick={() => handleScrapingConfigClick(config)}
                        onDelete={handleScrapingDeleteClick}
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
                    {Math.min(
                      (page + 1) * rowsPerPage,
                      configType === "api"
                        ? filteredApiConfigs.length
                        : filteredScrapingConfigs.length,
                    )}{" "}
                    di{" "}
                    {configType === "api"
                      ? filteredApiConfigs.length
                      : filteredScrapingConfigs.length}
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
                        setPage((p) => Math.min(currentTotalPages - 1, p + 1))
                      }
                      disabled={page >= currentTotalPages - 1}
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

      {/* API Drawer */}
      <ConfigDrawer
        isOpen={isApiDrawerOpen}
        config={selectedApiConfig}
        onClose={() => setIsApiDrawerOpen(false)}
        onUpdate={handleUpdateApiConfig}
        onDelete={handleApiDeleteClick}
        onExecute={handleApiExecuteWithFeedback}
        isExecuting={isApiExecuting}
        logs={apiLogs}
        isLoadingLogs={isApiLogsLoading}
        onRefreshLogs={() => {
          if (selectedApiConfig) refreshApiLogs(selectedApiConfig.id);
        }}
        onDeleteLog={async (logId: string) => {
          if (selectedApiConfig) {
            try {
              await removeApiLog(selectedApiConfig.id, logId);
              toast.success("Log eliminato con successo!");
            } catch (error) {
              toast.error("Errore durante l'eliminazione del log");
            }
          }
        }}
        onDownload={(format) => {
          if (selectedApiConfig) {
            downloadApiLogs(selectedApiConfig.name, format);
            toast.info(`Download ${format.toUpperCase()} iniziato`);
          }
        }}
        lastResult={lastApiResult}
      />

      {/* Scraping Drawer */}
      <ScrapingConfigDrawer
        isOpen={isScrapingDrawerOpen}
        config={selectedScrapingConfig}
        onClose={() => setIsScrapingDrawerOpen(false)}
        onUpdate={handleUpdateScrapingConfig}
        onDelete={handleScrapingDeleteClick}
        onExecute={handleScrapingExecuteWithFeedback}
        isExecuting={isScrapingExecuting}
        logs={scrapingLogs}
        isLoadingLogs={isScrapingLogsLoading}
        onRefreshLogs={() => {
          if (selectedScrapingConfig)
            fetchScrapingLogs(selectedScrapingConfig.id);
        }}
        onDeleteLog={async (logId: string) => {
          if (selectedScrapingConfig) {
            try {
              await deleteScrapingLog(selectedScrapingConfig.id, logId);
              toast.success("Log eliminato con successo!");
            } catch (error) {
              toast.error("Errore durante l'eliminazione del log");
            }
          }
        }}
        onDownload={(format) => {
          if (selectedScrapingConfig) {
            downloadScrapingLogs(selectedScrapingConfig.name, format);
            toast.info(`Download ${format.toUpperCase()} iniziato`);
          }
        }}
        lastResult={lastScrapingResult}
      />

      {/* Dialog conferma eliminazione API */}
      <Dialog
        open={!!apiConfigToDelete}
        onOpenChange={(open) => !open && setApiConfigToDelete(null)}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Elimina configurazione API</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Sei sicuro di voler eliminare la configurazione{" "}
              <span className="font-semibold text-white">
                "{apiConfigToDelete?.name}"
              </span>
              ? Questa azione è irreversibile e tutti i log associati verranno
              persi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApiConfigToDelete(null)}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
            >
              Annulla
            </Button>
            <Button
              onClick={handleConfirmApiDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog conferma eliminazione Scraping */}
      <Dialog
        open={!!scrapingConfigToDelete}
        onOpenChange={(open) => !open && setScrapingConfigToDelete(null)}
      >
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Elimina configurazione scraping</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Sei sicuro di voler eliminare la configurazione{" "}
              <span className="font-semibold text-white">
                "{scrapingConfigToDelete?.name}"
              </span>
              ? Questa azione è irreversibile e tutti i log associati verranno
              persi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScrapingConfigToDelete(null)}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white"
            >
              Annulla
            </Button>
            <Button
              onClick={handleConfirmScrapingDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
