export class Contact{
    constructor(
        public readonly id:string, // ID interno o di apollo
        public readonly tenantId:string,
        public readonly firstName:string,
        public readonly lastName:string,
        public readonly email:string,
        public readonly role?: string,
        public readonly companyId?: string
    ) {
        
        
    }
}