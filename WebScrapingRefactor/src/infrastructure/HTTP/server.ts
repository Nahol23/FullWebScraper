import Fastify from 'fastify';
import cors from '@fastify/cors';
import { configRoutes } from './routes/configRoute';

const server = Fastify({ 
  logger: true // Utile per il debug delle chiamate in ingresso
});

async function bootstrap() {
  // Abilitiamo il CORS perché React girerà su una porta diversa 
  await server.register(cors, {
    origin: '*' 
  });

  // Registriamo le rotte con un prefisso per ordine
  await server.register(configRoutes, { prefix: '/api/v1' });

  try {
    const port = 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Engine pronto su http://localhost:${port}/api/v1/configs`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

bootstrap();