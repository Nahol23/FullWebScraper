import { describe, it, expect } from 'vitest';
import {
  getNestedData,
  findFirstArrayPath,
  flattenObject,
  filterData,
} from '../../../infrastructure/utils/ObjectUtils';

describe('ObjectUtils.getNestedData', () => {
  describe('Path validi', () => {
    it('dovrebbe estrarre array da path depth 1', () => {
      const obj = { items: [{ id: 1 }, { id: 2 }] };
      const result = getNestedData(obj, 'items');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe(1);
    });

    it('dovrebbe estrarre array da path depth 3+ (a.b.c.d)', () => {
      const obj = {
        data: {
          results: {
            items: [{ id: 1 }, { id: 2 }],
          },
        },
      };
      const result = getNestedData(obj, 'data.results.items');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('dovrebbe ritornare array direttamente se root è array', () => {
      const obj = [{ id: 1 }, { id: 2 }];
      const result = getNestedData(obj);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('Path non trovati', () => {
    it('dovrebbe ritornare [] se path non esiste', () => {
      const obj = { items: [] };
      const result = getNestedData(obj, 'nonexistent.path');
      expect(result).toEqual([]);
    });

    it('dovrebbe ritornare [] se path parziale non esiste', () => {
      const obj = { data: { results: [] } };
      const result = getNestedData(obj, 'data.nothere.items');
      expect(result).toEqual([]);
    });

    it('dovrebbe ritornare [] se target non è array', () => {
      const obj = { items: { id: 1, name: 'test' } };
      const result = getNestedData(obj, 'items');
      expect(result).toEqual([]);
    });

    it('dovrebbe ritornare [] se target è null', () => {
      const obj = { items: null };
      const result = getNestedData(obj, 'items');
      expect(result).toEqual([]);
    });
  });

  describe('Input null/undefined', () => {
    it('dovrebbe ritornare [] se obj è null', () => {
      const result = getNestedData(null, 'any.path');
      expect(result).toEqual([]);
    });

    it('dovrebbe ritornare [] se obj è undefined', () => {
      const result = getNestedData(undefined, 'any.path');
      expect(result).toEqual([]);
    });

    it('dovrebbe ritornare [] se obj non è array e path è undefined', () => {
      const obj = { items: [1, 2] };
      const result = getNestedData(obj, undefined);
      expect(result).toEqual([]);
    });

    it('dovrebbe ritornare obj se obj è array e path è undefined', () => {
      const arr = [1, 2, 3];
      const result = getNestedData(arr, undefined);
      expect(result).toEqual(arr);
    });
  });

  describe('Edge case', () => {
    it('dovrebbe gestire path vuota (empty string)', () => {
      const obj = [{ id: 1 }];
      // Reduce su empty string split ritorna path vuoto
      const result = getNestedData(obj, '');
      expect(result).toEqual([]);
    });
  });
});

describe('ObjectUtils.findFirstArrayPath', () => {
  describe('Array al primo livello', () => {
    it('dovrebbe ritornare "" se array è al primo livello', () => {
      const obj = [{ id: 1 }, { id: 2 }];
      const result = findFirstArrayPath(obj);
      expect(result).toBe('');
    });
  });

  describe('Array annidato', () => {
    it('dovrebbe ritornare "items" se array è in obj.items', () => {
      const obj = { items: [{ id: 1 }] };
      const result = findFirstArrayPath(obj);
      expect(result).toBe('items');
    });

    it('dovrebbe ritornare "data.items" se array è nested', () => {
      const obj = { data: { items: [{ id: 1 }] } };
      const result = findFirstArrayPath(obj);
      expect(result).toBe('data.items');
    });

    it('dovrebbe ritornare primo array trovato (breadth-first-like)', () => {
      const obj = {
        results: [{ id: 1 }],
        data: { items: [{ id: 2 }] },
      };
      const result = findFirstArrayPath(obj);
      // Dipende dall'ordine di Object.keys; almeno uno dei due
      expect(['results', 'data.items']).toContain(result);
    });
  });

  describe('Nessun array', () => {
    it('dovrebbe ritornare null se nessun array esiste', () => {
      const obj = { name: 'test', value: 123 };
      const result = findFirstArrayPath(obj);
      expect(result).toBeNull();
    });

    it('dovrebbe ritornare null se oggetto è vuoto', () => {
      const obj = {};
      const result = findFirstArrayPath(obj);
      expect(result).toBeNull();
    });

    it('dovrebbe ritornare null se è un primitivo', () => {
      expect(findFirstArrayPath('string')).toBeNull();
      expect(findFirstArrayPath(123)).toBeNull();
      expect(findFirstArrayPath(null)).toBeNull();
    });
  });

  describe('Array vuoto', () => {
    it('dovrebbe ritornare null se array è vuoto (logica: invalid)', () => {
      const obj = { items: [] };
      const result = findFirstArrayPath(obj);
      expect(result).toBeNull();
    });
  });

  describe('Array di primitivi', () => {
    it('dovrebbe ritornare null se array contiene primitivi (non oggetti)', () => {
      const obj = { values: [1, 2, 3] };
      const result = findFirstArrayPath(obj);
      expect(result).toBeNull();
    });

    it('dovrebbe ritornare null se array contiene stringhe', () => {
      const obj = { tags: ['a', 'b', 'c'] };
      const result = findFirstArrayPath(obj);
      expect(result).toBeNull();
    });
  });

  describe('Proprietà non-array prima dell\'array', () => {
    it('dovrebbe trovare array anche se preceduto da altre proprietà', () => {
      const obj = {
        name: 'test',
        value: 123,
        items: [{ id: 1 }],
      };
      const result = findFirstArrayPath(obj);
      expect(result).toBe('items');
    });
  });
});

describe('ObjectUtils.flattenObject', () => {
  describe('Oggetti semplici', () => {
    it('dovrebbe ritornare {} se input non è oggetto', () => {
      expect(flattenObject('string')).toEqual({});
      expect(flattenObject(null)).toEqual({});
      expect(flattenObject(undefined)).toEqual({});
      expect(flattenObject(123)).toEqual({});
    });

    it('dovrebbe preservare oggetto semplice (no nesting)', () => {
      const obj = { name: 'Bob', age: 30 };
      const result = flattenObject(obj);
      expect(result).toEqual({ name: 'Bob', age: 30 });
    });
  });

  describe('Oggetti annidati', () => {
    it('dovrebbe flatten oggetto annidato con dot-notation', () => {
      const obj = { user: { name: 'Bob', profile: { age: 30 } } };
      const result = flattenObject(obj);
      expect(result['user.name']).toBe('Bob');
      expect(result['user.profile.age']).toBe(30);
    });

    it('dovrebbe gestire profondità 3+', () => {
      const obj = { a: { b: { c: { d: 'value' } } } };
      const result = flattenObject(obj);
      expect(result['a.b.c.d']).toBe('value');
    });
  });

  describe('Array e non-oggetti come valori', () => {
    it('dovrebbe preservare array come valore (non appiattire)', () => {
      const obj = { items: [1, 2, 3], name: 'test' };
      const result = flattenObject(obj);
      expect(result.items).toEqual([1, 2, 3]);
      expect(result.name).toBe('test');
    });

    it('dovrebbe preservare null e undefined', () => {
      const obj = { a: null, b: undefined, c: 'value' };
      const result = flattenObject(obj);
      expect(result.a).toBeNull();
      expect(result.b).toBeUndefined();
      expect(result.c).toBe('value');
    });

    it('dovrebbe preservare primitivi (numeri, stringhe, bool)', () => {
      const obj = { num: 42, str: 'text', bool: true };
      const result = flattenObject(obj);
      expect(result.num).toBe(42);
      expect(result.str).toBe('text');
      expect(result.bool).toBe(true);
    });
  });

  describe('Chiavi speciali', () => {
    it('dovrebbe gestire chiavi con numeri e underscore', () => {
      const obj = { field_1: { nested_2: 'value' } };
      const result = flattenObject(obj);
      expect(result['field_1.nested_2']).toBe('value');
    });

    it('dovrebbe gestire chiavi con spazi', () => {
      const obj = { 'key with spaces': { 'nested key': 'value' } };
      const result = flattenObject(obj);
      expect(result['key with spaces.nested key']).toBe('value');
    });
  });

  describe('Prefix parameter', () => {
    it('dovrebbe applicare prefix ai path se fornito', () => {
      const obj = { name: 'Bob', age: 30 };
      const result = flattenObject(obj, 'user');
      expect(result['user.name']).toBe('Bob');
      expect(result['user.age']).toBe(30);
    });
  });
});

describe('ObjectUtils.filterData', () => {
  const sampleData = [
    { id: 1, name: 'Alice', email: 'alice@example.com', age: 28 },
    { id: 2, name: 'Bob', email: 'bob@example.com', age: 35 },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 42 },
  ];

  describe('Input vuoto e fallback', () => {
    it('dovrebbe ritornare tutti i dati se filterInput è vuoto', () => {
      const result = filterData(sampleData, '');
      expect(result.length).toBe(3);
    });

    it('dovrebbe ritornare tutti i dati se filterInput è whitespace', () => {
      const result = filterData(sampleData, '   ');
      expect(result.length).toBe(3);
    });

    it('dovrebbe ritornare tutti i dati se filterInput è undefined/null', () => {
      expect(filterData(sampleData, undefined as any)).toHaveLength(3);
      expect(filterData(sampleData, null as any)).toHaveLength(3);
    });
  });

  describe('Ricerca singolo termine', () => {
    it('dovrebbe filtrare su ricerca case-insensitive', () => {
      const result = filterData(sampleData, 'alice');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Alice');
    });

    it('dovrebbe trovare termine in qualsiasi campo', () => {
      const result = filterData(sampleData, '@example.com');
      expect(result.length).toBe(3); // Tutti hanno email example.com
    });

    it('dovrebbe ritornare [] se termine non trovato', () => {
      const result = filterData(sampleData, 'nonexistent');
      expect(result).toEqual([]);
    });

    it('dovrebbe trovare numeri come stringhe', () => {
      const result = filterData(sampleData, '28');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('Ricerca multipla (AND logic)', () => {
    it('dovrebbe applicare AND logic con virgola separata', () => {
      const result = filterData(sampleData, 'alice, 28');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Alice');
    });

    it('dovrebbe ritornare [] se un termine non matcha', () => {
      const result = filterData(sampleData, 'alice, 35');
      expect(result).toEqual([]);
    });

    it('dovrebbe gestire whitespace nei termini', () => {
      const result = filterData(sampleData, '  alice  ,  28  ');
      expect(result.length).toBe(1);
    });

    it('dovrebbe filtrare con più termini', () => {
      const result = filterData(sampleData, 'bob, example.com, 35');
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Bob');
    });
  });

  describe('Campi null/undefined', () => {
    it('dovrebbe skippare null/undefined nei campi senza crashare', () => {
      const dataWithNull = [
        { id: 1, name: 'Alice', email: null },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];
      const result = filterData(dataWithNull, 'bob');
      expect(result.length).toBe(1);
    });
  });

  describe('Edge case: array vuoto', () => {
    it('dovrebbe ritornare [] se data array è vuoto', () => {
      const result = filterData([], 'alice');
      expect(result).toEqual([]);
    });
  });

  describe('Edge case: oggetti con strutture diverse', () => {
    it('dovrebbe gestire oggetti con campi diversi', () => {
      const mixedData = [
        { id: 1, name: 'Alice' },
        { id: 2, email: 'bob@example.com' },
      ];
      const result = filterData(mixedData, 'alice');
      expect(result.length).toBe(1);
    });
  });
});
