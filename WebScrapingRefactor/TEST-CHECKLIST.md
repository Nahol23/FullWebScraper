# Unit Test Checklist – WebScrapingRefactor

## Leggenda
- ✅ = Test completato
- ⏳ = In progresso
- ⭕ = Da implementare

---

## PRIORITÀ ALTA – Funzioni Pure & Utility

### 1. `FindFirstArray.parseJsonFields()`
**File:** `src/infrastructure/utils/FindFirstArray.ts`  
**Perché:** Funzione pura critica, usata per estrarre schema dai dati API.

- ⭕ Test case: oggetto semplice con proprietà annidati → ritorna percorsi dot-notated  
- ⭕ Test case: array di oggetti → estrae path del primo elemento  
- ⭕ Test case: array di primitivi → non crasha, ritorna array vuoto o percorso  
- ⭕ Test case: oggetto vuoto → ritorna `[]`  
- ⭕ Test case: `null` / `undefined` → gestisce senza crasha  
- ⭕ Test case: duplicati nei path → rimozione (unicità Set)  
- ⭕ Test case: oggetto profondamente annidato (3+ livelli) → ritorna tutti i percorsi  

---

### 2. `ObjectUtils.getNestedData()`
**File:** `src/infrastructure/utils/ObjectUtils.ts`  
**Perché:** Usa `reduce` con accesso property-by-property; edge case su path non trovati.

- ⭕ Test case: path valido, profondità 1 → ritorna array  
- ⭕ Test case: path valido, profondità 3+ (`a.b.c.d`) → ritorna array  
- ⭕ Test case: path non esiste → ritorna `[]`  
- ⭕ Test case: target esiste ma non è array → ritorna `[]`  
- ⭕ Test case: nessun path (undefined) → controlla se obj è array  
- ⭕ Test case: obj è null/undefined → ritorna `[]`  

---

### 3. `ObjectUtils.findFirstArrayPath()`
**File:** `src/infrastructure/utils/ObjectUtils.ts`  
**Perché:** Ricerca ricorsiva di primo array; importante verificare ordine e terminazione.

- ⭕ Test case: array al primo livello → ritorna percorso vuoto `""`  
- ⭕ Test case: array annidato in `data.items` → ritorna `"data.items"`  
- ⭕ Test case: nessun array → ritorna `null`  
- ⭕ Test case: oggetto con proprietà non-array prima dell'array → trova comunque l'array  
- ⭕ Test case: array vuoto → ritorna `null` (logica: "empty array non valido")  
- ⭕ Test case: array di primitivi (non oggetti) → ritorna `null`  

---

### 4. `ObjectUtils.flattenObject()`
**File:** `src/infrastructure/utils/ObjectUtils.ts`  
**Perché:** Trasformazione critica per generare intestazioni tabella markdown.

- ⭕ Test case: oggetto semplice `{name: "Bob", age: 30}` → stesso output  
- ⭕ Test case: oggetto annidato `{user: {name: "Bob"}}` → `{"user.name": "Bob"}`  
- ⭕ Test case: oggetto con array `{items: [1,2,3]}` → `{"items": [1,2,3]}` (array non appiattito)  
- ⭕ Test case: null/undefined come valore → preserved  
- ⭕ Test case: profondità 3+ annidamento → tutti i path dot-notated  
- ⭕ Test case: chiave vuota o con caratteri speciali (`"foo.bar"` come chiave) → handled  

---

### 5. `ObjectUtils.filterData()`
**File:** `src/infrastructure/utils/ObjectUtils.ts`  
**Perché:** Logica di ricerca multi-criterio usata in CLI.

- ⭕ Test case: filterInput vuoto → ritorna tutti i dati  
- ⭕ Test case: ricerca singolo termine → filtra su tutti i campi (case-insensitive)  
- ⭕ Test case: ricerca multipla con virgola `"bob, 30"` → AND (ogni elemento deve matchare almeno un campo)  
- ⭕ Test case: termine non trovato → ritorna array vuoto  
- ⭕ Test case: whitespace nei termini → trimmed  
- ⭕ Test case: null/undefined nei valori dei campi → skip (non crasha)  

---

## PRIORITÀ ALTA – Value Objects & Validatori

