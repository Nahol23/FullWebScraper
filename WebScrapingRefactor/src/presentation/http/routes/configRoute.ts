import { AnalyzeApiUseCase } from './../../../application/usecases/Api/AnalyzeApiUseCase';
import { FastifyInstance } from 'fastify';
import { ConfigController } from '../controllers/ConfigController';
import { ManageConfigUseCase } from '../../../application/usecases/ManageConfigUseCase';
import { ConfigRepository } from '../../../infrastructure/HTTP/repositories/ConfigRepository';
import { ApiAdapter } from '../../../infrastructure/adapters/Api/ApiAdapter';
import { ExecuteApiUseCase } from '../../../application/usecases/Api/ExecuteApiUseCase';



export async function configRoutes(fastify: FastifyInstance) {
  // Dependency injection
  const configRepo = new ConfigRepository();
  const apiAdapter = new ApiAdapter();
  const manageConfigUseCase = new ManageConfigUseCase(configRepo);
  const analyzeApiUseCase = new AnalyzeApiUseCase(apiAdapter);
  const executeApiUseCase = new ExecuteApiUseCase(configRepo, apiAdapter);

  const controller = new ConfigController(
    manageConfigUseCase,
    analyzeApiUseCase,
    executeApiUseCase
  );

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
      tags: ['Configuration'],
      response: {
        200: {
          type: 'array',
          items: configBodySchema
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, controller.getAll);

  // GET ONE
  fastify.get('/configs/:name', {
    schema: {
      summary: 'Recupera una configurazione specifica',
      tags: ['Configuration'],
      params: nameParamSchema,
      response: {
        200: configBodySchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, controller.getOne);

  // POST (Upsert)
  fastify.post('/configs', {
    schema: {
      summary: 'Crea o aggiorna una configurazione',
      tags: ['Configuration'],
      body: configBodySchema,
      response: {
        201: configBodySchema,
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, controller.upsert);

  // DELETE
  fastify.delete('/configs/:name', {
    schema: {
      summary: 'Elimina una configurazione',
      tags: ['Configuration'],
      params: nameParamSchema,
      response: {
        204: {
          type: 'null'
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, controller.delete);

  // ANALYZE
  fastify.post('/configs/analyze', {
    schema: {
      summary: 'Analizza un URL API per suggerire campi',
      tags: ['Execution'],
      body: {
        type: 'object',
        required: ['url', 'method'],
        properties: {
          url: { type: 'string', examples: ['https://api.example.com/data'] },
          method: { type: 'string', enum: ['GET', 'POST'], examples: ['GET'] },
          body: { type: 'object' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            sampleData: { type: 'object' },
            suggestedFields: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    }
  }, controller.analyze);

  // EXECUTE
  fastify.post('/configs/:name/execute', {
    schema: {
      summary: 'Esegue una configurazione API',
      tags: ['Execution'],
      params: nameParamSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            filteredBy: { type: 'object' },
            meta: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    }
  }, controller.execute);
}