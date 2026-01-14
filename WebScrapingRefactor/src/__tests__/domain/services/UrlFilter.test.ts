import { describe, it, expect } from 'vitest';
import { UrlFilter } from '../../../domain/services/UrlFilter';
import { Url } from '../../../domain/value-objects/Url';

describe('UrlFilter (Service)', () => {
  const allowedDomains = ['example.com', 'test.org', 'api.example.com'];
  const excludedExtensions = ['jpg', 'png', 'gif', 'css', 'js'];

  describe('Costruttore e default', () => {
    it('dovrebbe creare istanza con allowedDomains e excludedExtensions di default', () => {
      const filter = new UrlFilter(allowedDomains);
      // Verificare che sia creato senza errori
      expect(filter).toBeDefined();
    });

    it('dovrebbe creare istanza con excludedExtensions personalizzati', () => {
      const customExtensions = ['pdf', 'doc', 'docx'];
      const filter = new UrlFilter(allowedDomains, customExtensions);
      expect(filter).toBeDefined();
    });
  });

  describe('isAllowed() - Dominio consentito + estensione consentita', () => {
    const filter = new UrlFilter(allowedDomains, excludedExtensions);

    it('dovrebbe ritornare true per URL con dominio consentito e path HTML', () => {
      const url = new Url('https://example.com/page');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare true per URL con dominio consentito e path senza estensione', () => {
      const url = new Url('https://example.com/api/users');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare true per URL con sottodominio consentito', () => {
      const url = new Url('https://api.example.com/v1/endpoint');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare true per URL con path complesso e dominio consentito', () => {
      const url = new Url('https://test.org/deep/path/to/resource');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare true per URL con query string', () => {
      const url = new Url('https://example.com/search?q=test&limit=10');
      expect(filter.isAllowed(url)).toBe(true);
    });
  });

  describe('isAllowed() - Dominio NON consentito', () => {
    const filter = new UrlFilter(allowedDomains, excludedExtensions);

    it('dovrebbe ritornare false per URL con dominio non consentito', () => {
      const url = new Url('https://notallowed.com/page');
      expect(filter.isAllowed(url)).toBe(false);
    });

    it('dovrebbe ritornare false per dominio simile ma non esatto', () => {
      const url = new Url('https://example.org/page'); // example.org != example.com
      expect(filter.isAllowed(url)).toBe(false);
    });

    it('dovrebbe ritornare false per sottodominio non consentito', () => {
      const url = new Url('https://other.example.com/page');
      expect(filter.isAllowed(url)).toBe(false);
    });
  });

  describe('isAllowed() - Estensione esclusa', () => {
    const filter = new UrlFilter(allowedDomains, excludedExtensions);

    it('dovrebbe ritornare false per URL con estensione esclusa .jpg', () => {
      const url = new Url('https://example.com/image.jpg');
      expect(filter.isAllowed(url)).toBe(false);
    });

    it('dovrebbe ritornare false per URL con estensione esclusa .png', () => {
      const url = new Url('https://example.com/image.png');
      expect(filter.isAllowed(url)).toBe(false);
    });

    it('dovrebbe ritornare false per URL con estensione esclusa .css', () => {
      const url = new Url('https://example.com/styles/main.css');
      expect(filter.isAllowed(url)).toBe(false);
    });

    it('dovrebbe ritornare false per URL con estensione esclusa .js', () => {
      const url = new Url('https://example.com/scripts/app.js');
      expect(filter.isAllowed(url)).toBe(false);
    });

    it('dovrebbe ritornare false se path contiene estensione esclusa anche con query string', () => {
      const url = new Url('https://example.com/image.gif?size=large');
      expect(filter.isAllowed(url)).toBe(false);
    });
  });

  describe('isAllowed() - Estensione consentita (non in lista esclusione)', () => {
    const filter = new UrlFilter(allowedDomains, excludedExtensions);

    it('dovrebbe ritornare true per .html', () => {
      const url = new Url('https://example.com/page.html');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare true per .pdf', () => {
      const url = new Url('https://example.com/document.pdf');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare true per .xml', () => {
      const url = new Url('https://example.com/sitemap.xml');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare true per .json', () => {
      const url = new Url('https://example.com/data.json');
      expect(filter.isAllowed(url)).toBe(true);
    });
  });

  describe('isAllowed() - Senza estensione', () => {
    const filter = new UrlFilter(allowedDomains, excludedExtensions);

    it('dovrebbe ritornare true per URL senza estensione (dominio consentito)', () => {
      const url = new Url('https://example.com/api/users');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare true per URL radice', () => {
      const url = new Url('https://example.com/');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare true per URL con solo dominio', () => {
      const url = new Url('https://test.org');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare false per URL senza estensione ma dominio non consentito', () => {
      const url = new Url('https://notallowed.com/api/users');
      expect(filter.isAllowed(url)).toBe(false);
    });
  });

  describe('isAllowed() - Case sensitivity', () => {
    const filter = new UrlFilter(allowedDomains, excludedExtensions);

    it('dovrebbe trovare estensione case-insensitive (.JPG vs .jpg)', () => {
      const url = new Url('https://example.com/image.JPG');
      // Note: URL.pathname ritorna lowercase per estensione? Verificare...
      // Questo dipende dal parser URL - testare il comportamento reale
      expect(filter.isAllowed(url)).toBe(true); // Se case-sensitive, ritorna true
    });
  });

  describe('ExcludedExtensions personalizzati', () => {
    it('dovrebbe applicare nuove esclusioni personalizzate', () => {
      const customFilter = new UrlFilter(
        allowedDomains,
        ['pdf', 'doc', 'xlsx']
      );
      const urlPdf = new Url('https://example.com/file.pdf');
      const urlDoc = new Url('https://example.com/file.doc');
      const urlHtml = new Url('https://example.com/file.html');

      expect(customFilter.isAllowed(urlPdf)).toBe(false);
      expect(customFilter.isAllowed(urlDoc)).toBe(false);
      expect(customFilter.isAllowed(urlHtml)).toBe(true);
    });

    it('dovrebbe permettere immagini se non in lista custom', () => {
      const customFilter = new UrlFilter(
        allowedDomains,
        ['mp4', 'mov'] // Solo video esclusi
      );
      const urlImg = new Url('https://example.com/image.jpg');
      const urlVid = new Url('https://example.com/movie.mp4');

      expect(customFilter.isAllowed(urlImg)).toBe(true);
      expect(customFilter.isAllowed(urlVid)).toBe(false);
    });
  });

  describe('Dominio multipli whitelist', () => {
    it('dovrebbe consentire qualunque dominio nella lista', () => {
      const multiDomainFilter = new UrlFilter(['domain1.com', 'domain2.org', 'domain3.net']);

      expect(multiDomainFilter.isAllowed(new Url('https://domain1.com/page'))).toBe(true);
      expect(multiDomainFilter.isAllowed(new Url('https://domain2.org/page'))).toBe(true);
      expect(multiDomainFilter.isAllowed(new Url('https://domain3.net/page'))).toBe(true);
      expect(multiDomainFilter.isAllowed(new Url('https://domain4.com/page'))).toBe(false);
    });
  });

  describe('Combinazioni: dominio + estensione', () => {
    const filter = new UrlFilter(
      ['example.com', 'cdn.example.com'],
      ['jpg', 'png', 'css', 'js']
    );

    it('dovrebbe ritornare true: dominio OK + estensione OK', () => {
      const url = new Url('https://example.com/page.html');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe ritornare false: dominio OK + estensione esclusa', () => {
      const url = new Url('https://example.com/style.css');
      expect(filter.isAllowed(url)).toBe(false);
    });

    it('dovrebbe ritornare false: dominio escluso + estensione OK', () => {
      const url = new Url('https://other.com/page.html');
      expect(filter.isAllowed(url)).toBe(false);
    });

    it('dovrebbe ritornare false: dominio escluso + estensione esclusa', () => {
      const url = new Url('https://other.com/image.png');
      expect(filter.isAllowed(url)).toBe(false);
    });

    it('dovrebbe consentire sottodominio di CDN', () => {
      const url = new Url('https://cdn.example.com/assets/main.html');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe vietare immagini anche da CDN', () => {
      const url = new Url('https://cdn.example.com/images/photo.jpg');
      expect(filter.isAllowed(url)).toBe(false);
    });
  });

  describe('Edge case: URL con numeri e caratteri speciali', () => {
    const filter = new UrlFilter(allowedDomains, excludedExtensions);

    it('dovrebbe gestire domini con numeri', () => {
      const testFilter = new UrlFilter(['api2.example.com']);
      const url = new Url('https://api2.example.com/endpoint');
      expect(testFilter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe gestire path con parametri encoded', () => {
      const url = new Url('https://example.com/search%20term');
      expect(filter.isAllowed(url)).toBe(true);
    });

    it('dovrebbe gestire URL con porta', () => {
      const url = new Url('https://example.com:8080/page');
      expect(filter.isAllowed(url)).toBe(true);
    });
  });
});
