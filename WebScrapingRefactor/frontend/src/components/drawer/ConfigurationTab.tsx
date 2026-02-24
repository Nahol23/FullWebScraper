import { useState } from "react";
import { Save, Trash2, Globe, Database } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import type { ApiConfig } from "../../types/ApiConfig";

interface ConfigurationTabProps {
  config: ApiConfig;
  onUpdate: (config: ApiConfig) => void;
  onDelete: (id: string) => void;
}

export function ConfigurationTab({ config, onUpdate, onDelete }: ConfigurationTabProps) {
  const [formData, setFormData] = useState<ApiConfig>({ ...config });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Config Name</Label>
          <Input 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="bg-zinc-900 border-zinc-800 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">Base URL</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <Input 
                value={formData.baseUrl} 
                onChange={(e) => setFormData({...formData, baseUrl: e.target.value})}
                className="pl-10 bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">Endpoint</Label>
            <Input 
              value={formData.endpoint} 
              onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
              className="bg-zinc-900 border-zinc-800 font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-400 text-xs uppercase tracking-wider">Data Path (JSON selector)</Label>
          <div className="relative">
            <Database className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <Input 
              value={formData.dataPath || ""} 
              onChange={(e) => setFormData({...formData, dataPath: e.target.value})}
              placeholder="e.g. results.items"
              className="pl-10 bg-zinc-900 border-zinc-800 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => confirm("Delete this configuration?") && onDelete(config.id)}
          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-none"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </Button>
        <Button onClick={() => onUpdate(formData)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Save className="w-4 h-4 mr-2" /> Save Configuration
        </Button>
      </div>
    </div>
  );
}