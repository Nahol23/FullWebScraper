import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { cn } from "./ui/utils";

interface JsonTreeViewerProps {
  data: any;
  selectedFields: string[];
  onFieldToggle: (field: string) => void;
}

interface TreeNodeProps {
  label: string;
  value: any;
  path: string;
  level: number;
  selectedFields: string[];
  onFieldToggle: (field: string) => void;
}

function TreeNode({ label, value, path, level, selectedFields, onFieldToggle }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const isObject = typeof value === "object" && value !== null && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isExpandable = isObject || isArray;
  const fullPath = path ? `${path}.${label}` : label;

  const getValueType = () => {
    if (isArray) return "array";
    if (isObject) return "object";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (value === null) return "null";
    return "unknown";
  };

  const getValuePreview = () => {
    if (isArray) return `Array(${value.length})`;
    if (isObject) return `{...}`;
    if (typeof value === "string") return `"${value}"`;
    return String(value);
  };

  const valueType = getValueType();
  const isChecked = selectedFields.includes(fullPath);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors",
          level === 0 && "mt-1"
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {isExpandable ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <Checkbox
          checked={isChecked}
          onCheckedChange={() => onFieldToggle(fullPath)}
          className="h-4 w-4"
        />

        <span className="font-mono text-sm text-blue-600 dark:text-blue-400">{label}</span>
        <span className="text-muted-foreground text-sm">:</span>
        
        <span
          className={cn(
            "font-mono text-sm",
            valueType === "string" && "text-green-600 dark:text-green-400",
            valueType === "number" && "text-purple-600 dark:text-purple-400",
            valueType === "boolean" && "text-orange-600 dark:text-orange-400",
            valueType === "null" && "text-gray-500",
            (valueType === "object" || valueType === "array") && "text-muted-foreground"
          )}
        >
          {getValuePreview()}
        </span>
      </div>

      {isExpandable && isExpanded && (
        <div>
          {isArray
            ? value.slice(0, 3).map((item: any, index: number) => (
                <TreeNode
                  key={index}
                  label={`[${index}]`}
                  value={item}
                  path={fullPath}
                  level={level + 1}
                  selectedFields={selectedFields}
                  onFieldToggle={onFieldToggle}
                />
              ))
            : Object.entries(value).map(([key, val]) => (
                <TreeNode
                  key={key}
                  label={key}
                  value={val}
                  path={fullPath}
                  level={level + 1}
                  selectedFields={selectedFields}
                  onFieldToggle={onFieldToggle}
                />
              ))}
          {isArray && value.length > 3 && (
            <div
              className="text-xs text-muted-foreground font-mono py-1"
              style={{ paddingLeft: `${(level + 1) * 20 + 32}px` }}
            >
              ... {value.length - 3} more items
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function JsonTreeViewer({ data, selectedFields, onFieldToggle }: JsonTreeViewerProps) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card font-mono text-sm overflow-auto max-h-[500px]">
      {Object.entries(data).map(([key, value]) => (
        <TreeNode
          key={key}
          label={key}
          value={value}
          path=""
          level={0}
          selectedFields={selectedFields}
          onFieldToggle={onFieldToggle}
        />
      ))}
    </div>
  );
}
