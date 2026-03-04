import puppeteer, { type Browser } from "puppeteer";
import  { ScrapingError } from "../../../domain/errors/ScrapingError";
import { IBrowserPort } from "../../../domain/ports/IBrowserPort";

export class PuppeteerBrowser implements IBrowserPort{

    private browser: Browser | null = null;

    async fetchRenderedHtml(url: string, waitForSelector?: string): Promise<string> {
        const browser = await this.getOrCreateBrowser();
        const page =await browser.newPage();

        try{
            await page.goto(url, {waitUntil: "networkidle2"});

        

            if(waitForSelector)
            {
                    await page.waitForSelector(waitForSelector, {timeout:10000})

            }
          return await page.content();
        }catch (err) {
            if(err instanceof ScrapingError) throw err;
            throw new ScrapingError(
                "BROWSER_ERROR",
                `Errore Puppeteer durante il fetch di ${url}`,
                err,
            );
        }finally {
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
        this.browser = await puppeteer.launch({ headless: true });
      } catch (err) {
        throw new ScrapingError(
          "BROWSER_ERROR",
          "Impossibile avviare Puppeteer",
          err,
        );
      }
    }
    return this.browser;
  }
    



}
