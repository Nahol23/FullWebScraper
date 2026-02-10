export function flattenJson(
  currentObject: any, 
  parentPath = '', 
  flattenedResult: any = {}
): any {
  
  for (let propertyKey in currentObject) {
    // Costruisce il percorso completo della proprietà
    let fullPropertyPath = parentPath 
      ? `${parentPath}.${propertyKey}` 
      : propertyKey;
    
    let currentValue = currentObject[propertyKey];
    
    if (typeof currentValue === 'object' 
        && currentValue !== null 
        && !Array.isArray(currentValue)) {
      // Chiamata ricorsiva per esplorare l'oggetto annidato
      flattenJson(currentValue, fullPropertyPath, flattenedResult);
    } 
    else if (Array.isArray(currentValue)) {
      if (currentValue.length > 0 && typeof currentValue[0] === 'object') {
        flattenJson(currentValue[0], `${fullPropertyPath}.[0]`, flattenedResult);
      } else {
        flattenedResult[fullPropertyPath] = JSON.stringify(currentValue);
      }
    } 
    
    else {
      flattenedResult[fullPropertyPath] = currentValue;
    }
  }
  
  return flattenedResult;
}