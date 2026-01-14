export class Url {
  private readonly value: string;

  constructor(value: string) {
    if(!this.validate(value)) {
      throw new Error(`Invalid URL: ${value}`);
    }
    this.value = value;
  }


  private validate(url: string): boolean {

    if (url.includes(':///')) {
      return false; 
    }
    try {
      const parsed = new URL(url);
    
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      if (!parsed.hostname) {
        return false;
      }
      if (parsed.hostname.split('.').length < 2 && parsed.hostname !== 'localhost') {
         return false;
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  toString(): string {
    return this.value;
  }

  get domain(): string {
    return new URL(this.value).hostname;
  }

  get path(): string {
    return new URL(this.value).pathname;
  }
}
