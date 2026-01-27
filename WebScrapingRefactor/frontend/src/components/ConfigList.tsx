import { useEffect, useState } from "react";
import { getConfigs } from "../services/configService";
import type { ApiConfig } from "../types/ApiConfig";

export function ConfigList() {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getConfigs()
      .then((data) => {
        setConfigs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Caricamento dei Configurazione trovati...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Configurazione salvata</h2>

      {configs.length === 0 ? (
        <p>Nessun Configurazione trovata.</p>
      ) : (
        <ul>
          {configs.map((c) => (
            <li key={c.name}>{c.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
