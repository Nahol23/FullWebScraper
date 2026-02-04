import { Analysis } from "../../entities/Analysis";

export interface IAnalysisRepository{
    findAll() : Promise<Analysis[]>;
    findById(Id :string) : Promise<Analysis | null>;
    save(analysis : Analysis) : Promise<void>;
    delete(id: string): Promise<void>;

}