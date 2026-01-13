export class Company {
    
    constructor(
        public readonly id:string, // ID interno o di hubspot
        public readonly tenantId:string,
        public readonly name:string,
        public readonly website:string,
        public readonly industry?: string, 
        public readonly country?: string
    ) {}
}