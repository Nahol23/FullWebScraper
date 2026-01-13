export function parseJsonFields(json: any): string[] {
  const fields: string[] = [];

  function traverse(obj: any, prefix: string = "") {
    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        traverse(obj[0], prefix); 
      }
    } else if (typeof obj === "object" && obj !== null) {
      Object.keys(obj).forEach((key) => {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        fields.push(newPrefix);
        traverse(obj[key], newPrefix);
      });
    }
  }

  traverse(json);
  return Array.from(new Set(fields));
}
