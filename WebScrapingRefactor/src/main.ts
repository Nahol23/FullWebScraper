import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import fs from "fs"; 
import path from "path"; 
import os from "os"; 

import { configRoutes } from "./presentation/http/routes/configRoute";
import { scrapingRoutes } from "./presentation/http/routes/scrapingRoutes";
import { errorHandler } from "./presentation/http/middleware/errorHandler";
import { db } from "./infrastructure/database/database"
import { runMigrations } from "./infrastructure/database/migrator";


function getLogFilePath(): string | undefined {
  const env = process.env.NODE_ENV ?? "development";

  // Se siamo nell'eseguibile o in produzione, troviamo la cartella sicura
  if (env === "production" || process.execPath.includes("data-manager-backend")) {
    let baseDir: string;
    if (process.platform === 'win32') {
      baseDir = path.join(process.env.APPDATA || os.homedir(), 'data-manager', 'logs');
    } else if (process.platform === 'darwin') {
      baseDir = path.join(os.homedir(), 'Library', 'Application Support', 'data-manager', 'logs');
    } else {
      baseDir = path.join(os.homedir(), '.data-manager', 'logs');
    }

    fs.mkdirSync(baseDir, { recursive: true });
    return path.join(baseDir, "error.log");
  }

  
  return undefined; 
}

const logFilePath = getLogFilePath();

function logErrorToFile(error: any, context: string) {
  if (!logFilePath) return; 

  const timestamp = new Date().toISOString();
  // Estraiamo lo stack trace se è un vero errore, altrimenti stringhifichiamo
  const errorMessage = error instanceof Error ? error.stack || error.message : JSON.stringify(error);
  
  const logEntry = `\n[${timestamp}] [${context}]\n${errorMessage}\n----------------------------------------`;
  
  // Scrive fisicamente l'errore nel file
  fs.appendFileSync(logFilePath, logEntry);
}



export async function buildServer() {
  const server = Fastify({
    logger: true, // Mantiene i log colorati nel terminale quando sei in DEV
    ajv: {
      customOptions: {
        removeAdditional: false,
        coerceTypes: true,
        allErrors: true,
        keywords: ["example"],
      },
    },
  });

  
  server.setErrorHandler((error, request, reply) => {
    // Scrive nel file (solo in prod)
    logErrorToFile(error, `HTTP ${request.method} ${request.url}`);
    
    
    errorHandler(error, request, reply);
  });

  await server.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  });

  if (process.env.NODE_ENV !== "production") {
    await server.register(swagger as any, {
      openapi: {
        info: { title: "FullWebScraper API", version: "1.0.0", description: "" },
      },
    });
    await server.register(swaggerUi as any, { routePrefix: "/docs" });
  }

  await server.register(configRoutes, { prefix: "/api/v1" });
  await server.register(scrapingRoutes, { prefix: "/api/v1" });

  return server;
}

async function start() {
  try {
    await runMigrations(db);
    const server = await buildServer();
    const port = Number(process.env.PORT) || 3000;

    await server.listen({ port, host: "localhost" });

    console.log(`\n Server avviato su: http://localhost:${port}/api/v1/configs`);
    if (process.env.NODE_ENV !== "production") {
      console.log(` Documentazione su:  http://localhost:${port}/docs\n`);
    }
  } catch (err) {
    
    console.error(err);
    logErrorToFile(err, "CRITICAL STARTUP CRASH"); 
    process.exit(1);
  }
}

start();