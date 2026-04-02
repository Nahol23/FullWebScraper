import { useState, useMemo } from "react";
import { downloadFile } from "../utils/downloadFile";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Download, Copy } from "lucide-react";

interface ResultViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    data?: unknown;
    contentType?: string;
    nextPageUrl?: string | null;
    meta?: { pagesScraped?: number; totalItems?: number };
  } | null;
}

function safeMarkdownCell(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return JSON.stringify(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  }
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function jsonToMarkdownTable(data: any): string {
  if (!data) return 'No data';
  if (typeof data !== 'object') return String(data);

  if (
    Array.isArray(data) &&
    data.length > 0 &&
    data.every((item) => typeof item === 'object' && item !== null)
  ) {
    const headers = Array.from(new Set(data.flatMap(Object.keys)));
    if (headers.length === 0) return JSON.stringify(data, null, 2);

    const headerRow = `| ${headers.join(' | ')} |`;
    const separator = `| ${headers.map(() => '---').join(' | ')} |`;
    const bodyRows = data
      .map(
        (item) =>
          `| ${headers.map((h) => safeMarkdownCell(item[h])).join(' | ')} |`
      )
      .join('\n');

    return `${headerRow}\n${separator}\n${bodyRows}`;
  }

  return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
}

export function ResultViewerModal({
  isOpen,
  onClose,
  result,
}: ResultViewerModalProps) {
  // Rinominato in "activeFormat" per riflettere l'assenza di Tabs
  const [activeFormat, setActiveFormat] = useState<"json" | "markdown" | "html">("json");

  const data = result?.data;
  const contentType = result?.contentType || "";
  const isHtml =
    contentType.includes("text/html") ||
    (typeof data === "string" &&
      (data.trim().startsWith("<!DOCTYPE") || data.trim().startsWith("<html")));

  const jsonString =
    typeof data === "object" ? JSON.stringify(data, null, 2) : String(data ?? "");
  const markdownTable = useMemo(() => jsonToMarkdownTable(data), [data]);

  if (!result) return null;

  const contentMap: Record<"json" | "markdown" | "html", { content: string; mime: string; ext: string }> = {
    json: { content: jsonString, mime: "application/json", ext: "json" },
    markdown: { content: markdownTable, mime: "text/markdown", ext: "md" },
    html: {
      content: isHtml && typeof data === "string" ? data : `<pre>${jsonString}</pre>`,
      mime: "text/html",
      ext: "html",
    },
  };

  const handleDownload = async () => {
  try {
    const { content, ext } = contentMap[activeFormat];
    await downloadFile(content, `execution-result.${ext}`, ext);
    console.log("Download completato con successo!");
    
  } catch (error) {
    console.error("Errore irreversibile durante il salvataggio del file:", error);
    
  }
};

  const handleCopy = async () => {
    try {
      const { content } = contentMap[activeFormat];
      await navigator.clipboard.writeText(content);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[1400px] max-h-[95vh] overflow-hidden flex flex-col bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Execution Result</DialogTitle>
          <DialogDescription className="text-sm text-zinc-400">
            Preview of the execution response. Use the controls to download or
            copy the content.
          </DialogDescription>

          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-zinc-400">Format:</label>
            <select
              value={activeFormat}
              onChange={(e) => setActiveFormat(e.target.value as "json" | "markdown" | "html")}
              className="bg-zinc-900 border border-zinc-800 text-sm text-white px-2 py-1.5 rounded outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
              {isHtml && <option value="html">HTML</option>}
            </select>

            <Button
              size="sm"
              onClick={handleDownload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 ml-1 rounded text-sm"
            >
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white h-8 px-3 rounded text-sm"
            >
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
          </div>
        </DialogHeader>

        {/* CONTENITORE PRINCIPALE (Renderizzazione Condizionale invece dei Tabs) */}
        <div className="flex-1 overflow-auto mt-4 border border-zinc-800 rounded-lg bg-zinc-900 p-4 min-h-0 flex flex-col">
          
          {activeFormat === "json" && (
            <textarea
              readOnly
              value={jsonString}
              className="text-sm font-mono text-zinc-300 whitespace-pre-wrap w-full bg-transparent border-0 outline-none resize-none overflow-auto flex-1 p-2"
            />
          )}

          {activeFormat === "markdown" && (
            <textarea
              readOnly
              value={markdownTable}
              className="text-sm font-mono text-zinc-300 whitespace-pre-wrap w-full bg-transparent border-0 outline-none resize-none overflow-auto flex-1 p-2"
            />
          )}

          {activeFormat === "html" && isHtml && (
            <>
              {typeof data === "string" && data.trim().startsWith("<") ? (
                <iframe
                  srcDoc={data}
                  title="HTML Result"
                  className="w-full h-[78vh] border-0 bg-white rounded"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              ) : (
                <div
                  className="overflow-auto flex-1"
                  dangerouslySetInnerHTML={{
                    __html: `<pre>${jsonString}</pre>`,
                  }}
                />
              )}
            </>
          )}

        </div>

        <DialogFooter className="flex sm:justify-end mt-4">
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}