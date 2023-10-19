import { ActionState } from '@store/session/models';

export const EventDeleteModalType = 'calendar-event-delete-model';
export const EventAddEditModalType = 'calendar-event-add-edit-modal';
export interface CalendarItem {
  name: string;
  displayName?: string;
  description?: string;
  readRoles: string[];
  updateRoles: string[];
  selectedCalendarEvents?: CalendarEvent[];
  nextEvents?: string;
}

export const getDefaultSearchCriteria = (): CalendarEventSearchCriteria => {
  const start = new Date();
  start.setHours(24, 0, 0, 0);
  const end = new Date();
  end.setHours(24, 0, 0, 0);

  return {
    // using absolute unit time will be more intuitive than using setDate;
    startDate: new Date(start.valueOf() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: end.toISOString(),
  };
};

export type CalendarObjectType = Record<string, CalendarItem>;

export interface CalendarService {
  calendars: CalendarObjectType;
  indicator?: Indicator;
  eventSearchCriteria?: CalendarEventSearchCriteria;
}

export const defaultCalendar: CalendarItem = {
  name: '',
  displayName: '',
  description: '',
  readRoles: [],
  updateRoles: [],
};
export const CALENDAR_INIT: CalendarService = {
  calendars: null,
  indicator: {
    details: {},
  },
  eventSearchCriteria: getDefaultSearchCriteria(),
};
export interface Indicator {
  details?: Record<string, ActionState>;
}

export interface Attendee {
  id: number;
  name: string;
  email: string;
}

export interface CalendarEvent {
  id?: number;
  name: string;
  description: string;
  start: string;
  end: string;
  isPublic: boolean;
  isAllDay?: boolean;
  attendees?: Attendee[];
}

export const CalendarEventDefault = {
  id: null,
  name: '',
  description: '',
  start: new Date().toISOString(),
  end: new Date().toISOString(),
  isPublic: false,
  isAllDay: false,
};

export interface CalendarEventSearchCriteria {
  startDate: string;
  endDate: string;
  calendarName?: string;
}