### 6. `Email` (Value Object)
**File:** `src/domain/value-objects/Email.ts`  
**Perché:** Validazione di input; deve rifiutare email malformate.

- ⭕ Test case: email valida `"user@example.com"` → istanza creata  
- ⭕ Test case: email senza `@` → lancia Error  
- ⭕ Test case: email senza TLD `"user@example"` → lancia Error  
- ⭕ Test case: spazi nella email → lancia Error  
- ⭕ Test case: `getValue()` → ritorna valore originale  
- ⭕ Test case: email con sottodomini `"user@mail.example.co.uk"` → valida  

---

### 7. `Url` (Value Object)
**File:** `src/domain/value-objects/Url.ts`  
**Perché:** Parsing e validazione URL; usata in filtri e scraper.

- ⭕ Test case: URL valido `"https://example.com/path"` → istanza creata  
- ⭕ Test case: URL malformata `"not a url"` → lancia Error  
- ⭕ Test case: `toString()` → ritorna URL originale  
- ⭕ Test case: `domain` getter → estrae hostname corretto  
- ⭕ Test case: `path` getter → estrae pathname corretto  
- ⭕ Test case: URL con query string `"https://example.com/path?id=1"` → path ritorna `/path`  
- ⭕ Test case: URL relativa `"/path/to/page"` → lancia Error (URL.constructor richiede URL assoluta)  

---

### 8. `TenantId`, `FilePath`, `Website`, `Role` (Value Objects)
**File:** `src/domain/value-objects/`  
**Perché:** Validatori specifici di dominio.

- ⭕ `TenantId`: formato UUID o string pattern → validazione; uguaglianza tra istanze  
- ⭕ `FilePath`: percorso valido, caratteri consentiti, conversione relativa/assoluta  
- ⭕ `Website`: URL valido; getter per dominio  
- ⭕ `Role`: enum-like (se bounded), reject valori non consentiti  

---

## PRIORITÀ ALTA – Service Layer

### 9. `UrlFilter` Service
**File:** `src/domain/services/UrlFilter.ts`  
**Perché:** Logica di whitelist/blacklist; critica per scraper.

- ⭕ Test case: URL con dominio consentito, estensione consentita → `true`  
- ⭕ Test case: URL con dominio NON consentito → `false`  
- ⭕ Test case: URL con estensione esclusa (`.jpg`, `.css`) → `false`  
- ⭕ Test case: URL senza estensione → `true` (se dominio ok)  
- ⭕ Test case: costruttore con allowedDomains personalizzati → filtra correttamente  
- ⭕ Test case: costruttore con excludedExtensions personalizzati → applica nuove esclusioni  
- ⭕ Test case: URL con path complesso `https://example.com/a/b/c.pdf` → estensione `.pdf` estratta e controllata  

---

## PRIORITÀ MEDIA – Use Cases & Orchestratori

### 10. `ApiUseCase`
**File:** `src/application/usecases/Api/ApiUseCase.ts`  
**Perché:** Trasformazione response API; logica di estrazione e filtraggio.

- ⭕ Test case: `executeRaw()` → delega a `IApiPort.request` e ritorna response grezza  
- ⭕ Test case: `execute()` con dataPath esplicito → estrae array correttamente  
- ⭕ Test case: `execute()` senza dataPath → trova primo array in response  
- ⭕ Test case: `execute()` response non contiene array → ritorna `data: []`  
- ⭕ Test case: `execute()` con filters → applica filtro su campo (incluso annidato)  
- ⭕ Test case: `execute()` filters con campo non esiste → nessun match (empty array)  
- ⭕ Test case: `execute()` filters con coercizione type (`==`) → match numeri vs string  
- ⭕ Mock: `IApiPort.request` per restituire JSON controllati  

---

### 11. `ApiWorkflow`
**File:** `src/application/orchestrators/ApiWorkFlow.ts`  
**Perché:** Batch processing e concorrenza.

- ⭕ Test case: `execute()` delega a `ApiUseCase.execute` con parametri  
- ⭕ Test case: `executeBatch()` con 3 richieste, concurrencyLimit=1 → eseguite sequenzialmente  
- ⭕ Test case: `executeBatch()` con 6 richieste, concurrencyLimit=2 → 3 chunks di 2  
- ⭕ Test case: `executeBatch()` output order = input order (verificare map/push)  
- ⭕ Test case: `executeBatch()` se una promise fallisce → propagazione errore (o catch?)  
- ⭕ Mock: `ApiUseCase.execute` con Promise controllate  

