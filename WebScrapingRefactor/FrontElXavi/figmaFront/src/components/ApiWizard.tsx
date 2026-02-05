import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Play, Save } from "lucide-react";
import { cn } from "./ui/utils";
import { JsonTreeViewer } from "./JsonTreeViewer";
import { ScrollArea } from "./ui/scroll-area";

interface ApiWizardProps {
  onExecute: () => void;
}

export function ApiWizard({ onExecute }: ApiWizardProps) {
  const [method, setMethod] = useState<"GET" | "POST">("GET");
  const [url, setUrl] = useState("https://api.example.com/data");
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer YOUR_API_KEY"\n}');
  const [body, setBody] = useState('{\n  "query": "sample",\n  "filter": "active"\n}');
  const [initialOffset, setInitialOffset] = useState("0");
  const [limitPerPage, setLimitPerPage] = useState("100");
  const [paginationParam, setPaginationParam] = useState("offset");
  const [totalPages, setTotalPages] = useState("10");
  const [showResults, setShowResults] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Mock API response data
  const mockApiResponse = {
    status: "success",
    data: [
      {
        id: 1001,
        name: "John Doe",
        email: "john@example.com",
        age: 28,
        active: true,
        metadata: {
          created_at: "2024-01-15T10:30:00Z",
          last_login: "2024-02-01T14:22:00Z",
          preferences: {
            theme: "dark",
            notifications: true
          }
        }
      },
      {
        id: 1002,
        name: "Jane Smith",
        email: "jane@example.com",
        age: 32,
        active: true,
        metadata: {
          created_at: "2024-01-10T08:15:00Z",
          last_login: "2024-02-03T09:45:00Z",
          preferences: {
            theme: "light",
            notifications: false
          }
        }
      }
    ],
    pagination: {
      total: 250,
      offset: 0,
      limit: 100,
      has_more: true
    }
  };

  const handleAnalyze = () => {
    setShowResults(true);
    // Auto-select some common fields
    setSelectedFields([
      "data.[0].id",
      "data.[0].name",
      "data.[0].email",
      "data.[0].active"
    ]);
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const handleExecute = () => {
    onExecute();
  };

  return (
    <div className="p-6 space-y-6">
      {/* API Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Configure your API endpoint and request parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* URL and Method */}
          <div className="flex gap-4">
            <div className="w-32">
              <Label htmlFor="method">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as "GET" | "POST")}>
                <SelectTrigger 
                  id="method"
                  className={cn(
                    "border-2",
                    method === "GET" ? "border-green-500 text-green-600 dark:text-green-400" : "border-orange-500 text-orange-600 dark:text-orange-400"
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">
                    <span className="text-green-600 dark:text-green-400 font-medium">GET</span>
                  </SelectItem>
                  <SelectItem value="POST">
                    <span className="text-orange-600 dark:text-orange-400 font-medium">POST</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/endpoint"
                className="font-mono text-sm"
              />
            </div>
          </div>

          {/* Headers and Body */}
          <Tabs defaultValue="headers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
            </TabsList>
            <TabsContent value="headers" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="headers">Request Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  className="font-mono text-sm min-h-[200px] bg-muted/30"
                  placeholder='{"Content-Type": "application/json"}'
                />
              </div>
            </TabsContent>
            <TabsContent value="body" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="body">Request Body (JSON)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="font-mono text-sm min-h-[200px] bg-muted/30"
                  placeholder='{"key": "value"}'
                  disabled={method === "GET"}
                />
                {method === "GET" && (
                  <p className="text-xs text-muted-foreground">Body is not available for GET requests</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pagination Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pagination Settings</CardTitle>
          <CardDescription>Configure how the tool should paginate through results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialOffset">Initial Offset</Label>
              <Input
                id="initialOffset"
                type="number"
                value={initialOffset}
                onChange={(e) => setInitialOffset(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limitPerPage">Limit per Page</Label>
              <Input
                id="limitPerPage"
                type="number"
                value={limitPerPage}
                onChange={(e) => setLimitPerPage(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paginationParam">Pagination Parameter Name</Label>
              <Input
                id="paginationParam"
                value={paginationParam}
                onChange={(e) => setPaginationParam(e.target.value)}
                placeholder="offset"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPages">Total Pages</Label>
              <Input
                id="totalPages"
                type="number"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleAnalyze} className="gap-2">
          <Play className="h-4 w-4" />
          Analyze
        </Button>
        <Button variant="outline" className="gap-2">
          <Save className="h-4 w-4" />
          Save Configuration
        </Button>
      </div>

      {/* Results Preview - will be populated in next step */}
      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle>Results Preview</CardTitle>
            <CardDescription>Response structure and field selection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="mb-3">JSON Structure</h4>
              <ScrollArea className="h-[400px]">
                <JsonTreeViewer
                  data={mockApiResponse}
                  selectedFields={selectedFields}
                  onFieldToggle={handleFieldToggle}
                />
              </ScrollArea>
            </div>
            
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <h4>Selected Fields ({selectedFields.length})</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFields([])}
                >
                  Clear All
                </Button>
              </div>
              {selectedFields.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedFields.map((field) => (
                    <div
                      key={field}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-md text-sm font-mono"
                    >
                      {field}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select fields from the JSON tree above to include in extraction
                </p>
              )}
            </div>

            <div className="pt-4">
              <Button onClick={handleExecute} className="w-full gap-2">
                <Play className="h-4 w-4" />
                Execute Extraction
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}