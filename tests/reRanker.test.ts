import { describe, it, expect } from 'vitest';
import { reRank } from '../services/reRanker.js';

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
});