---

### 12. `CleanMarkdownUseCase`
**File:** `src/application/usecases/CleanMarkdownUseCase.ts`  
**Perché:** Trasformazione testo; verificare che regole di pulizia siano applicate.

- ⭕ Test case: testo pulito → ritorna uguale  
- ⭕ Test case: testo con whitespace eccessivo → normalizzato  
- ⭕ Test case: testo con markdown/HTML → rimosso/normalizzato  
- ⭕ Test case: input null/empty → handled  
- ⭕ Mock: `ICleaner` adapter se dipende da esso  

---

### 13. `ExtractTextUseCase`
**File:** `src/application/usecases/ExtractTextUseCase.ts`  
**Perché:** Parsing e estrazione testo strutturato.

- ⭕ Test case: documento valido → estrae testo principale  
- ⭕ Test case: documento senza testo → ritorna empty o fallback  
- ⭕ Test case: documento con annotazioni → le ignora o le processa  
- ⭕ Mock: `IParser` e altre dipendenze  

---

### 14. `IngestDocumentUseCase`
**File:** `src/application/usecases/IngestDocumentUseCase.ts`  
**Perché:** Orchestrazione multi-step (parsing → cleaning → chunking → embedding).

- ⭕ Test case: flusso nominale → documento caricato e processato  
- ⭕ Test case: parsing fallisce → error propagation  
- ⭕ Test case: embedding fallisce → cleanup e error  
- ⭕ Mock: `IParser`, `ICleaner`, `IEmbedder`, `IBlobStorage`, `IQueue`  

---

### 15. `CrawlWorkFlow`, `CrawlStreamWorkFlow`
**File:** `src/application/orchestrators/CrawlWorkFlow.ts`, `CrawlStreamWorkFlow.ts`  
**Perché:** Orchestrazione scraping; logica di retry e aggregazione.

- ⭕ Test case: start crawl → genera sitemap o lista URL  
- ⭕ Test case: scrape selected page → rispetto dei rate limit  
- ⭕ Test case: get crawl status → ritorna stato aggregato  
- ⭕ Test case: stream workflow → yielda risultati incrementalmente  
- ⭕ Mock: `ICrawler`, `ISiteMapper`, `ICrawlStream`  

---

## PRIORITÀ MEDIA – Adapters

### 16. `ApiAdapter`
**File:** `src/infrastructure/adapters/Api/ApiAdapter.ts`  
**Perché:** Interfaccia HTTP; verificare costruzione request e mapping errori.

- ⭕ Test case: GET request senza body → chiamata HTTP.get(url)  
- ⭕ Test case: POST request con body → body passato correttamente  
- ⭕ Test case: HTTP error 404 → trasformazione in eccezione personalizzata  
- ⭕ Test case: timeout → error handling  
- ⭕ Mock: HTTP client (axios/fetch)  

---

### 17. `MarkdownCleanerAdapter`
**File:** `src/infrastructure/adapters/Cleaner/MarkdownCleanerAdapter.ts`  
**Perché:** Trasformazione markdown; regole di pulizia.

- ⭕ Test case: markdown valido → preserve struttura, remove tag HTML  
- ⭕ Test case: markdown corrotto → recovery attempt  
- ⭕ Mock: nessun (interno)  

---

### 18. `AwsS3BlobStorageAdapter`
**File:** `src/infrastructure/adapters/blob-storage/AwsS3BlobStorageAdapter.ts`  
**Perché:** I/O su S3; verificare parametri e mapping errori.

- ⭕ Test case: upload file → chiama S3.putObject con parametri attesi  
- ⭕ Test case: download file → S3.getObject e ritorna content  
- ⭕ Test case: S3 error → gestione eccezione  
- ⭕ Mock: AWS SDK (S3 client)  

---

## PRIORITÀ BASSA – CLI & Integration

### 19. `ApiCli`
**File:** `src/presentation/cli/ApiCli.ts`  
**Perché:** Interazione I/O; logica pura separabile, I/O testabile in integration.

