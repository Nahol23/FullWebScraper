// Rileva se siamo in Tauri o nel browser
const isTauri = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function downloadFile(
  content: string,
  filename: string,
  ext: string
): Promise<void> {
  if (isTauri()) {
    // Lazy import per non rompere il bundle web
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");

    const filePath = await save({
      defaultPath: filename,
      filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
    });

    if (filePath) {
      await writeTextFile(filePath, content);
    }
  } else {
    // Fallback web standard
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}