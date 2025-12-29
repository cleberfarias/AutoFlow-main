import type { Appointment, AvailabilityWindow, Service } from '../types';
import { AppointmentStatus } from '../types';
import { findNextAvailableSlot } from './availability';

export interface FindAvailabilityPayload {
  professionalId?: string;
  serviceId?: string;
  durationMinutes?: number;
  fromISO?: string;
}

export function findAvailabilityAction(
  availability: AvailabilityWindow[],
  appointments: Appointment[],
  services: Service[],
  payload: FindAvailabilityPayload
) {
  const professionalId = payload.professionalId;
  const duration = payload.durationMinutes || (payload.serviceId ? (services.find(s => s.id === payload.serviceId)?.durationMinutes || 60) : 60);
  const slot = findNextAvailableSlot(availability.filter(w => !professionalId || w.professionalId === professionalId), appointments, duration, payload.fromISO);
  if (!slot) return null;
  return { suggestedStart: slot.start, suggestedEnd: slot.end };
}

export interface CreateAppointmentPayload {
  clientId?: string;
  professionalId?: string;
  serviceId?: string;
  locationId?: string;
  start: string;
  end: string;
}

export function createAppointmentAction(appointments: Appointment[], payload: CreateAppointmentPayload) {
  const id = `a_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  const appt: Appointment = {
    id,
    clientId: payload.clientId,
    professionalId: payload.professionalId,
    serviceId: payload.serviceId,
    locationId: payload.locationId,
    start: payload.start,
    end: payload.end,
    status: AppointmentStatus.CONFIRMED,
    createdAt: new Date().toISOString()
  };
  // pure: return object; caller may persist
  return appt;
}
