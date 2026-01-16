import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { configRoutes } from "./presentation/http/routes/configRoute";

async function buildServer() {
  const server = Fastify({ logger: true });

  await server.register(cors, { origin: true });

  await server.register(swagger as any, {
    openapi: {
      info: {
        title: "FullWebScraper API",
        version: "1.0.0",
        description: "API documentation for FullWebScraper",
      },
    },
    exposeRoute: true,
  });

  await server.register(swaggerUi as any, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    staticCSP: false,
    // point to the generated OpenAPI JSON
    swagger: {
      url: "/documentation/json",
    },
  });

  // Register application routes so schemas are included in the OpenAPI output
  await configRoutes(server);

  return server;
}

async function start() {
  const server = await buildServer();
  const port = Number(process.env.PORT) || 3000;

  try {
    await server.listen({ port, host: "0.0.0.0" });
    server.log.info(`Server running at http://localhost:${port}`);
    server.log.info(`Swagger UI available at http://localhost:${port}/docs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
