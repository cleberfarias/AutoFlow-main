/**
 * Google Calendar MCP Integration
 * 
 * Gerenciamento de eventos e disponibilidade
 * Docs: https://developers.google.com/calendar/api
 */

export interface GoogleCalendarConfig {
  accessToken: string;
  refreshToken?: string;
  calendarId?: string; // Default: 'primary'
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink: string;
  conferenceData?: {
    conferenceId: string;
    conferenceSolution: {
      name: string;
    };
    entryPoints: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
}

export interface FreeBusySlot {
  start: string;
  end: string;
}

export interface FreeBusyResponse {
  calendars: {
    [calendarId: string]: {
      busy: FreeBusySlot[];
    };
  };
}

export class GoogleCalendarMCP {
  private config: GoogleCalendarConfig;
  private baseUrl = 'https://www.googleapis.com/calendar/v3';

  constructor(config: GoogleCalendarConfig) {
    this.config = {
      ...config,
      calendarId: config.calendarId || 'primary'
    };
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google Calendar API Error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  // ========================================
  // EVENTOS
  // ========================================

  /**
   * Cria evento
   */
  async createEvent(event: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
    conferenceData?: {
      createRequest: {
        requestId: string;
        conferenceSolutionKey: { type: 'hangoutsMeet' };
      };
    };
  }): Promise<CalendarEvent> {
    return this.request(`/calendars/${this.config.calendarId}/events?conferenceDataVersion=1`, {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }

  /**
   * Lista eventos
   */
  async listEvents(params?: {
    timeMin?: string; // RFC3339 timestamp
    timeMax?: string; // RFC3339 timestamp
    maxResults?: number;
    orderBy?: 'startTime' | 'updated';
    q?: string; // Busca por texto
  }): Promise<{ items: CalendarEvent[] }> {
    const query = new URLSearchParams({
      singleEvents: 'true',
      ...(params as any)
    }).toString();
    
    return this.request(`/calendars/${this.config.calendarId}/events?${query}`);
  }

  /**
   * Busca evento específico
   */
  async getEvent(eventId: string): Promise<CalendarEvent> {
    return this.request(`/calendars/${this.config.calendarId}/events/${eventId}`);
  }

  /**
   * Atualiza evento
   */
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return this.request(`/calendars/${this.config.calendarId}/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Deleta evento
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.request(`/calendars/${this.config.calendarId}/events/${eventId}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // DISPONIBILIDADE
  // ========================================

  /**
   * Verifica horários livres/ocupados
   */
  async checkAvailability(params: {
    timeMin: string; // RFC3339
    timeMax: string; // RFC3339
    calendars?: string[]; // Default: [this.config.calendarId]
  }): Promise<FreeBusyResponse> {
    const calendars = params.calendars || [this.config.calendarId!];
    
    return this.request('/freeBusy', {
      method: 'POST',
      body: JSON.stringify({
        timeMin: params.timeMin,
        timeMax: params.timeMax,
        items: calendars.map(id => ({ id }))
      })
    });
  }

  /**
   * Encontra próximo horário disponível
   */
  async findNextAvailableSlot(params: {
    durationMinutes: number;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    workingHours?: { start: string; end: string }; // Ex: { start: '09:00', end: '18:00' }
  }): Promise<{ start: string; end: string } | null> {
    const workingHours = params.workingHours || { start: '09:00', end: '18:00' };
    
    // Busca disponibilidade no período
    const freeBusy = await this.checkAvailability({
      timeMin: `${params.startDate}T00:00:00Z`,
      timeMax: `${params.endDate}T23:59:59Z`
    });

    const busySlots = freeBusy.calendars[this.config.calendarId!]?.busy || [];
    
    // Encontra primeiro slot livre com a duração necessária
    const startTime = new Date(`${params.startDate}T${workingHours.start}:00`);
    const endTime = new Date(`${params.endDate}T${workingHours.end}:00`);
    
    let currentTime = startTime;
    const durationMs = params.durationMinutes * 60 * 1000;
    
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + durationMs);
      
      // Verifica se o slot está livre
      const isBusy = busySlots.some(busy => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return (currentTime >= busyStart && currentTime < busyEnd) ||
               (slotEnd > busyStart && slotEnd <= busyEnd);
      });
      
      if (!isBusy) {
        return {
          start: currentTime.toISOString(),
          end: slotEnd.toISOString()
        };
      }
      
      // Avança 15 minutos
      currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
    }
    
    return null;
  }

  // ========================================
  // MEET INTEGRATION
  // ========================================

  /**
   * Cria evento com Google Meet
   */
  async createMeetingWithMeet(params: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
  }): Promise<CalendarEvent> {
    const requestId = Math.random().toString(36).substring(7);
    
    return this.createEvent({
      ...params,
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    });
  }

  // ========================================
  // CALENDÁRIOS
  // ========================================

  /**
   * Lista calendários do usuário
   */
  async listCalendars(): Promise<{ items: any[] }> {
    return this.request('/users/me/calendarList');
  }

  /**
   * Busca calendário por nome
   */
  async findCalendarByName(name: string): Promise<any | null> {
    const calendars = await this.listCalendars();
    return calendars.items.find(cal => cal.summary === name) || null;
  }

  // ========================================
  // OAUTH REFRESH
  // ========================================

  /**
   * Atualiza access token usando refresh token
   */
  static async refreshAccessToken(params: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: params.clientId,
        client_secret: params.clientSecret,
        refresh_token: params.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    return response.json();
  }
}

// Exemplo de uso:
/*
const calendar = new GoogleCalendarMCP({
  accessToken: 'ya29.xxxxx',
  refreshToken: '1//xxxxx',
  calendarId: 'primary'
});

// Criar evento com Google Meet
const meeting = await calendar.createMeetingWithMeet({
  summary: 'Reunião com Cliente',
  description: 'Discussão sobre projeto',
  start: {
    dateTime: '2024-02-15T10:00:00-03:00',
    timeZone: 'America/Sao_Paulo'
  },
  end: {
    dateTime: '2024-02-15T11:00:00-03:00',
    timeZone: 'America/Sao_Paulo'
  },
  attendees: [
    { email: 'cliente@example.com' }
  ]
});

console.log('Meet Link:', meeting.conferenceData?.entryPoints[0].uri);

// Verificar disponibilidade
const availability = await calendar.checkAvailability({
  timeMin: '2024-02-15T00:00:00Z',
  timeMax: '2024-02-15T23:59:59Z'
});

// Encontrar próximo horário livre de 1h
const nextSlot = await calendar.findNextAvailableSlot({
  durationMinutes: 60,
  startDate: '2024-02-15',
  endDate: '2024-02-20',
  workingHours: { start: '09:00', end: '18:00' }
});
*/
