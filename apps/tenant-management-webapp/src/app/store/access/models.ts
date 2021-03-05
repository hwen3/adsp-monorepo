export interface User {
  id: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  email: string;
  requiredActions: string[];
  access: {
    [key: string]: boolean;
  };
}

interface Role {
  id: string;
  clientRole: boolean;
  description: string;
  name: string;
  userIds: string[];
}

export interface AccessState {
  users: User[];
  roles: Role[];
}

export const ACCESS_INIT: AccessState = {
  users: [],
  roles: []
}
