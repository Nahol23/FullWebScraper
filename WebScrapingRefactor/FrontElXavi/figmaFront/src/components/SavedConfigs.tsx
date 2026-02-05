import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Play, Edit, Trash2, Search } from "lucide-react";
import { cn } from "./ui/utils";

interface SavedConfig {
  id: string;
  name: string;
  baseUrl: string;
  method: "GET" | "POST";
  lastUsed: string;
  status: "active" | "inactive";
}

const mockConfigs: SavedConfig[] = [
  {
    id: "1",
    name: "User Data Export",
    baseUrl: "https://api.example.com/users",
    method: "GET",
    lastUsed: "2024-02-03",
    status: "active",
  },
  {
    id: "2",
    name: "Product Analytics",
    baseUrl: "https://api.shopify.com/products",
    method: "GET",
    lastUsed: "2024-02-01",
    status: "active",
  },
  {
    id: "3",
    name: "Sales Report Generator",
    baseUrl: "https://api.stripe.com/charges",
    method: "POST",
    lastUsed: "2024-01-28",
    status: "inactive",
  },
  {
    id: "4",
    name: "Customer Insights",
    baseUrl: "https://api.analytics.com/customers",
    method: "GET",
    lastUsed: "2024-01-25",
    status: "active",
  },
  {
    id: "5",
    name: "Inventory Sync",
    baseUrl: "https://api.inventory.io/items",
    method: "POST",
    lastUsed: "2024-01-20",
    status: "inactive",
  },
];

export function SavedConfigs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [configs, setConfigs] = useState(mockConfigs);

  const filteredConfigs = configs.filter(
    (config) =>
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.baseUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRun = (config: SavedConfig) => {
    console.log("Running config:", config.name);
  };

  const handleEdit = (config: SavedConfig) => {
    console.log("Editing config:", config.name);
  };

  const handleDelete = (id: string) => {
    setConfigs(configs.filter((c) => c.id !== id));
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Saved Configurations</CardTitle>
              <CardDescription>Manage and run your saved API configurations</CardDescription>
            </div>
            <Button>New Configuration</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search configurations by name or URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No configurations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConfigs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {config.baseUrl}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-2",
                            config.method === "GET"
                              ? "border-green-500 text-green-600 dark:text-green-400"
                              : "border-orange-500 text-orange-600 dark:text-orange-400"
                          )}
                        >
                          {config.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(config.lastUsed).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={config.status === "active" ? "default" : "secondary"}
                        >
                          {config.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleRun(config)}
                            className="gap-1"
                          >
                            <Play className="h-3 w-3" />
                            Run
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(config)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(config.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-semibold">{configs.length}</div>
                  <p className="text-sm text-muted-foreground mt-1">Total Configs</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-green-600 dark:text-green-400">
                    {configs.filter((c) => c.status === "active").length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-muted-foreground">
                    {configs.filter((c) => c.status === "inactive").length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Inactive</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
