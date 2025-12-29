import { Appointment, AppointmentStatus, AvailabilityWindow } from '../types';

function toDate(s: string) {
  return new Date(s);
}

function rangesOverlap(startA: string, endA: string, startB: string, endB: string) {
  const a0 = toDate(startA).getTime();
  const a1 = toDate(endA).getTime();
  const b0 = toDate(startB).getTime();
  const b1 = toDate(endB).getTime();
  return Math.max(a0, b0) < Math.min(a1, b1);
}

/**
 * Retorna as appointments que conflitam com o candidato (mesmo profissional e sobreposição de tempo)
 */
export function findConflictingAppointments(candidate: Appointment, appointments: Appointment[]) {
  return appointments.filter(a =>
    a.professionalId === candidate.professionalId &&
    a.status !== AppointmentStatus.CANCELLED &&
    rangesOverlap(a.start, a.end, candidate.start, candidate.end)
  );
}

/**
 * Busca a primeira janela disponível considerando as janelas de disponibilidade e os agendamentos existentes.
 * A abordagem é simples: percorre janelas, tenta encaixar o serviço a partir do início da janela.
 */
export function findNextAvailableSlot(
  availability: AvailabilityWindow[],
  appointments: Appointment[],
  durationMinutes: number,
  fromISO?: string
) {
  const fromTs = fromISO ? toDate(fromISO).getTime() : Date.now();
  const durationMs = durationMinutes * 60 * 1000;

  const windows = availability
    .map(w => ({ ...w, startTs: toDate(w.start).getTime(), endTs: toDate(w.end).getTime() }))
    .filter(w => w.endTs > fromTs)
    .sort((a, b) => a.startTs - b.startTs);

  for (const w of windows) {
    let candidateStart = Math.max(w.startTs, fromTs);
    while (candidateStart + durationMs <= w.endTs) {
      const candidateEnd = candidateStart + durationMs;
      const candidateStartISO = new Date(candidateStart).toISOString();
      const candidateEndISO = new Date(candidateEnd).toISOString();

      const conflict = appointments.some(a =>
        a.professionalId === w.professionalId &&
        a.status !== AppointmentStatus.CANCELLED &&
        rangesOverlap(a.start, a.end, candidateStartISO, candidateEndISO)
      );

      if (!conflict) {
        return { start: candidateStartISO, end: candidateEndISO };
      }

      // pular para o fim do próximo agendamento conflituoso ou avançar por passo mínimo (ex: 5min)
      const nextConflictEnd = Math.min(
        ...appointments
          .filter(a => a.professionalId === w.professionalId && rangesOverlap(a.start, a.end, candidateStartISO, candidateEndISO))
          .map(a => toDate(a.end).getTime())
      );

      const step = nextConflictEnd ? Math.max(nextConflictEnd, candidateStart + 5 * 60 * 1000) : candidateStart + 5 * 60 * 1000;
      candidateStart = step;
    }
  }

  return null;
}