**Per Unit Test (isolare logica pura):**
- ⭕ Test helper: URL construction per GET con paginazione  
- ⭕ Test helper: Body construction per POST con paginazione  
- ⭕ Test helper: Pagination loop termination logic  
- ⭕ Test helper: Markdown table generation da dati + fields  

**Approccio:** Estrarre helper function pure da CLI, testarle; lasciar CLI in integration/E2E test.

---

### 20. `configCli`, `FirecrawlCli`
**File:** `src/presentation/cli/`  
**Perché:** CLI helpers; testare parsing config e comandi.

- ⭕ Test case: load config da file JSON  
- ⭕ Test case: save config con validazione  
- ⭕ Test case: merge config con default  
- ⭕ Mock: `fs` operations  

---

## PRIORITÀ BASSA – Entities

### 21. Entity Classes (`Company`, `Contact`, `Document`, `NormalizedDocument`, `Chunk`)
**File:** `src/domain/entities/`  
**Perché:** Modelli dati; verificare costruttori, metodi di utilità, invarianti.

- ⭕ `Company`: creazione, campi obbligatori, equality, serializzazione  
- ⭕ `Contact`: validazione email/phone, equality  
- ⭕ `Document`: metadata, stato (draft/published), update fields  
- ⭕ `NormalizedDocument`: applicazione regole normalizzazione  
- ⭕ `Chunk`: contentSize, validazione, associazione document  

---

## PRIORITÀ BASSA – DTOs

### 22. DTO Classes (`ApiResponseDto`, `CompanyDto`, `ContactDto`, `PageDto`, `SiteMapDto`, ecc.)
**File:** `src/application/dto/`  
**Perché:** Mapping tra layer; test di serializzazione e shape.

- ⭕ Test case: creazione DTO da entity  
- ⭕ Test case: conversione DTO to entity  
- ⭕ Test case: DTO shape validation  
- ⭕ Test case: null/undefined field handling  

---

---

## RIEPILOGO CONTEGGIO

| Priorità | # Blocchi | # Singoli Test | Status   |
|----------|-----------|----------------|----------|
| Alta     | 9         | ~60            | ⭕ To Do |
| Media    | 6         | ~40            | ⭕ To Do |
| Bassa    | 7         | ~30            | ⭕ To Do |
| **TOT**  | **22**    | **~130**       | ⭕       |

---

## STRATEGIE DI IMPLEMENTAZIONE

### Step 1: Setup Test Infrastructure (veloce)
```bash
npm install -D vitest @testing-library/jest-dom
# Crea src/__tests__/ folder
# Configura vitest.config.ts
```

### Step 2: Implementare Blocchi in Ordine
1. **Week 1:** FindFirstArray + ObjectUtils (Pure functions, ~20 test)  
2. **Week 1-2:** Email + Url + UrlFilter (Value Objects + Service, ~15 test)  
3. **Week 2:** ApiUseCase + ApiWorkflow (Logic, ~25 test)  
4. **Week 2-3:** Orchestratori (CrawlWorkflow, IngestDocument, ~20 test)  
5. **Week 3:** Adapters (mock SDK, ~15 test)  
6. **Week 3-4:** CLI extract + Entities + DTOs (~35 test)  

### Step 3: Integrate in CI/CD
- Aggiungi task npm: `npm test` e `npm run test:coverage`  
- Imposta soglia coverage: min 70% (core logic), 60% (general)  
- Run su ogni commit (pre-commit hook)  

### Step 4: Documentazione Test
- Ogni test file inizia con commento di scopo  
- Usa describe blocks per organizzare per scenario  
- Mantieni fixture JSON in `__fixtures__/` folder  

---

## NOTE IMPORTANTI

1. **Mock HTTPClient, AWS, etc.:** Non testare richieste vere in unit test.  
2. **Separate Pure Logic from I/O:** Estrai helper function da CLI, testale; I/O in integration test.  
3. **Parametrized Tests (vitest):** Usa `.each()` per combinazioni di input (es. email valide/invalide).  
4. **Fixture Data:** Crea JSON mini-sample responses per API test; riusa.  
5. **Error Scenarios:** Non dimenticare error path (reject promise, lancia error).  

---

**Data creazione:** 2026-01-13  
**Tool:** Vitest  
**Target Coverage:** 70% Core Logic, 60% General  
