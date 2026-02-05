import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { X, CheckCircle2, Loader2, Download } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface ExecutionProgressProps {
  onClose: () => void;
}

interface ExtractedRecord {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

export function ExecutionProgress({ onClose }: ExecutionProgressProps) {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [totalBlocks] = useState(10);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedRecord[]>([]);

  // Mock data for demonstration
  const mockRecords: ExtractedRecord[] = Array.from({ length: 250 }, (_, i) => ({
    id: 1001 + i,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    active: Math.random() > 0.3,
  }));

  useEffect(() => {
    if (currentBlock >= totalBlocks) {
      setIsComplete(true);
      return;
    }

    const timer = setInterval(() => {
      setCurrentBlock((prev) => {
        const next = prev + 1;
        setProgress((next / totalBlocks) * 100);
        
        // Add batch of records
        const batchSize = 25;
        const startIdx = next * batchSize;
        const endIdx = Math.min(startIdx + batchSize, mockRecords.length);
        setExtractedData((prevData) => [
          ...prevData,
          ...mockRecords.slice(startIdx, endIdx),
        ]);

        return next;
      });
    }, 800);

    return () => clearInterval(timer);
  }, [currentBlock, totalBlocks, mockRecords]);

  const handleDownload = () => {
    console.log("Downloading data...", extractedData);
    // In a real app, this would trigger a CSV/JSON download
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>
                {isComplete ? "Extraction Complete" : "Extracting Data"}
              </CardTitle>
              <CardDescription>
                {isComplete
                  ? `Successfully extracted ${extractedData.length} records`
                  : `Downloading block ${currentBlock} of ${totalBlocks}`}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-6 overflow-hidden flex flex-col">
          {/* Progress Section */}
          <div className="space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isComplete ? "100%" : `${Math.round(progress)}%`}
              </span>
              <span className="text-muted-foreground">
                {extractedData.length} / {mockRecords.length} records
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {isComplete ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span>Extraction completed successfully</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing API requests...</span>
              </div>
            )}
          </div>

          {/* Live Data Preview */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h4>Extracted Data Preview</h4>
              {isComplete && (
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
              )}
            </div>

            <div className="border rounded-lg flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-24">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-28">Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                          Waiting for data...
                        </TableCell>
                      </TableRow>
                    ) : (
                      extractedData.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-mono text-sm">
                            {record.id}
                          </TableCell>
                          <TableCell>{record.name}</TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {record.email}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                record.active
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-gray-500"
                              }
                            >
                              {record.active ? "Yes" : "No"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>

          {/* Action Buttons */}
          {isComplete && (
            <div className="flex justify-end gap-3 flex-shrink-0">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                Download Results
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
