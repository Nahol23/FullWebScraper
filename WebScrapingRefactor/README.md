# FullWebScraper - WebScrapingRefactor

TypeScript backend for:
- API data extraction with pagination support
- Web scraping (HTTP/JS rendering) with configurable selectors
- Execution/analysis history persisted in SQLite

The service exposes a Fastify REST API with Swagger docs.

## Tech Stack

- Node.js + TypeScript
- Fastify (`/api/v1/*`) + Swagger UI (`/docs`)
- SQLite (`better-sqlite3`) + Kysely migrations
- Puppeteer, Cheerio, Firecrawl adapters

## Requirements

- Node.js 20+ (recommended)
- npm

## Setup

```bash
npm install
```

Create a `.env` file in project root:

```env
PORT=3000
NODE_ENV=development
FIRECRAWL_API_KEY=your_key_here
```

Notes:
- `FIRECRAWL_API_KEY` is needed only for Firecrawl-based flows.
- Database file is auto-created in `data/dev.db` (`data/prod.db` in production).

## Run

Development:

```bash
npm run dev
```

Build + start compiled app:

```bash
npm run build
npm run start
```

Swagger:
- `http://localhost:3000/docs`

Base API prefix:
- `http://localhost:3000/api/v1`

## Main API Areas

### 1) API Config + Execution

Used for configuring external APIs and running paginated extraction.

Examples:
- `GET /api/v1/configs`
- `POST /api/v1/configs`
- `POST /api/v1/executions/:name/execute`
- `POST /api/v1/executions/resume/:configId`
- `GET /api/v1/configs/:configName/download?format=json|markdown`

### 2) Scraping Config + Execution

Used for selector-based scraping configs and resumable scraping runs.

Examples:
- `GET /api/v1/scraping/configs`
- `POST /api/v1/scraping/configs`
- `POST /api/v1/scraping/configs/:id/execute`
- `POST /api/v1/scraping/executions/resume/:configId`
- `GET /api/v1/scraping/download/:configName?format=json|markdown`

## Project Structure

```text
src/
  application/      # use cases + app services
  domain/           # entities, value objects, ports, business logic
  infrastructure/   # adapters, repositories, db, mappers, utils
  presentation/     # HTTP routes/controllers + CLI
  main.ts           # Fastify bootstrap
```

## Output and Data

- Runtime outputs (reports/downloads) are written under `output/`.
- SQLite data lives in `data/`.
- Migrations are in `src/infrastructure/database/migrations`.

## Useful Scripts

- `npm run dev` - run in development
- `npm run build` - compile TypeScript to `dist/`
- `npm run start` - run compiled server
- `npm run lint` - run ESLint
- `npm run test` - run Vitest

## Notes

- `src/presentation/cli/*` contains interactive CLI utilities (legacy/manual flows).
- `FrontElXavi/figmaFront` is a separate frontend project.