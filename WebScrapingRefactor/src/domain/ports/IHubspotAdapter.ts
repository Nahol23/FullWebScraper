import { Company } from "../entities/Company";

export interface IHubspotAdapter{
    fetchCompanies(): Promise<Company[]>;
}