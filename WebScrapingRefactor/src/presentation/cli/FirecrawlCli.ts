import readline from "readline";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { FirecrawlCrawlerAdapter } from "../../infrastructure/adapters/crawler/FirecrawlCrawlerAdapter";
import { FirecrawlSiteMapAdapter } from "../../infrastructure/adapters/crawler/FirecrawlSiteMapAdapter";
import { MarkdownCleanerAdapter } from "../../infrastructure/adapters/Cleaner/MarkdownCleanerAdapter"; 
import { StartCrawlUseCase } from "../../application/usecases/crawling/StartCrawlUseCase";
import { GenerateSiteMapUseCase } from "../../application/usecases/crawling/GenerateSiteMapUseCase";
import { GetCrawlStatusUseCase } from "../../application/usecases/crawling/GetCrawlStatusUseCase";
import { ScrapeSelectedPagesUseCase } from "../../application/usecases/crawling/ScrapeSelectedPageUseCase";
import { CleanMarkdownUseCase } from "../../application/usecases/CleanMarkdownUseCase";
import { LanguageDetectorAdapter } from "../../infrastructure/adapters/LanguageDetector/LanguageDetectorAdpater";

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => {
    rl.close();
    resolve(ans);
  }));
}

export async function firecrawlCli() {
  const apiKey = process.env.FIRECRAWL_API_KEY!;
  
  // 1. Inizializzazione Adapter e UseCase
  const crawler = new FirecrawlCrawlerAdapter(apiKey);
  const siteMapper = new FirecrawlSiteMapAdapter(apiKey);
  const detector = new LanguageDetectorAdapter();
  
  // Utilizzo del MarkdownCleanerAdapter reale per la pulizia high-fidelity
  const cleanerAdapter = new MarkdownCleanerAdapter();
  const cleanerUseCase = new CleanMarkdownUseCase(cleanerAdapter);

  const generateSiteMap = new GenerateSiteMapUseCase(siteMapper);
  const scraper = new ScrapeSelectedPagesUseCase(crawler, detector, cleanerUseCase);

  
  console.log("       FIRECRAWL WEB SCRAPER        ");
  

  // 2. Root URL e Sitemap
  const rootUrl = await ask("Inserisci la root URL da crawlare: ");
  console.log("Generazione sitemap in corso...");
  const siteMap = await generateSiteMap.execute(rootUrl, 10);

  if (!siteMap.urls || siteMap.urls.length === 0) {
    console.log("Nessun link trovato.");
    return;
  }

  console.log("\nLink trovati:");
  siteMap.urls.forEach((u: any, i: any) => console.log(`${i + 1}. ${u}`));

  // 3. Scelta link
  const choiceStr = await ask("\nQuale link vuoi scrapare (numero)? ");
  const choice = parseInt(choiceStr) - 1;
  const selectedUrl = siteMap.urls[choice];

  if (!selectedUrl) {
    console.log("Selezione non valida.");
    return;
  }

  // 4. Filtro lingua
  const filterChoice = await ask("Vuoi filtrare per lingua inglese (si/no)? ");
  const filterByLanguage = filterChoice.toLowerCase() === "si";

  // 5. Scrape e Cleaning
  console.log(`\n Scraping e pulizia in corso per: ${selectedUrl}...`);
  const scraped = await scraper.execute([selectedUrl], "en", filterByLanguage);

  if (!scraped || scraped.length === 0) {
    console.log("Nessun contenuto trovato o filtrato dalla lingua.");
    return;
  }

  // 6. Salvataggio file professionale
  const outputDir = path.join(process.cwd(), "output", "firecrawl");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const pageData = scraped[0];
  const timestamp = Date.now();
  // Creiamo un nome file leggibile basato sulla URL o sul timestamp
  const fileName = `scraped_${timestamp}.md`;
  const filePath = path.join(outputDir, fileName);
  
  // Il contenuto markdown è già stato pulito dal cleanerUseCase
  fs.writeFileSync(filePath, pageData.markdown, "utf-8");

  console.log(`\n Contenuto salvato con successo in: ${filePath}`);
  console.log("Anteprima contenuto (primi 200 caratteri):");
  console.log(pageData.markdown.substring(0, 200) + "...");
}