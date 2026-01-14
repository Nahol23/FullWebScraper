import { describe, it, expect } from 'vitest';
import { Email } from '../../../domain/value-objects/Email';

describe('Email (Value Object)', () => {
  describe('Email valide', () => {
    it('dovrebbe creare istanza con email valida "user@example.com"', () => {
      const email = new Email('user@example.com');
      expect(email.getValue()).toBe('user@example.com');
    });

    it('dovrebbe creare istanza con sottodomini', () => {
      const email = new Email('user@mail.example.co.uk');
      expect(email.getValue()).toBe('user@mail.example.co.uk');
    });

    it('dovrebbe creare istanza con numeri nel nome', () => {
      const email = new Email('user123@example.com');
      expect(email.getValue()).toBe('user123@example.com');
    });

    it('dovrebbe creare istanza con punti nel nome utente', () => {
      const email = new Email('first.last@example.com');
      expect(email.getValue()).toBe('first.last@example.com');
    });

    it('dovrebbe creare istanza con underscore nel nome utente', () => {
      const email = new Email('user_name@example.com');
      expect(email.getValue()).toBe('user_name@example.com');
    });

    it('dovrebbe creare istanza con trattini nel dominio', () => {
      const email = new Email('user@my-example.com');
      expect(email.getValue()).toBe('user@my-example.com');
    });
  });

  describe('Email invalide - senza @', () => {
    it('dovrebbe lanciare Error se manca @', () => {
      expect(() => new Email('userexample.com')).toThrow();
    });

    it('dovrebbe lanciare Error con messaggio corretto', () => {
      expect(() => new Email('userexample.com')).toThrow(/Invalid email/);
    });
  });

  describe('Email invalide - senza TLD', () => {
    it('dovrebbe lanciare Error se manca TLD dopo punto', () => {
      expect(() => new Email('user@example')).toThrow();
    });

    it('dovrebbe lanciare Error se dominio non ha punto', () => {
      expect(() => new Email('user@localhost')).toThrow();
    });
  });

  describe('Email invalide - spazi', () => {
    it('dovrebbe lanciare Error se contiene spazi', () => {
      expect(() => new Email('user name@example.com')).toThrow();
    });

    it('dovrebbe lanciare Error se spazi prima di @', () => {
      expect(() => new Email('user @example.com')).toThrow();
    });

    it('dovrebbe lanciare Error se spazi dopo @', () => {
      expect(() => new Email('user@ example.com')).toThrow();
    });
  });

  describe('Email invalide - casi edge', () => {
    it('dovrebbe lanciare Error se doppio @', () => {
      expect(() => new Email('user@@example.com')).toThrow();
    });

    it('dovrebbe lanciare Error se @ all\'inizio', () => {
      expect(() => new Email('@example.com')).toThrow();
    });

    it('dovrebbe lanciare Error se @ alla fine', () => {
      expect(() => new Email('user@')).toThrow();
    });

    it('dovrebbe lanciare Error se stringa vuota', () => {
      expect(() => new Email('')).toThrow();
    });
  });

  describe('getValue() method', () => {
    it('dovrebbe ritornare valore originale', () => {
      const emailValue = 'test@example.com';
      const email = new Email(emailValue);
      expect(email.getValue()).toBe(emailValue);
    });

    it('dovrebbe ritornare la stessa stringa passata al costruttore', () => {
      const emails = [
        'alice@example.com',
        'bob@test.org',
        'charlie@my-domain.co.uk',
      ];
      emails.forEach(e => {
        const email = new Email(e);
        expect(email.getValue()).toBe(e);
      });
    });
  });

 
});
