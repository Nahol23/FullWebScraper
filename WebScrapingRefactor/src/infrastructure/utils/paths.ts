// src/infrastructure/utils/paths.ts
import fs from "fs";
import path from "path";

function getResourceDir(): string {
  const tauriDir = process.env.TAURI_RESOURCE_DIR;

  if (tauriDir) {
    // Verifica che esista il marker file
    const marker = path.join(tauriDir, "bundle.js");
    if (fs.existsSync(marker)) {
      return tauriDir;
    }
    console.warn(
      `[Paths] TAURI_RESOURCE_DIR puntato a ${tauriDir} ma bundle.js non trovato!`,
    );
  }

  // Fallback più robusto: cerca bundle.js risalendo la directory
  let currentDir = path.dirname(process.execPath);
  const maxDepth = 3;

  for (let i = 0; i < maxDepth; i++) {
    if (fs.existsSync(path.join(currentDir, "bundle.js"))) {
      console.log(`[Paths] Trovato bundle.js in: ${currentDir}`);
      return currentDir;
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break; // Root raggiunto
    currentDir = parent;
  }

  throw new Error(
    `Impossibile trovare bundle.js! ` +
      `TAURI_RESOURCE_DIR=${tauriDir}, ` +
      `execPath=${process.execPath}`,
  );
}

export const RESOURCE_DIR = getResourceDir();
