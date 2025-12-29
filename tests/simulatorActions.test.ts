import { describe, it, expect } from 'vitest';
import { findAvailabilityAction, createAppointmentAction } from '../services/simulatorActions';
import type { AvailabilityWindow, Appointment, Service } from '../types';

describe('simulatorActions', () => {
  it('findAvailabilityAction finds a slot for a professional', () => {
    const availability: AvailabilityWindow[] = [
      { professionalId: 'p1', start: '2025-12-26T09:00:00.000Z', end: '2025-12-26T17:00:00.000Z' }
    ];

    const appointments: Appointment[] = [
      { id: 'a1', professionalId: 'p1', start: '2025-12-26T10:00:00.000Z', end: '2025-12-26T11:00:00.000Z' }
    ] as Appointment[];

    const services: Service[] = [{ id: 's1', title: 'Limpeza', durationMinutes: 60 } as Service];

    const payload = { professionalId: 'p1', serviceId: 's1', fromISO: '2025-12-26T09:00:00.000Z' };
    const slot = findAvailabilityAction(availability, appointments, services, payload as any);
    expect(slot).not.toBeNull();
    expect(slot?.suggestedStart).toBe('2025-12-26T09:00:00.000Z');
  });

  it('createAppointmentAction creates appointment object', () => {
    const appt = createAppointmentAction([], { start: '2025-12-26T12:00:00.000Z', end: '2025-12-26T13:00:00.000Z', professionalId: 'p1' } as any);
    expect(appt.id).toBeTruthy();
    expect(appt.professionalId).toBe('p1');
    expect(appt.start).toBe('2025-12-26T12:00:00.000Z');
  });
});
