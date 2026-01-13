export class Email{
    private readonly value: string;
    constructor(value: string) {
        if(!this.isValidEmail(value)){
            throw new Error('Invalid email: ${value}');
        }
        this.value = value;
    }
     private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  public getValue(): string {
    return this.value;
  }
}