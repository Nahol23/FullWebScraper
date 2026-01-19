import 'dotenv/config'; 
import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";


import { configRoutes } from "./presentation/http/routes/configRoute";
import { errorHandler } from "./presentation/http/middleware/errorHandler"; 
//TODO: se metti slash alla fine del base url, rimuovilo


export async function buildServer() {
  const server = Fastify({ 
    logger: true 
  });

 
  server.setErrorHandler(errorHandler);

  
  await server.register(cors, { origin: true });

  
  await server.register(swagger as any, {
    openapi: {
      info: {
        title: "FullWebScraper API",
        version: "1.0.0",
        description: "Documentazione API automatica",
      },
    },
  });

  await server.register(swaggerUi as any, {
    routePrefix: "/docs", 
    staticCSP: false,
  });

  await server.register(configRoutes, { prefix: '/api/v1' });

  return server;
}

async function start() {
  
  const server = await buildServer();
  const port = Number(process.env.PORT) || 3000;

  try {
    
    await server.listen({ port, host: "0.0.0.0" });
    
    console.log(`\n Server avviato su: http://localhost:${port}/api/v1/configs`);
    console.log(` Documentazione su:  http://localhost:${port}/docs\n`);
    
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}


start();