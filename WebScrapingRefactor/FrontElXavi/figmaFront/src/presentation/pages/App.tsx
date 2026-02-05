/**
 * Presentation Layer: App Component
 * Main application component - Uses Controller Hooks
 */

import { useState } from "react";
import { TopBar } from "../components/TopBar";
import { ConfigCard } from "../components/ConfigCard";
import { AddConfigModal } from "../components/AddConfigModal";
import { ConfigDrawer } from "../components/ConfigDrawer";
import { useConfigController } from "../hooks/useConfigController";
import type { ApiConfig } from "../../domain/entities/ApiConfig";

export default function App() {
  const {
    configs,
    loading,
    error: configError,
    saveConfig,
    updateConfig,
    deleteConfig,
  } = useConfigController();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<ApiConfig | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const filteredConfigs = configs.filter(
    (config) =>
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.baseUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.endpoint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const paginatedConfigs = filteredConfigs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const totalPages = Math.ceil(filteredConfigs.length / rowsPerPage);

  const handleAddConfig = async (newConfig: ApiConfig) => {
    setIsAddModalOpen(false);
    // Config is already saved by the hook, just close modal
  };

  const handleConfigClick = (config: ApiConfig) => {
    setSelectedConfig(config);
    setIsDrawerOpen(true);
  };

  const handleUpdateConfig = async (updatedConfig: ApiConfig) => {
    try {
      await updateConfig(updatedConfig);
      setSelectedConfig(updatedConfig);
    } catch (error) {
      console.error("Failed to update config:", error);
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      await deleteConfig(id);
      setIsDrawerOpen(false);
      setSelectedConfig(null);
    } catch (error) {
      console.error("Failed to delete config:", error);
    }
  };

  if (loading) {
    return (
      <div className="dark min-h-screen bg-zinc-950 text-white font-['Inter'] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading configurations...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-white mb-2">
              API Configurations
            </h1>
            <p className="text-zinc-400">
              {filteredConfigs.length}{" "}
              {filteredConfigs.length === 1 ? "configuration" : "configurations"}{" "}
              available
            </p>
            {configError && (
              <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                {configError}
              </div>
            )}
          </div>

          {/* Config Cards Grid */}
          {filteredConfigs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-zinc-400 text-lg">No configurations found</p>
              <p className="text-zinc-500 text-sm mt-2">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by adding your first API configuration"}
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
              <div className="mt-8 flex items-center justify-between border-t border-zinc-800 pt-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400">Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(0);
                    }}
                    className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                  >
                    <option value={3}>3</option>
                    <option value={6}>6</option>
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-zinc-400">
                    {page * rowsPerPage + 1}-
                    {Math.min((page + 1) * rowsPerPage, filteredConfigs.length)}{" "}
                    of {filteredConfigs.length}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(0)}
                      disabled={page === 0}
                      className="p-2 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="First page"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                      className="p-2 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Previous page"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: totalPages }, (_, i) => i).map(
                        (pageNum) => {
                          // Show first page, last page, current page, and pages around current
                          const showPage =
                            pageNum === 0 ||
                            pageNum === totalPages - 1 ||
                            Math.abs(pageNum - page) <= 1;

                          const showEllipsis =
                            (pageNum === 1 && page > 3) ||
                            (pageNum === totalPages - 2 && page < totalPages - 4);

                          if (showEllipsis) {
                            return (
                              <span key={pageNum} className="px-2 text-zinc-500">
                                ...
                              </span>
                            );
                          }

                          if (!showPage) return null;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`min-w-[36px] h-9 px-3 rounded transition-colors ${
                                page === pageNum
                                  ? "bg-indigo-600 text-white"
                                  : "hover:bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="p-2 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Next page"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPage(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                      className="p-2 rounded hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Last page"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
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
