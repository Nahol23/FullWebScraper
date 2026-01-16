import { FastifyRequest, FastifyReply } from "fastify";
import axios from "axios"; 
import { ApiConfig } from "../../../config/ApiConfigLoader";
import { ConfigRepository } from "../../repositories/Configrepository";
import { ApiService } from "../../services/ApiService";

export class ConfigController {
  private repo = new ConfigRepository();

  getAll = async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const configs = await this.repo.findAll();
      return reply.send(configs);
    } catch (error) {
      return reply.status(500).send({ error: "Errore nel caricamento" });
    }
  };

  getOne = async (req: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
    const { name } = req.params;
    const config = await this.repo.findByName(name);
    if (!config) return reply.status(404).send({ error: "Non trovato" });
    return reply.send(config);
  };

  upsert = async (req: FastifyRequest<{ Body: ApiConfig }>, reply: FastifyReply) => {
    try {
      const config = req.body;
      if (!config.name) return reply.status(400).send({ error: "Nome obbligatorio" });
      await this.repo.save(config);
      return reply.status(201).send(config);
    } catch (error) {
      return reply.status(500).send({ error: "Errore salvataggio" });
    }
  };

  delete = async (req: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
    try {
      const { name } = req.params;
      const existing = await this.repo.findByName(name);
      if (!existing) return reply.status(404).send({ error: "Non trovato" });
      await this.repo.delete(name);
      return reply.status(204).send();
    } catch (error) {
      return reply.status(500).send({ error: "Errore eliminazione" });
    }
  };

  analyze = async (request: FastifyRequest<{ Body: { url: string, method: string, body?: any } }>, reply: FastifyReply) => {
    try {
      const { url, method, body } = request.body;
      // Ora axios (minuscolo) funzionerà grazie all'import corretto
      const response = await axios({ method, url, data: body });
      
      return reply.send({
        sampleData: response.data,
        suggestedFields: typeof response.data === 'object' ? Object.keys(Array.isArray(response.data) ? response.data[0] : response.data) : []
      });
    } catch (error: any) {
      return reply.status(400).send({ error: "Errore analisi URL", details: error.message });
    }
  };

  execute = async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
    try {
        const { name } = request.params;
        const config = await this.repo.findByName(name);
        if (!config) return reply.status(404).send({ error: "Config non trovata" });

        const apiService = new ApiService();
        const result = await apiService.execute(config);

        return reply.send(result); // CORRETTO: invio esplicito della risposta
    } catch (error: any) {
        return reply.status(500).send({ error: "Errore esecuzione", details: error.message });
    }
  };
}