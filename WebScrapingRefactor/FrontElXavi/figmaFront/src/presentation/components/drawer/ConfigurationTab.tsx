import { useState, useEffect } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import type { ApiConfig, ApiParam, PaginationConfig } from "../../../domain/entities/ApiConfig";

interface ConfigurationTabProps {
  config: ApiConfig;
  onUpdate: (config: ApiConfig) => Promise<void>;
  onDelete: (config: ApiConfig) => void; 
}

export function ConfigurationTab({
  config,
  onUpdate,
  onDelete,
}: ConfigurationTabProps) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [endpoint, setEndpoint] = useState(config.endpoint);
  const [headers, setHeaders] = useState<Record<string, string>>(config.headers ?? {});
  const [queryParams, setQueryParams] = useState<ApiParam[]>(config.queryParams ?? []);
  const [dataPath, setDataPath] = useState(config.dataPath || "");
  const [selectedFields, setSelectedFields] = useState<string[]>(config.selectedFields || []);
  const [pagination, setPagination] = useState<PaginationConfig>(
    config.pagination ?? {
      type: "offset",
      paramName: "offset",
      limitParam: "limit",
      defaultLimit: 50,
    }
  );

  useEffect(() => {
    setBaseUrl(config.baseUrl ?? "");
    setEndpoint(config.endpoint ?? "");
    setHeaders(config.headers ?? {});
    setQueryParams(config.queryParams ?? []);
    setDataPath(config.dataPath || "");
    setSelectedFields(config.selectedFields || []);
    setPagination(
      config.pagination ?? {
        type: "offset",
        paramName: "offset",
        limitParam: "limit",
        defaultLimit: 50,
      }
    );
  }, [config]);

  const handleSave = async () => {
    const validQueryParams = queryParams
      .filter(p => p.key && p.key.trim() !== "")
      .map(p => ({ 
        key: p.key.trim(), 
        value: p.value?.trim() || "" 
      }));

    const updatedConfig: ApiConfig = {
      ...config,
      baseUrl,
      endpoint,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      ...(validQueryParams.length > 0 && { queryParams: validQueryParams }),
      dataPath: dataPath || undefined,
      selectedFields: selectedFields.length > 0 ? selectedFields : undefined,
      pagination,
    };
    await onUpdate(updatedConfig);
  };

  const handleAddQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '' }]);
  };

  const handleRemoveQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  const handleQueryParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...queryParams];
    updated[index] = { ...updated[index], [field]: value };
    setQueryParams(updated);
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

  const handleAddSelectedField = () => {
    const newField = prompt("Enter field name (e.g., data.results.id):");
    if (newField && newField.trim()) {
      setSelectedFields([...selectedFields, newField.trim()]);
    }
  };

  const handleRemoveSelectedField = (index: number) => {
    setSelectedFields(selectedFields.filter((_, i) => i !== index));
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

      {/* Data Path */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
          Data Extraction
        </h3>

        <div className="space-y-2">
          <Label htmlFor="dataPath" className="text-sm text-zinc-300">
            Data Path (Optional)
          </Label>
          <Input
            id="dataPath"
            value={dataPath}
            onChange={(e) => setDataPath(e.target.value)}
            placeholder="e.g., data.results or response.items"
            className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
          />
          <p className="text-xs text-zinc-500">
            Path to the array of items in the JSON response. Leave empty to extract from root.
          </p>
        </div>
      </div>

      {/* Query Parameters */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
            Query Parameters
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddQueryParam}
            className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white gap-1 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Param
          </Button>
        </div>

        <div className="space-y-2">
          {queryParams.map((param, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={param.key}
                onChange={(e) => handleQueryParamChange(index, 'key', e.target.value)}
                placeholder="Parameter name"
                className="flex-1 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
              />
              <Input
                value={param.value}
                onChange={(e) => handleQueryParamChange(index, 'value', e.target.value)}
                placeholder="Parameter value"
                className="flex-1 bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemoveQueryParam(index)}
                className="bg-zinc-900 border-zinc-800 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {queryParams.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">
              No query parameters configured.
            </p>
          )}
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
              No headers configured.
            </p>
          )}
        </div>
      </div>

      {/* Selected Fields */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
            Fields to Extract
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSelectedField}
            className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white gap-1 h-8"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Field
          </Button>
        </div>

        <div className="space-y-2">
          {selectedFields.map((field, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm font-mono text-zinc-300">
                {field}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemoveSelectedField(index)}
                className="bg-zinc-900 border-zinc-800 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {selectedFields.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-4">
              No fields selected. Add fields to extract from the API response.
            </p>
          )}
        </div>
      </div>

      {/* Pagination Settings */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-300 uppercase tracking-wide">
          Pagination Settings
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="paginationType" className="text-sm text-zinc-300">
              Type
            </Label>
            <Select
              value={pagination.type}
              onValueChange={(value: "page" | "offset") => 
                setPagination({...pagination, type: value})
              }
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Page-based</SelectItem>
                <SelectItem value="offset">Offset-based</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paramName" className="text-sm text-zinc-300">
              {pagination.type === "page" ? "Page Param" : "Offset Param"}
            </Label>
            <Input
              id="paramName"
              value={pagination.paramName}
              onChange={(e) =>
                setPagination({
                  ...pagination,
                  paramName: e.target.value,
                })
              }
              placeholder={pagination.type === "page" ? "page" : "offset"}
              className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limitParam" className="text-sm text-zinc-300">
              Limit Parameter
            </Label>
            <Input
              id="limitParam"
              value={pagination.limitParam}
              onChange={(e) =>
                setPagination({
                  ...pagination,
                  limitParam: e.target.value,
                })
              }
              placeholder="limit"
              className="bg-zinc-900 border-zinc-800 focus-visible:border-indigo-500 text-white font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultLimit" className="text-sm text-zinc-300">
              Default Limit
            </Label>
            <Input
              id="defaultLimit"
              type="number"
              value={pagination.defaultLimit}
              onChange={(e) =>
                setPagination({
                  ...pagination,
                  defaultLimit: parseInt(e.target.value) || 50,
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
              {endpoint}
              {queryParams.length > 0 
                ? `?${queryParams.map(p => `${p.key}=${p.value}`).join('&')}`
                : ''}
              {queryParams.length > 0 ? '&' : '?'}
              {pagination.paramName}=1&
              {pagination.limitParam}={pagination.defaultLimit}
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
          onClick={() => onDelete(config)} // Passa l'intero config
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