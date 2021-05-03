export interface FileTypeItem {
  name: string;
  updateRoles: string[];
  readRoles: string[];
  anonymousRead: boolean;
  tableData: {
    id: string;
  };
  id: string;
}

export interface FileItem {
  id: string;
  filename: string;
  size: number;
  fileURN: string;
  typeName?: string;
  recordId?: string;
  created?: string;
  lastAccessed?: string;
}

export interface FileService {
  status: {
    isActive: boolean;
    isDisabled: boolean;
  };
  requirements: {
    setup: boolean;
  };
  fileList: Array<FileItem>;
  states: {
    activeTab: string;
  };
  space: string;
  fileTypes: Array<FileTypeItem>;
}

export const FILE_INIT: FileService = {
  status: {
    isActive: false,
    isDisabled: true,
  },
  requirements: {
    setup: false,
  },
  states: {
    activeTab: 'overall-view',
  },
  fileList: [],
  space: '',
  fileTypes: [],
};
