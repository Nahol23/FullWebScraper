import readline from "readline";
import fs from "fs";
import path from "path";
import { ApiAdapter } from "../../infrastructure/adapters/Api/ApiAdapter";
import { ApiUseCase } from "../../application/usecases/Api/ApiUseCase";
import {
  getNestedData,
  flattenObject,
  findFirstArrayPath,
} from "../../infrastructure/utils/ObjectUtils";
import { parseJsonFields } from "../../infrastructure/utils/FindFirstArray";

const ask = (q: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((res) =>
    rl.question(q, (ans) => {
      rl.close();
      res(ans);
    })
  );
};

export async function apiCli() {
  const useCase = new ApiUseCase(new ApiAdapter());
  const configFolder = path.join(process.cwd(), "src", "config");
  const outputDir = path.join(process.cwd(), "output", "api");

  if (!fs.existsSync(configFolder))
    fs.mkdirSync(configFolder, { recursive: true });
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log("\n  API EXTRACTOR \n");

  let url = "";
  let method: "GET" | "POST" = "POST";
  let baseBody: any = {};
  let currentConfigName = "estrazione_manuale";

  //  1. CARICAMENTO CONFIGURAZIONE
  const useSaved = await ask(
    "Vuoi caricare una configurazione esistente? (s/n): "
  );
  if (useSaved.toLowerCase() === "s") {
    const files = fs
      .readdirSync(configFolder)
      .filter((f) => f.endsWith(".json"));
    console.log(
      "\n Disponibili: ",
      files.map((f) => f.replace(".json", "")).join(" | ")
    );
    const nameInput = await ask("Nome config: ");
    currentConfigName = nameInput.replace(".json", "");
    const fullPath = path.join(configFolder, `${currentConfigName}.json`);

    if (fs.existsSync(fullPath)) {
      const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      url = data.url || data.baseUrl + (data.endpoint || "");
      method = data.method || "POST";
      baseBody = data.body || {};
      console.log(` Configurazione '${currentConfigName}' caricata!`);
    }
  }

  //  2. SETUP MANUALE
  if (!url) {
    url = await ask("Inserisci URL completo: ");
    const mInput = await ask("Metodo (GET/POST) [POST]: ");
    method = mInput.toUpperCase() === "GET" ? "GET" : "POST";
    if (method === "POST") {
      const bInput = await ask("JSON Body (invio per {}): ");
      try {
        baseBody = JSON.parse(bInput || "{}");
      } catch (e) {
        baseBody = {};
      }
    }
    const save = await ask("Vuoi salvare la config? (s/n): ");
    if (save.toLowerCase() === "s") {
      currentConfigName = (await ask("Nome per il salvataggio: ")).replace(
        ".json",
        ""
      );
      fs.writeFileSync(
        path.join(configFolder, `${currentConfigName}.json`),
        JSON.stringify({ url, method, body: baseBody }, null, 2)
      );
    }
  }

  //  3. LOGICA DI PAGINAZIONE
  let allData: any[] = [];
  const startPage =
    parseInt(await ask("\nValore iniziale paginazione (es. offset 0): ")) || 0;
  const numPages = parseInt(await ask("Quante pagine vuoi scaricare?: ")) || 1;
  const pField =
    (await ask("Nome parametro paginazione (es. offset o page): ")) || "offset";
  const limitValue =
    parseInt(await ask("Limite per pagina (limit) [100]: ")) || 100;

  for (let i = 0; i < numPages; i++) {
    const currentOffset = startPage + i * limitValue;
    console.log(` Scarico blocco con ${pField} = ${currentOffset}...`);

    try {
      let response;
      if (method === "GET") {
        // COSTRUZIONE URL PER GET (Parametri solo nell'URL)
        const urlObj = new URL(url);
        urlObj.searchParams.set(pField, currentOffset.toString());
        urlObj.searchParams.set("limit", limitValue.toString());

        // Eseguiamo la GET passando null o undefined come body
        response = await useCase.executeRaw(
          urlObj.toString(),
          "GET",
          undefined
        );
      } else {
        // COSTRUZIONE BODY PER POST
        const currentBody = {
          ...baseBody,
          [pField]: currentOffset,
          limit: limitValue,
        };
        response = await useCase.executeRaw(url, "POST", currentBody);
      }

      const dataPath = findFirstArrayPath(response) || "";
      const pageData = getNestedData(response, dataPath);

      if (!pageData || pageData.length === 0) {
        console.log(" Nessun dato trovato in questo blocco. Fine.");
        break;
      }
      allData.push(...pageData);
    } catch (err: any) {
      console.error(
        ` Errore durante la chiamata al blocco ${currentOffset}:`,
        err.message
      );
      break;
    }
  }

  //  4. SALVATAGGIO
  if (allData.length === 0) return console.log("\n Nessun dato scaricato.");

  const fields = parseJsonFields(allData);
  console.log(`\n Campi rilevati:`, fields.join(", "));
  const colInput = await ask(
    "\nQuali colonne vuoi (es: id, name)? INVIO per le prime 5: "
  );
  const selectedFields = colInput
    ? colInput.split(",").map((f) => f.trim())
    : fields.slice(0, 5);

  const tableHeader = `| ${selectedFields.join(" | ")} |\n| ${selectedFields
    .map(() => "---")
    .join(" | ")} |`;
  const tableRows = allData
    .map((item) => {
      const flat = flattenObject(item);
      return `| ${selectedFields
        .map((f) =>
          String(flat[f] ?? "-")
            .replace(/\n/g, " ")
            .replace(/\|/g, "\\|")
        )
        .join(" | ")} |`;
    })
    .join("\n");

  const fileName = `${currentConfigName}.md`;
  fs.writeFileSync(
    path.join(outputDir, fileName),
    `# Report: ${currentConfigName}\n${tableHeader}\n${tableRows}`
  );
  console.log(`\n Completato! File: output/api/${fileName}`);
}
