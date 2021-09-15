export type NoticeModeType = 'draft' | 'active' | 'archived';
export function isValidNoticeModeType(mode: NoticeModeType): boolean {
  switch (mode) {
    case 'draft':
    case 'active':
    case 'archived':
      return true;
    default:
      return false;
  }
}

export interface NoticeApplication {
  id: string;
  message: string;
  tennantServRef: string;
  startDate: Date;
  endDate: Date;
  mode: NoticeModeType;
  created: Date;
  tenantId: string;
}
export * from './serviceStatus';
export * from './endpointStatusEntry';
export * from './roles';
