import { describe, it, expect } from 'vitest';
import { findNextAvailableSlot, findConflictingAppointments } from '../services/availability';

import type { Appointment, AvailabilityWindow } from '../types';
import { AppointmentStatus } from '../types';

describe('Availability POC', () => {
  it('finds a free slot before an existing appointment', () => {
    const availability: AvailabilityWindow[] = [
      {
        start: '2025-12-26T09:00:00.000Z',
        end: '2025-12-26T17:00:00.000Z',
        professionalId: 'p1'
      }
    ];

    const appointments: Appointment[] = [
      {
        id: 'a1',
        professionalId: 'p1',
        start: '2025-12-26T10:00:00.000Z',
        end: '2025-12-26T11:00:00.000Z',
        status: AppointmentStatus.CONFIRMED
      }
    ];

    const slot = findNextAvailableSlot(availability, appointments as Appointment[], 60, '2025-12-26T09:00:00.000Z');
    expect(slot).not.toBeNull();
    expect(slot?.start).toBe('2025-12-26T09:00:00.000Z');
    expect(slot?.end).toBe('2025-12-26T10:00:00.000Z');
  });

  it('detects conflicting appointments', () => {
    const candidate: Appointment = {
      id: 'c1',
      professionalId: 'p1',
      start: '2025-12-26T10:30:00.000Z',
      end: '2025-12-26T11:30:00.000Z'
    } as Appointment;

    const existing: Appointment[] = [
      {
        id: 'a1',
        professionalId: 'p1',
        start: '2025-12-26T10:00:00.000Z',
        end: '2025-12-26T11:00:00.000Z',
        status: AppointmentStatus.CONFIRMED
      }
    ];

    const conflicts = findConflictingAppointments(candidate, existing as Appointment[]);
    expect(conflicts.length).toBeGreaterThan(0);
  });
});
