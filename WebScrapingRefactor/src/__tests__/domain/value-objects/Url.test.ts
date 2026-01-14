import { describe, it, expect } from 'vitest';
import { Url } from '../../../domain/value-objects/Url';

describe('Url (Value Object)', () => {
  describe('URL valide - http/https', () => {
    it('dovrebbe creare istanza con URL https valida', () => {
      const url = new Url('https://example.com/path');
      expect(url.toString()).toBe('https://example.com/path');
    });

    it('dovrebbe creare istanza con URL http valida', () => {
      const url = new Url('http://example.com');
      expect(url.toString()).toBe('http://example.com');
    });

    it('dovrebbe creare istanza con URL con path complesso', () => {
      const url = new Url('https://example.com/path/to/resource');
      expect(url.toString()).toBe('https://example.com/path/to/resource');
    });

    it('dovrebbe creare istanza con URL con query string', () => {
      const url = new Url('https://example.com/search?q=test&limit=10');
      expect(url.toString()).toBe('https://example.com/search?q=test&limit=10');
    });

    it('dovrebbe creare istanza con URL con fragment', () => {
      const url = new Url('https://example.com/page#section');
      expect(url.toString()).toBe('https://example.com/page#section');
    });

    it('dovrebbe creare istanza con URL con porta', () => {
      const url = new Url('https://example.com:8080/path');
      expect(url.toString()).toBe('https://example.com:8080/path');
    });

    it('dovrebbe creare istanza con URL con sottodomini', () => {
      const url = new Url('https://mail.google.com');
      expect(url.toString()).toBe('https://mail.google.com');
    });

    it('dovrebbe creare istanza con URL con localhost', () => {
      const url = new Url('http://localhost:3000/api');
      expect(url.toString()).toBe('http://localhost:3000/api');
    });

    it('dovrebbe creare istanza con URL con IP address', () => {
      const url = new Url('http://192.168.1.1:8080/path');
      expect(url.toString()).toBe('http://192.168.1.1:8080/path');
    });
  });

  describe('toString() method', () => {
    it('dovrebbe ritornare URL originale', () => {
      const urlString = 'https://example.com/path';
      const url = new Url(urlString);
      expect(url.toString()).toBe(urlString);
    });

    it('dovrebbe preservare parametri URL', () => {
      const urlString = 'https://example.com/search?q=vitest&page=1';
      const url = new Url(urlString);
      expect(url.toString()).toBe(urlString);
    });
  });

  describe('domain getter', () => {
    it('dovrebbe estrarre hostname da URL semplice', () => {
      const url = new Url('https://example.com');
      expect(url.domain).toBe('example.com');
    });

    it('dovrebbe estrarre hostname da URL con path', () => {
      const url = new Url('https://example.com/path/to/resource');
      expect(url.domain).toBe('example.com');
    });

    it('dovrebbe estrarre hostname con sottodomini', () => {
      const url = new Url('https://mail.google.com/inbox');
      expect(url.domain).toBe('mail.google.com');
    });

    it('dovrebbe estrarre hostname con query string', () => {
      const url = new Url('https://example.com/search?q=test');
      expect(url.domain).toBe('example.com');
    });

    it('dovrebbe estrarre hostname con porta', () => {
      const url = new Url('http://localhost:3000/api');
      expect(url.domain).toBe('localhost');
    });

    it('dovrebbe estrarre hostname con IP', () => {
      const url = new Url('http://192.168.1.1:8080/path');
      expect(url.domain).toBe('192.168.1.1');
    });
  });

  describe('path getter', () => {
    it('dovrebbe estrarre pathname da URL con path', () => {
      const url = new Url('https://example.com/path/to/resource');
      expect(url.path).toBe('/path/to/resource');
    });

    it('dovrebbe ritornare "/" per URL radice', () => {
      const url = new Url('https://example.com');
      expect(url.path).toBe('/');
    });

    it('dovrebbe estrarre path ignorando query string', () => {
      const url = new Url('https://example.com/search?q=test');
      expect(url.path).toBe('/search');
    });

    it('dovrebbe estrarre path ignorando fragment', () => {
      const url = new Url('https://example.com/page#section');
      expect(url.path).toBe('/page');
    });

    it('dovrebbe estrarre path con estensione file', () => {
      const url = new Url('https://example.com/documents/file.pdf');
      expect(url.path).toBe('/documents/file.pdf');
    });

    it('dovrebbe gestire path con parametri encoded', () => {
      const url = new Url('https://example.com/search%20term');
      expect(url.path).toBe('/search%20term');
    });
  });

  describe('URL malformate', () => {
    it('dovrebbe lanciare Error per stringa non-URL', () => {
      expect(() => new Url('not a url')).toThrow();
    });

    it('dovrebbe lanciare Error per stringa vuota', () => {
      expect(() => new Url('')).toThrow();
    });

    it('dovrebbe lanciare Error per protocollo non valido', () => {
      expect(() => new Url('ftp://example.com')).toThrow(); 
    });

    it('dovrebbe lanciare Error per URL malformata con spazi', () => {
      expect(() => new Url('https://exam ple.com')).toThrow();
    });

    it('dovrebbe lanciare Error per URL relativa', () => {
      expect(() => new Url('/path/to/page')).toThrow();
    });

    it('dovrebbe lanciare Error per solo dominio senza protocollo', () => {
      expect(() => new Url('example.com')).toThrow();
    });

    it('dovrebbe lanciare Error per URL con doppio slash malformato', () => {
      expect(() => new Url('https:///example.com')).toThrow();
    });
  });

  

  describe('Combinazioni path + domain', () => {
    it('dovrebbe estrarre correttamente path e domain da URL complessa', () => {
      const url = new Url('https://api.example.com:8080/v1/users/123?limit=10#profile');
      expect(url.domain).toBe('api.example.com');
      expect(url.path).toBe('/v1/users/123');
    });
  });
});
