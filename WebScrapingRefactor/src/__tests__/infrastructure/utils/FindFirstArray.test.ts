import { describe, it, expect } from 'vitest';
import { parseJsonFields } from '../../../infrastructure/utils/FindFirstArray';

describe('FindFirstArray.parseJsonFields', () => {
  describe('Oggetti semplici e annidati', () => {
    it('dovrebbe estrarre path dot-notated da oggetto semplice', () => {
      const obj = { name: 'Bob', age: 30 };
      const result = parseJsonFields(obj);
      expect(result).toContain('name');
      expect(result).toContain('age');
      expect(result.length).toBe(2);
    });

    it('dovrebbe estrarre path da oggetto annidato', () => {
      const obj = { user: { name: 'Bob', email: 'bob@example.com' } };
      const result = parseJsonFields(obj);
      expect(result).toContain('user');
      expect(result).toContain('user.name');
      expect(result).toContain('user.email');
    });

    it('dovrebbe estrarre path da oggetto profondamente annidato (3+ livelli)', () => {
      const obj = {
        level1: {
          level2: {
            level3: { value: 'deep' },
          },
        },
      };
      const result = parseJsonFields(obj);
      expect(result).toContain('level1');
      expect(result).toContain('level1.level2');
      expect(result).toContain('level1.level2.level3');
      expect(result).toContain('level1.level2.level3.value');
    });
  });

  describe('Array di oggetti', () => {
    it('dovrebbe estrarre path dal primo elemento di array di oggetti', () => {
      const obj = {
        items: [
          { id: 1, name: 'Item1' },
          { id: 2, name: 'Item2' },
        ],
      };
      const result = parseJsonFields(obj);
      expect(result).toContain('items');
      expect(result).toContain('items.id');
      expect(result).toContain('items.name');
    });

    it('dovrebbe gestire array annidato in struttura complessa', () => {
      const obj = {
        data: {
          results: [{ id: 1, title: 'Test' }],
        },
      };
      const result = parseJsonFields(obj);
      expect(result).toContain('data');
      expect(result).toContain('data.results');
      expect(result).toContain('data.results.id');
      expect(result).toContain('data.results.title');
    });
  });

  describe('Array di primitivi', () => {
    it('dovrebbe gestire array di primitivi senza crashare', () => {
      const obj = { values: [1, 2, 3] };
      const result = parseJsonFields(obj);
      // Non deve crashare, ritorna path array ma non i valori primitivi
      expect(result).toContain('values');
    });

    it('dovrebbe gestire array di stringhe', () => {
      const obj = { tags: ['a', 'b', 'c'] };
      const result = parseJsonFields(obj);
      expect(result).toContain('tags');
    });
  });

  describe('Oggetti vuoti e falsy', () => {
    it('dovrebbe ritornare array vuoto per oggetto vuoto', () => {
      const obj = {};
      const result = parseJsonFields(obj);
      expect(result).toEqual([]);
    });

    it('dovrebbe gestire null senza crashare', () => {
      const result = parseJsonFields(null);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('dovrebbe gestire undefined senza crashare', () => {
      const result = parseJsonFields(undefined);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('dovrebbe gestire primitivi (string, number) senza crashare', () => {
      expect(parseJsonFields('string')).toEqual([]);
      expect(parseJsonFields(42)).toEqual([]);
      expect(parseJsonFields(true)).toEqual([]);
    });
  });

  describe('Duplicati e unicità', () => {
    it('dovrebbe rimuovere duplicati dai path (usando Set)', () => {
      // Nota: la funzione usa Array.from(new Set(fields))
      const obj = { user: { name: 'Bob', info: { name: 'Info' } } };
      const result = parseJsonFields(obj);
      // Conta occorrenze di 'name'
      const nameCount = result.filter(f => f.endsWith('name')).length;
      expect(nameCount).toBe(2); // 'user.name' e 'user.info.name' sono diversi
    });
  });

  describe('Edge case: mixed nested + array', () => {
    it('dovrebbe estrarre path da oggetto con nested properties e array', () => {
      const obj = {
        company: {
          name: 'ACME',
          employees: [{ id: 1, salary: 50000 }],
        },
      };
      const result = parseJsonFields(obj);
      expect(result).toContain('company');
      expect(result).toContain('company.name');
      expect(result).toContain('company.employees');
      expect(result).toContain('company.employees.id');
      expect(result).toContain('company.employees.salary');
    });

    it('dovrebbe gestire array vuoto senza estrarre path da esso', () => {
      const obj = { items: [] };
      const result = parseJsonFields(obj);
      // Array vuoto, non entra in traverse(obj[0], ...)
      expect(result).toContain('items');
      // Non ci sono path interni perché array è vuoto
    });
  });

  describe('Caratteri speciali e chiavi edge case', () => {
    it('dovrebbe gestire chiavi con numeri e underscore', () => {
      const obj = { field_1: 'value', field2name: 'value' };
      const result = parseJsonFields(obj);
      expect(result).toContain('field_1');
      expect(result).toContain('field2name');
    });

    it('dovrebbe gestire chiavi con spazi (come sono in JSON)', () => {
      // Nota: chiavi con spazi si creano con sintassi obj["key with spaces"]
      const obj = { 'key with spaces': 'value' };
      const result = parseJsonFields(obj);
      expect(result).toContain('key with spaces');
    });
  });
});
