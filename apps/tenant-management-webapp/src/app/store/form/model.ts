export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  dataSchema: string;
  applicantRoles: string[];
  clerkRoles: string[];
  assessorRoles: string[];
  formDraftUrlTemplate: string;
  anonymousApply: boolean;
}

export const defaultFormDefinition: FormDefinition = {
  id: '',
  name: '',
  description: '',
  dataSchema: '',
  applicantRoles: [],
  clerkRoles: [],
  assessorRoles: [],
  formDraftUrlTemplate: 'http://test.com',
  anonymousApply: false,
};

export interface FormState {
  definitions: Record<string, FormDefinition>;
}

export interface UpdateFormConfig {
  operation: string;
  update: Record<string, FormDefinition>;
}

export interface DeleteFormConfig {
  operation: string;
  property: string;
}