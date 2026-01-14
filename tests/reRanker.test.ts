import { describe, it, expect } from 'vitest';
import { reRank } from '../services/reRanker';

describe('reRanker', () => {
  it('ranks exact better than partial', () => {
    const text = 'quero agendar limpeza de pele';
    const candidates = [
      { intentId: 'i1', intentName: 'Agendamento', example: 'Agendar limpeza de pele', score: 0.5 },
      { intentId: 'i2', intentName: 'Cancelamento', example: 'Cancelar agendamento', score: 0.5 }
    ];
    const ranked = reRank(text, candidates);
    expect(ranked[0].intentId).toBe('i1');
  });

  it('uses overlap when examples missing', () => {
    const text = 'preciso cancelar meu horário';
    const candidates = [
      { intentId: 'i1', intentName: 'Agendamento', example: 'Agendar', score: 0.6 },
      { intentId: 'i2', intentName: 'Cancelamento', example: 'Cancelar meu horário', score: 0.2 }
    ];
    const ranked = reRank(text, candidates, { normalizeWeight: 1.0, existingWeight: 0.2 });
    expect(ranked[0].intentId).toBe('i2');
  });

  it('should prefer candidate with similar example (fuzzy)', () => {
    const text = 'How much is the price?';
    const candidates = [
      { intentId: 'a', example: 'What is the price of this item?', score: 0.2 },
      { intentId: 'b', example: 'Hello', score: 0.5 }
    ];
    const ranked = reRank(text, candidates, { normalizeWeight: 1, existingWeight: 0.2 });
    expect(ranked[0].intentId).toBe('a');
  });

  it('should favor existing high score when examples are not similar', () => {
    const text = 'Unrelated query';
    const candidates = [
      { intentId: 'a', example: 'Some example', score: 0.4 },
      { intentId: 'b', example: 'Another example', score: 0.9 }
    ];
    const ranked = reRank(text, candidates, { normalizeWeight: 1, existingWeight: 0.8 });
    expect(ranked[0].intentId).toBe('b');
  });
});