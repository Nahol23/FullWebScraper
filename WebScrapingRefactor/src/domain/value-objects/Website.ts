export class Website{
    private readonly value:string;
    constructor(value:string){
        if(!this.isValidUrl(value)){
            throw new Error ('Invalid website URL: ${value}');
        }
        this.value = value;
    }
     private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  public getValue(): string {
    return this.value;
  }
}