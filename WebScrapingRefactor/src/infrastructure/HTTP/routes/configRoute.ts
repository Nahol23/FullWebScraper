import { FastifyInstance } from 'fastify';
import { ConfigController } from '../controllers/ConfigController';

export async function configRoutes(fastify: FastifyInstance) {
  const controller = new ConfigController();

  // Schema for POST body
  const configBodySchema = {
    type: 'object',
    required: ['name', 'baseUrl', 'endpoint', 'method'],
    properties: {
      name: { type: 'string', examples: ['PokeApi'] },
      baseUrl: { type: 'string', examples: ['https://pokeapi.co/api/v2'] },
      endpoint: { type: 'string', examples: ['/pokemon'] },
      method: { type: 'string', enum: ['GET', 'POST'], examples: ['GET'] },
      defaultLimit: { type: 'number', examples: [20] },
      dataPath: { type: 'string', examples: ['results'] },
      selectedFields: {
        type: 'array',
        items: { type: 'string' },
        examples: [['name', 'url']]
      }
    }
  };

  // Schema for URL params
  const nameParamSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  };

  // GET ALL
  fastify.get('/configs', {
    schema: {
      summary: 'Lista tutte le configurazioni', 
      tags: ['Engine']
    }as any
  }, controller.getAll);

  // GET ONE
  fastify.get('/configs/:name', {
    schema: {
      summary: 'Recupera una configurazione specifica',
      tags: ['Engine'],
      params: nameParamSchema
    }
  }, controller.getOne);

  // POST (Upsert)
  fastify.post('/configs', {
    schema: {
      summary: 'Crea o aggiorna una configurazione',
      tags: ['Engine'],
      body: configBodySchema
    }
  }, controller.upsert);

  // DELETE
  fastify.delete('/configs/:name', {
    schema: {
      summary: 'Elimina una configurazione',
      tags: ['Engine'],
      params: nameParamSchema
    }
  }, controller.delete);
}
