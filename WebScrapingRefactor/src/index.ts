// import fs from "fs";
// import dotenv from "dotenv";
// dotenv.config();
// import readline from "readline";
// import { ApiAdapter } from "./infrastructure/adapters/Api/ApiAdapter";
// import { ApiUseCase } from "./application/usecases/Api/ApiUseCase";
// import { toMarkdownTable } from "./infrastructure/utils/Markdown";
// import { FirecrawlCrawlerAdapter } from "./infrastructure/adapters/crawler/FirecrawlCrawlerAdapter";
// import { FirecrawlSiteMapAdapter } from "./infrastructure/adapters/crawler/FirecrawlSiteMapAdapter";
// import { LanguageDetectorAdapter } from "./infrastructure/adapters/LanguageDetector/LanguageDetectorAdpater";
// import { GenerateSiteMapUseCase } from "./application/usecases/GenerateSiteMapAndContentUseCase";
// import { ScrapeSelectedPagesUseCase } from "./application/usecases/crawling/ScrapeSelectedPageUseCase";

// function ask(question: string): Promise<string> {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });
//   return new Promise((resolve) => {
//     rl.question(question, (answer) => {
//       rl.close();
//       resolve(answer);
//     });
//   });
// }

// export async function runCli() {
//   const args = process.argv.slice(2);
//   const modeArg = args.find((a) => a.startsWith("--mode="));
//   const mode = modeArg ? modeArg.split("=")[1] : "firecrawl";

//   if (mode === "api") {
//     //  API Cli
//     const url = await ask("Inserisci l'endpoint API: ");
//     const method = (
//       await ask("Vuoi fare una GET o una POST? ")
//     ).toUpperCase() as "GET" | "POST";

//     let body: any = null;
//     if (method === "POST") {
//       const bodyInput = await ask("Inserisci il body JSON : ");
//       if (bodyInput) {
//         try {
//           body = JSON.parse(bodyInput);
//         } catch {
//           console.error("Body non valido, verrà ignorato.");
//         }
//       }
//     }

//     const api = new ApiAdapter();
//     const useCase = new ApiUseCase(api);

//     try {
//       const data = await useCase.execute(url, method, undefined, body);

//       if (data.length === 0) {
//         console.log("Nessun risultato trovato.");
//         return;
//       }

//       const keys = Object.keys(data[0] || {});
//       console.log("Campi disponibili:", keys.join(", "));

//       const field = await ask(
//         "Campo da filtrare (lascia vuoto per nessun filtro): "
//       );
//       let result = data;

//       if (field) {
//         const value = await ask(`Valore da cercare in '${field}': `);
//         result = await useCase.execute(url, method, { field, value }, body);
//       }

//       const chosen = await ask(
//         "Quali campi vuoi includere nella tabella? (separa con virgola, lascia vuoto per tutti): "
//       );
//       const fields = chosen
//         ? chosen.split(",").map((f) => f.trim())
//         : Object.keys(result[0] || {});

//       const markdown = toMarkdownTable(result, fields);

//       fs.mkdirSync("./output", { recursive: true });
//       const filename = `./output/api-result.md`;
//       fs.writeFileSync(filename, markdown, "utf-8");

//       console.log(`Tabella salvata in ${filename}`);
//     } catch (err) {
//       console.error("Errore:", err);
//     }
//   } else if (mode === "firecrawl") {
//     //  Firecrawl Cli
//     const apiKey = process.env.FIRECRAWL_API_KEY!;
//     const crawler = new FirecrawlCrawlerAdapter(apiKey);
//     const siteMapper = new FirecrawlSiteMapAdapter(apiKey);
//     const detector = new LanguageDetectorAdapter();

//     const siteUrl = await ask("Inserisci l'URL del sito da crawlare: ");
//     const siteMapUseCase = new GenerateSiteMapUseCase(siteMapper);
//     const siteMap = await siteMapUseCase.execute(siteUrl, 20);

//     console.log("Site Map trovata:");
//     siteMap.forEach((url: any, i: number) => console.log(`${i + 1}. ${url}`));

//     const rl = readline.createInterface({
//       input: process.stdin,
//       output: process.stdout,
//     });
//     rl.question(
//       "Inserisci il numero dell'URL da scrappare: ",
//       async (answer) => {
//         const index = parseInt(answer, 10) - 1;
//         const selectedUrl = siteMap[index];

//         if (!selectedUrl) {
//           console.log("Numero non valido.");
//           rl.close();
//           return;
//         }

//         const scrapeUseCase = new ScrapeSelectedPagesUseCase(crawler, detector);
//         const pages = await scrapeUseCase.execute([selectedUrl], "it");

//         if (pages.length === 0) {
//           console.log("Nessuna pagina trovata nella lingua richiesta.");
//         } else {
//           fs.mkdirSync("./output", { recursive: true });
//           const filename = `./output/firecrawl-${index + 1}.md`;
//           fs.writeFileSync(filename, pages[0].markdown, "utf-8");
//           console.log(`Scraping salvato in ${filename}`);
//         }

//         rl.close();
//       }
//     );
//   }
// }
