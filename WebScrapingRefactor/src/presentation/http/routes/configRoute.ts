import { AnalyzeApiUseCase } from './../../../application/usecases/Api/AnalyzeApiUseCase';
import { FastifyInstance } from 'fastify';
import { ConfigController } from '../controllers/ConfigController';
import { ManageConfigUseCase } from '../../../application/usecases/Configs/ManageConfigUseCase';
import { ConfigRepository } from '../../../infrastructure/repositories/ConfigRepository';
import { ApiAdapter } from '../../../infrastructure/adapters/Api/ApiAdapter';
import { ExecuteApiUseCase } from '../../../application/usecases/Api/ExecuteApiUseCase';
import { UpdateConfigUseCase } from '../../../application/usecases/Configs/UpdateConfigUseCase';
import { GetAllConfigsUseCase } from '../../../application/usecases/Configs/GetAllConfigsUseCase';
import { GetConfigByNameUseCase } from '../../../application/usecases/Configs/GetConfigByNameUseCase';
import { SaveConfigUseCase } from '../../../application/usecases/Configs/SaveConfigUseCase';
import { DeleteConfigUseCase } from '../../../application/usecases/Configs/DeleteConfigUseCase';

export async function configRoutes(fastify: FastifyInstance) {
  
  
  const configRepo = new ConfigRepository();
  const apiAdapter = new ApiAdapter();
  const analyzeApiUseCase = new AnalyzeApiUseCase(apiAdapter);
  const executeApiUseCase = new ExecuteApiUseCase(configRepo, apiAdapter);
  const getAllConfigsUseCase = new GetAllConfigsUseCase(configRepo);
  const getConfigByNameUseCase = new GetConfigByNameUseCase(configRepo);
  const saveConfigUseCase = new SaveConfigUseCase(configRepo);
  const deleteConfigUseCase = new DeleteConfigUseCase(configRepo);
  const updateConfigUseCase = new UpdateConfigUseCase(configRepo);

  const controller = new ConfigController(
    
    updateConfigUseCase,
    getAllConfigsUseCase,
    getConfigByNameUseCase,
    saveConfigUseCase,
    deleteConfigUseCase,
    analyzeApiUseCase,
    executeApiUseCase
  );

 
  
  const errorResponseSchema = {
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' }, 
      details: { 
        type: 'array', 
        items: { type: 'object' } 
      },
      stack: { type: 'string' } 
    }
  };

  
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
      },
      body: {
        type: 'object',
        examples: [{ key1: 'value1', key2: 'value2' }],

      }
    }
  }; 

  
  const nameParamSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  };


  fastify.get('/configs', {
    schema: {
      summary: 'Lista tutte le configurazioni',
      tags: ['Configuration'],
      response: {
        200: {
          type: 'array',
          items: configBodySchema
        },
        500: errorResponseSchema 
      }
    }
  }, controller.getAll);

 
  fastify.get('/configs/:name', {
    schema: {
      summary: 'Recupera una configurazione specifica',
      tags: ['Configuration'],
      params: nameParamSchema,
      response: {
        200: configBodySchema,
        404: errorResponseSchema, 
        500: errorResponseSchema  
      }
    }
  }, controller.getOne);

  
  fastify.post('/configs', {
    schema: {
      summary: 'Crea  una nuova  configurazione',
      tags: ['Configuration'],
      body: configBodySchema,
      response: {
        201: configBodySchema,
        400: errorResponseSchema, 
        500: errorResponseSchema  
      }
    }
  }, controller.create);

 
  fastify.delete('/configs/:name', {
    schema: {
      summary: 'Elimina una configurazione',
      tags: ['Configuration'],
      params: nameParamSchema,
      response: {
        204: { type: 'null' },
        404: errorResponseSchema, 
        500: errorResponseSchema  
      }
    }
  }, controller.delete);

  fastify.put('/configs/:name', {
    schema: {
      summary: 'Aggiorna una configurazione esistente',
      tags: ['Configuration'],
      params: nameParamSchema,
      body: { 
        ...configBodySchema,
        required: []
      },
      response: {
        200: { type: 'object', properties: { message: { type: 'string' } } },
        404: errorResponseSchema, 
        500: errorResponseSchema  
      }
    }
  }, controller.update);

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
        400: errorResponseSchema, 
        500: errorResponseSchema  
      }
    }
  }, controller.analyze);

  fastify.post('/configs/:name/execute', {
  schema: {
    summary: 'Esegue una configurazione API',
    description: 'Esegue la chiamata API configurata iniettando i parametri dinamici.',
    tags: ['Execution'],
    params: nameParamSchema,
   body: {
        type: 'object',
        description: `
        **Parametri Dinamici**:
        I campi inseriti qui verranno usati per sostituire i placeholder o aggiunti come query params.
        Usa la chiave speciale 'headers' per sovrascrivere gli header HTTP.
        `,
        // Definiamo esplicitamente 'headers' per renderlo visibile in Swagger
        properties: {
          headers: {
            type: 'object',
            description: 'Headers HTTP opzionali da aggiungere/sovrascrivere',
            additionalProperties: { type: 'string' },
            example: { "Authorization": "Bearer <token>" }
          }
        },
        // Fondamentale: permette qualsiasi altro campo (es. userId, city, page)
        additionalProperties: true,
        // Esempi chiari per l'utente
        examples: [
          { 
            _name: "Simple Query",
            city: "Milano", 
            days: 3 
          },
          { 
            _name: "With Auth Header",
            headers: { "Authorization": "Bearer 123" },
            productId: 99
          }
        ]
      },
    response: {
       // ... la tua risposta esistente
       200: { /* ... */ },
       404: errorResponseSchema,
       500: errorResponseSchema
    }
  }
}, controller.execute);

  
 
}