import puppeteer, { type Browser } from "puppeteer";
import { ScrapingError } from "../../../domain/errors/ScrapingError";
import { IBrowserPort } from "../../../domain/ports/IBrowserPort";
import fs from "fs";
import os from "os";


// Trova Chrome o Edge installati sul PC dell'utente

function getLocalBrowserPath(): string | undefined {
  // In fase di sviluppo, restituisce undefined così Puppeteer usa il suo Chromium integrato
  const isProd = process.env.NODE_ENV === "production" || process.execPath.includes("data-manager-backend");
  if (!isProd) return undefined;

  const pathsToCheck: string[] = [];

  if (process.platform === "win32") {
    pathsToCheck.push(
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", 
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
    );
  } else if (process.platform === "darwin") {
    pathsToCheck.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
    );
  } else {
    // Linux
    pathsToCheck.push(
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/microsoft-edge-stable"
    );
  }

  // Controlla quale di questi percorsi esiste fisicamente sul PC
  for (const p of pathsToCheck) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error("Nessun browser compatibile (Chrome o Edge) trovato sul PC dell'utente.");
}


export class PuppeteerBrowser implements IBrowserPort {
  private browser: Browser | null = null;

  async fetchRenderedHtml(url: string, waitForSelector?: string): Promise<string> {
    const browser = await this.getOrCreateBrowser();
    // Otteniamo la pagina MA aggiungiamo un try/finally direttamente qui
    // per assicurarci che la pagina venga chiusa anche se goto fallisce
    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: "networkidle2" });

      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 });
      }
      return await page.content();
    } catch (err) {
      if (err instanceof ScrapingError) throw err;
      throw new ScrapingError(
        "BROWSER_ERROR",
        `Errore Puppeteer durante il fetch di ${url}`,
        err
      );
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }

  private async getOrCreateBrowser(): Promise<Browser> {
    if (!this.browser) {
      try {
        const executablePath = getLocalBrowserPath();

        this.browser = await puppeteer.launch({
          headless: true,
          executablePath: executablePath, 
          args: [
            "--no-sandbox", // Necessario se si avvia dentro un eseguibile pacchettizzato
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage" // Aiuta a prevenire crash di memoria su PC più vecchi
          ]
        });
      } catch (err) {
        throw new ScrapingError(
          "BROWSER_ERROR",
          "Impossibile avviare Puppeteer. Assicurati che Chrome o Edge siano installati.",
          err
        );
      }
    }
    return this.browser;
  }
}