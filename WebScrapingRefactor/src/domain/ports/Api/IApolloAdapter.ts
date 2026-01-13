import { Contact } from "../../entities/Contact";

export interface IApolloAdapter{
    fetchContactsByCompanyDomain(domain:string): Promise<Contact[]>;
}