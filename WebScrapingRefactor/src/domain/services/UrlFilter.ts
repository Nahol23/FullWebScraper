import { Url } from "../value-objects/Url";

export class UrlFilter {
  constructor(
    private readonly allowedDomains: string[],
    private readonly excludedExtensions: string[] = ["jpg", "png", "gif", "css", "js"]
  ) {}

  isAllowed(url: Url): boolean {
    const domainAllowed = this.allowedDomains.includes(url.domain);
    const extension = url.path.split(".").pop();
    const extensionAllowed = extension ? !this.excludedExtensions.includes(extension) : true;
    return domainAllowed && extensionAllowed;
  }
}
