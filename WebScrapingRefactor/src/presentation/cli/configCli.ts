import fs from "fs";
import path from "path";
import readline from "readline";

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

export async function configCli() {
  const name = await ask("Nome dell'API : ");
  const baseUrl = await ask("Base URL: ");
  const listEndpoint = await ask("Endpoint lista: ");
  const detailEndpoint = await ask("Endpoint dettaglio (opzionale): ");
  const defaultLimit = parseInt(await ask("Limite di default per pagina: ")) || 10;
  const supportsPagination = (await ask("Supporta paginazione (si/no)? ")).toLowerCase() === "si";

  const newConfig = {
    name,
    baseUrl,
    listEndpoint,
    detailEndpoint: detailEndpoint || undefined,
    defaultLimit,
    supportsPagination,
    paginationParams: supportsPagination
      ? { pageParam: "page", limitParam: "limit" }
      : undefined
  };

  const configPath = path.join(process.cwd(), "src", "config", `${name}.json`);
  fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), "utf-8");

  console.log(`Configurazione per ${name} salvata in src/config/${name}.json`);
}
