import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { FileJson, FileText, FileCode } from "lucide-react";
import type { ExecutionResult } from "../../domain/entities/ExecutionResult";

interface ResultViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExecutionResult | null;
}
function safeMarkdownCell(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // Serializza oggetti/array in JSON compatto
    return JSON.stringify(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  }
  // Per stringhe e primitivi, escape delle pipe
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

// Helper: convert JSON to Markdown table if possible
function jsonToMarkdownTable(data: any): string {
  if (!data) return 'No data';
  if (typeof data !== 'object') return String(data);

  // Caso array di oggetti
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

  // Se è un array ma non di oggetti, o un oggetto singolo, mostra come blocco di codice
  return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
}
export function ResultViewerModal({
  isOpen,
  onClose,
  result,
}: ResultViewerModalProps) {
  const [activeTab, setActiveTab] = useState<"json" | "markdown" | "html">(
    "json",
  );
  const [selectedFormat, setSelectedFormat] = useState<
    "json" | "markdown" | "html"
  >("json");

  const data = result?.data;
  const contentType = result?.contentType || "";
  const isHtml =
    contentType.includes("text/html") ||
    (typeof data === "string" &&
      (data.trim().startsWith("<!DOCTYPE") || data.trim().startsWith("<html")));

  const jsonString =
    typeof data === "object" ? JSON.stringify(data, null, 2) : String(data ?? "");
  const markdownTable = useMemo(() => jsonToMarkdownTable(data), [data]);

  // Sync the select with the visible preview tab so preview updates when format changes
  useEffect(() => {
    setActiveTab(selectedFormat);
  }, [selectedFormat]);

  if (!result) return null;

  const handleDownload = (format: "json" | "markdown" | "html") => {
    let content = "";
    let mime = "";
    let ext = "";

    if (format === "json") {
      content = jsonString;
      mime = "application/json";
      ext = "json";
    } else if (format === "markdown") {
      content = markdownTable;
      mime = "text/markdown";
      ext = "md";
    } else {
      // html
      content =
        isHtml && typeof data === "string" ? data : `<pre>${jsonString}</pre>`;
      mime = "text/html";
      ext = "html";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `execution-result.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSelected = () => handleDownload(selectedFormat);

  const handleCopy = async () => {
    try {
      if (activeTab === "json") await navigator.clipboard.writeText(jsonString);
      else if (activeTab === "markdown")
        await navigator.clipboard.writeText(markdownTable);
      else if (isHtml && typeof data === "string")
        await navigator.clipboard.writeText(data);
      else await navigator.clipboard.writeText(jsonString);
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

          <form
            className="mt-3 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleDownloadSelected();
            }}
          >
            <label className="text-xs text-zinc-400">Download:</label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-sm text-white px-2 py-1 rounded"
            >
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
            >
              Download
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="ml-2 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1 rounded text-sm"
            >
              Copy
            </button>
          </form>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as typeof activeTab);
            setSelectedFormat(v as any);
          }}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="bg-zinc-900 border border-zinc-800 self-start">
            <TabsTrigger
              value="json"
              className="data-[state=active]:bg-indigo-600"
            >
              JSON
            </TabsTrigger>
            <TabsTrigger
              value="markdown"
              className="data-[state=active]:bg-indigo-600"
            >
              Markdown
            </TabsTrigger>
            {isHtml && (
              <TabsTrigger
                value="html"
                className="data-[state=active]:bg-indigo-600"
              >
                HTML
              </TabsTrigger>
            )}
          </TabsList>

          <div className="flex-1 overflow-auto mt-4 border border-zinc-800 rounded-lg bg-zinc-900 p-4 min-h-0 flex flex-col">
            <TabsContent value="json" className="m-0 h-full flex-1">
              <textarea
                readOnly
                value={jsonString}
                className="text-sm font-mono text-zinc-300 whitespace-pre-wrap w-full bg-transparent border-0 outline-none resize-none overflow-auto flex-1 p-2"
              />
            </TabsContent>

            <TabsContent value="markdown" className="m-0 h-full flex-1">
              <textarea
                readOnly
                value={markdownTable}
                className="text-sm font-mono text-zinc-300 whitespace-pre-wrap w-full bg-transparent border-0 outline-none resize-none overflow-auto flex-1 p-2"
              />
            </TabsContent>

            {isHtml && (
              <TabsContent value="html" className="m-0 h-full">
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
              </TabsContent>
            )}
          </div>
        </Tabs>

        <DialogFooter className="flex sm:justify-between gap-2 mt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("json")}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            >
              <FileJson className="h-4 w-4 mr-2" /> JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload("markdown")}
              className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
            >
              <FileText className="h-4 w-4 mr-2" /> Markdown
            </Button>
            {isHtml && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("html")}
                className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
              >
                <FileCode className="h-4 w-4 mr-2" /> HTML
              </Button>
            )}
          </div>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}