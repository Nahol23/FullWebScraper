
export function getNestedData(obj: any, path?: string): any[] {
  if (!path) return Array.isArray(obj) ? obj : [];

  try {
    const result = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    return Array.isArray(result) ? result : [];
  } catch (e) {
    return [];
  }
}

export function findFirstArrayPath(obj: any, path: string = ""): string | null {
  // Controlla se è un array valido (non vuoto e con oggetti)
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') {
    return path;
  }

  if (typeof obj === "object" && obj !== null) {
    for (const key of Object.keys(obj)) {
      const newPath = path ? `${path}.${key}` : key;
      const found = findFirstArrayPath(obj[key], newPath);
      if (found) return found;
    }
  }
  return null;
}

  

export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  if (!obj || typeof obj !== 'object') return {};
  
  return Object.keys(obj).reduce((acc: any, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    
    if (
      typeof obj[k] === 'object' && 
      obj[k] !== null && 
      !Array.isArray(obj[k])
    ) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}


 
export function filterData<T extends Record<string, any>>(data: T[], filterInput: string): T[] {
  if (!filterInput || filterInput.trim() === "") return data;

  const searchTerms = filterInput.split(',')
    .map(term => term.trim().toLowerCase())
    .filter(term => term.length > 0);

  return data.filter((item) => {
    return searchTerms.every(term => {
      return Object.values(item).some(value => {
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(term);
      });
    });
  });
}
