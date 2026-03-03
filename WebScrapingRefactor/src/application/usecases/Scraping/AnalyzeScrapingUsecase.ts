import { ScrapingAdapter } from "../../../infrastructure/adapters/Scraping/ScrapingAdapter";
import type { ExtractionRule } from "../../../domain/entities/ScrapingConfig";
import * as cheerio from 'cheerio';
import { randomUUID } from "crypto";
import { IScrapingAnalysisRepository } from "../../../domain/ports/ScrapingConfig/IScrapingAnalysisRepository";



export interface ScrapingAnalysisResult {
  url: string;
  title: string;
  suggestedRules: ExtractionRule[];
  sampleData: Record<string, any>;
  detectedListSelectors: string[];
  rawPreview?: string;
}

export interface AnalyzeOptions {
  useJavaScript?: boolean;
  waitForSelector?: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
}

export class AnalyzeScrapingUseCase {
  constructor(
    private readonly scrapingAdapter: ScrapingAdapter,
    private readonly analysisRepository: IScrapingAnalysisRepository
  ) {}

  async execute(url: string, options?: AnalyzeOptions): Promise<ScrapingAnalysisResult> {
    const startTime = Date.now();
    try {
      const html = await this.scrapingAdapter.fetchHtml({
        url,
        method: options?.method,
        headers: options?.headers,
        body: options?.body,
        useJavaScript: options?.useJavaScript,
        waitForSelector: options?.waitForSelector,
      });

      const analysis = this.analyzeDom(html);
      const sampleRules = analysis.suggestedRules.slice(0, 5);
      const sampleData = this.scrapingAdapter.extractWithRules(html, sampleRules);
      const rawPreview = html.substring(0, 500);

      const result = {
        url,
        title: analysis.title,
        suggestedRules: analysis.suggestedRules,
        sampleData,
        detectedListSelectors: analysis.listSelectors,
        rawPreview,
      };

      const analysisEntity = {
        id: randomUUID(),
        url,
        timestamp: new Date(),
        options,
        result,
        status: 'completed' as const,
      };
      await this.analysisRepository.save(analysisEntity);

      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      const analysisEntity = {
        id: randomUUID(),
        url,
        timestamp: new Date(),
        options,
        result: { error: errorMessage },
        status: 'failed' as const,
        errorMessage,
      };
      await this.analysisRepository.save(analysisEntity);
      throw error;
    }
  }

  private analyzeDom(html: string) {
    const $ = cheerio.load(html);
    const title = $('title').text().trim();

    const suggestedRules: ExtractionRule[] = [];
    const listSelectors: string[] = [];

    const possibleListContainers = ['ul', 'ol', 'div[class*="list"]', 'div[class*="items"]', 'tbody'];
    possibleListContainers.forEach(selector => {
      $(selector).each((_: any, el: any) => {
        const children = $(el).children();
        if (children.length > 1) {
          const firstChild = children.first();
          const childTag = firstChild.prop('tagName')?.toLowerCase();
          if (childTag && children.length > 2) {
            listSelectors.push(selector);
            suggestedRules.push({
              fieldName: 'item_text',
              selector: `${selector} > ${childTag}`,
              attribute: 'text',
              multiple: true,
            });
            if (firstChild.find('a').length) {
              suggestedRules.push({
                fieldName: 'item_link',
                selector: `${selector} > ${childTag} a`,
                attribute: 'href',
                multiple: true,
              });
            }
            if (firstChild.find('img').length) {
              suggestedRules.push({
                fieldName: 'item_image',
                selector: `${selector} > ${childTag} img`,
                attribute: 'src',
                multiple: true,
              });
            }
          }
        }
      });
    });

    if (suggestedRules.length === 0) {
      $('[class]').each((_: any, el: any) => {
        const classAttr = $(el).attr('class');
        if (classAttr && classAttr.split(/\s+/).length === 1) {
          suggestedRules.push({
            fieldName: classAttr,
            selector: `.${classAttr}`,
            attribute: 'text',
            multiple: false,
          });
        }
      });
    }

    return { title, suggestedRules: suggestedRules.slice(0, 10), listSelectors };
  }
}