import styled from 'styled-components';

export const SelectCalendarHeader = styled.div`
  margin-bottom: var(--goa-spacing-m);
  margin-top: var(--goa-spacing-m);
  font-weight: var(--fw-bold);
`;

export const TitleSpace = styled.div`
  height: var(--goa-spacing-m);
`;

export const EventDetail = styled.div`
  background: #f3f3f3;
  white-space: pre-wrap;
  font-family: monospace;
  font-size: var(--goa-font-size-1);
  line-height: var(--goa-spacing-m);
  text-align: left;
  padding: var(--goa-spacing-m);
`;

export const EventDetailRow = styled.tr`
  background: #f3f3f3 !important;
  .event-name: {
    font-size: var(--goa-font-size-7);
  }
`;

export const ProgressWrapper = styled.div`
  margin-left: 30%;
`;

export const EventDetailTd = styled.td`
  padding-top: var(--goa-spacing-l) !important;
  padding-right: var(--goa-spacing-l) !important;
  padding-bottom: calc(var(--goa-spacing-l) - 10px)) !important;
  padding-left: var(--goa-spacing-l) !important;
`;

export const EventDetailName = styled.div`
  font-size: var(--goa-font-size-4);
  padding-bottom: 0.875rem;
`;

export const EventDetailDescription = styled.div`
  color: var(--goa-color-greyscale-700);
  padding-bottom: calc(var(--goa-spacing-m) - 10px);
  font-size: var(--goa-font-size-3);
  line-height: var(--var);
`;

export const EventDetailDate = styled.div`
  font-size: var(--goa-font-size-4);
  color: var(--goa-color-greyscale-700);
  padding-bottom: var(--goa-spacing-m);
`;

export const CalendarEventListWrapper = styled.div`
  margin-bottom: var(--goa-spacing-l);
`;

export const EventListNameTd = styled.td`
  width: 10%;
`;
