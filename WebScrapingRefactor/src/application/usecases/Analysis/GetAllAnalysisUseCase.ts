import { Analysis } from "../../../domain/entities/Analysis";
import { IAnalysisRepository } from "../../../domain/ports/Analyze/IAnalysisRepository";

export class GetAllAnalysesUseCase {
  constructor(private analysisRepo: IAnalysisRepository) {}

  async execute(): Promise<Analysis[]> {
    
    const analyses = await this.analysisRepo.findAll();
    
    
    return analyses.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}