import type { IPaginationStrategy } from "../../ports/IPaginationPort";
import { UrlParamPaginationStrategy } from "./UrlParamPaginationStrategy";
import { NextSelectorPaginationStrategy } from "./NextSelectorPaginationStrategy";
import type { ScrapingConfig } from "../../entities/ScrapingConfig";

type PaginationConfig = NonNullable<ScrapingConfig["pagination"]>;

export class PaginationStrategyFactory {
  static create(pagination: PaginationConfig | undefined): IPaginationStrategy | null {
    if (!pagination) return null;

    switch (pagination.type) {
      case "urlParam":
        if (!pagination.paramName) {
          console.warn("[PaginationStrategyFactory] urlParam richiede paramName — paginazione disabilitata.");
          return null;
        }
        return new UrlParamPaginationStrategy(pagination.paramName);

      case "nextSelector":
        if (!pagination.selector) {
          console.warn("[PaginationStrategyFactory] nextSelector richiede selector — paginazione disabilitata.");
          return null;
        }
        return new NextSelectorPaginationStrategy(pagination.selector);

      default:
        return null;
    }
  }
}