import { useState, useEffect } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import type { ApiConfig } from "../../../domain/entities/ApiConfig";

interface ConfigurationTabProps {
  config: ApiConfig;
  onUpdate: (config: ApiConfig) => Promise<void>;
  onDelete: (id: string) => void;
}

export function ConfigurationTab({
  config,
  onUpdate,
  onDelete,
}: ConfigurationTabProps) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [endpoint, setEndpoint] = useState(config.endpoint);
  const [headers, setHeaders] = useState<Record<string, string>>(
    config.headers ?? {},
  );
  const [paginationSettings, setPaginationSettings] = useState(
    config.paginationSettings ?? {
      offsetParam: "",
      limitParam: "",
      initialOffset: 0,
      limitPerPage: 10,
    },
  );

useEffect(() => {
  setBaseUrl(config.baseUrl ?? "");
  setEndpoint(config.endpoint ?? "");
  setHeaders(config.headers ?? {});
  setPaginationSettings(
    config.paginationSettings ?? {
      offsetParam: "",
      limitParam: "",
      initialOffset: 0,
      limitPerPage: 10,
    }
  );
}, [config]);


  const handleSave = async () => {
    const updatedConfig: ApiConfig = {
      ...config,
      baseUrl,
      endpoint,
      headers,
      paginationSettings,
    };
    await onUpdate(updatedConfig);
  };

  const handleAddHeader = () => {
    const newKey = `Header-${Object.keys(headers).length + 1}`;
    setHeaders({ ...headers, [newKey]: "" });
  };

  const handleRemoveHeader = (key: string) => {
    const newHeaders = { ...headers };
    delete newHeaders[key];
    setHeaders(newHeaders);
  };

  const handleHeaderKeyChange = (oldKey: string, newKey: string) => {
    const newHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([k, v]) => {
      if (k === oldKey) {
        newHeaders[newKey] = v;
      } else {
        newHeaders[k] = v;
      }
    });
    setHeaders(newHeaders);
  };

  const handleHeaderValueChange = (key: string, value: string) => {
    setHeaders({ ...headers, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Base URL & Endpoint */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
          Endpoint Configuration
        </h3>

        <div className="space-y-2">
          <Label htmlFor="baseUrl" className="text-sm text-zinc-300">
            Base URL
          </Label>
          <Input
            id="baseUrl"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com"
            className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endpoint" className="text-sm text-zinc-300">
            Endpoint Path
          </Label>
          <Input
            id="endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/api/v1/data"
            className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
          />
        </div>
      </div>

      {/* Headers */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
            HTTP Headers
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddHeader}
            className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white gap-1 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Header
          </Button>
        </div>

        <div className="space-y-2">
          {Object.entries(headers).map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <Input
                value={key}
                onChange={(e) => handleHeaderKeyChange(key, e.target.value)}
                placeholder="Header name"
                className="flex-1 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
              />
              <Input
                value={value}
                onChange={(e) => handleHeaderValueChange(key, e.target.value)}
                placeholder="Header value"
                className="flex-1 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemoveHeader(key)}
                className="bg-zinc-900 border-zinc-800 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {Object.keys(headers).length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">
              No headers configured. Click "Add Header" to add one.
            </p>
          )}
        </div>
      </div>

      {/* Pagination Settings */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
          Pagination Logic
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="offsetParam" className="text-sm text-zinc-300">
              Offset Parameter
            </Label>
            <Input
              id="offsetParam"
              value={paginationSettings.offsetParam}
              onChange={(e) =>
                setPaginationSettings({
                  ...paginationSettings,
                  offsetParam: e.target.value,
                })
              }
              placeholder="offset"
              className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limitParam" className="text-sm text-zinc-300">
              Limit Parameter
            </Label>
            <Input
              id="limitParam"
              value={paginationSettings.limitParam}
              onChange={(e) =>
                setPaginationSettings({
                  ...paginationSettings,
                  limitParam: e.target.value,
                })
              }
              placeholder="limit"
              className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialOffset" className="text-sm text-zinc-300">
              Initial Offset
            </Label>
            <Input
              id="initialOffset"
              type="number"
              value={paginationSettings.initialOffset}
              onChange={(e) =>
                setPaginationSettings({
                  ...paginationSettings,
                  initialOffset: parseInt(e.target.value) || 0,
                })
              }
              className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limitPerPage" className="text-sm text-zinc-300">
              Items Per Page
            </Label>
            <Input
              id="limitPerPage"
              type="number"
              value={paginationSettings.limitPerPage}
              onChange={(e) =>
                setPaginationSettings({
                  ...paginationSettings,
                  limitPerPage: parseInt(e.target.value) || 10,
                })
              }
              className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
            />
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
          <p className="text-xs text-zinc-400">
            Example URL:{" "}
            <span className="text-zinc-300 font-mono">
              {baseUrl}
              {endpoint}?{paginationSettings.offsetParam}=0&
              {paginationSettings.limitParam}={paginationSettings.limitPerPage}
            </span>
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-zinc-800">
        <Button
          onClick={handleSave}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Save Changes
        </Button>
        <Button
          onClick={() => {
            if (
              confirm("Are you sure you want to delete this configuration?")
            ) {
              onDelete(config.id);
            }
          }}
          variant="outline"
          className="bg-red-500/10 border-red-500/50 hover:bg-red-500/20 hover:border-red-500 text-red-400 gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
