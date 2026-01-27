import { useEffect, useState } from "react";
import { getConfigs, executeConfig } from "../services/configService";
import  type { ApiConfig } from "../types/ApiConfig";

export function ConfigList() {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

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

  const handleExecute = async (name: string) => {
    const data = await executeConfig(name);
    setResult(data);
  };

  if (loading) return <p>Caricamento dei Configurazione trovati...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Saved Configurations</h2>

      {configs.length === 0 ? (
        <p>Nessun configurazione trovata.</p>
      ) : (
        <ul>
          {configs.map((c) => (
            <li key={c.name} style={{ marginBottom: "10px" }}>
              {c.name}
              <button
                style={{ marginLeft: "10px" }}
                onClick={() => handleExecute(c.name)}
              >
                Execute
              </button>
            </li>
          ))}
        </ul>
      )}

      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Resultati del Execuzione</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
