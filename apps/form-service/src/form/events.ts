import { DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { FormEntity } from './model';

export const FORM_CREATED = 'form-created';
export const FORM_DELETED = 'form-deleted';

export const FORM_LOCKED = 'form-locked';
export const FORM_UNLOCKED = 'form-unlocked';
export const FORM_SUBMITTED = 'form-submitted';

const userInfoSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
  },
};

const formSchema = {
  type: 'object',
  properties: {
    definition: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
    id: { type: 'string' },
    status: { type: 'string' },
    created: { type: 'string', format: 'date-time' },
    locked: { type: 'string', format: 'date-time' },
    submitted: { type: 'string', format: 'date-time' },
    lastAccessed: { type: 'string', format: 'date-time' },
  },
};

export const FormCreatedDefinition: DomainEventDefinition = {
  name: FORM_CREATED,
  description: 'Signalled when a form is created.',
  payloadSchema: {
    form: formSchema,
    createdBy: userInfoSchema,
  },
};

export const FormDeletedDefinition: DomainEventDefinition = {
  name: FORM_DELETED,
  description: 'Signalled when a form is deleted.',
  payloadSchema: {
    id: { type: 'string' },
    deletedBy: userInfoSchema,
  },
};

export const FormStatusLockedDefinition: DomainEventDefinition = {
  name: FORM_LOCKED,
  description: 'Signalled when a draft form is locked because it has not been accessed.',
  payloadSchema: {
    form: formSchema,
    lockedBy: userInfoSchema,
  },
};

export const FormStatusUnlockedDefinition: DomainEventDefinition = {
  name: FORM_UNLOCKED,
  description: 'Signalled when a draft form is unlocked by an administrator.',
  payloadSchema: {
    form: formSchema,
    unlockedBy: userInfoSchema,
  },
};

export const FormStatusSubmittedDefinition: DomainEventDefinition = {
  name: FORM_SUBMITTED,
  description: 'Signalled when a form is submitted.',
  payloadSchema: {
    form: formSchema,
    submittedBy: userInfoSchema,
  },
};

function mapForm(entity: FormEntity) {
  return {
    definition: {
      id: entity.definition.id,
      name: entity.definition.name,
    },
    id: entity.id,
    status: entity.status,
    created: entity.created,
    locked: entity.locked,
    submitted: entity.submitted,
    lastAccessed: entity.lastAccessed,
  };
}

export const formCreated = (user: User, form: FormEntity): DomainEvent => ({
  name: FORM_CREATED,
  timestamp: form.created,
  tenantId: form.tenantId,
  correlationId: form.id,
  context: {
    definitionId: form.definition.id,
  },
  payload: {
    form: mapForm(form),
    createdBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const formDeleted = (user: User, form: FormEntity): DomainEvent => ({
  name: FORM_DELETED,
  timestamp: new Date(),
  tenantId: form.tenantId,
  correlationId: form.id,
  context: {
    definitionId: form.definition.id,
  },
  payload: {
    id: form.id,
    deletedBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const formLocked = (user: User, form: FormEntity): DomainEvent => ({
  name: FORM_LOCKED,
  timestamp: form.locked,
  tenantId: form.tenantId,
  correlationId: form.id,
  context: {
    definitionId: form.definition.id,
  },
  payload: {
    form: mapForm(form),
    lockedBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const formUnlocked = (user: User, form: FormEntity): DomainEvent => ({
  name: FORM_UNLOCKED,
  timestamp: new Date(),
  tenantId: form.tenantId,
  correlationId: form.id,
  context: {
    definitionId: form.definition.id,
  },
  payload: {
    form: mapForm(form),
    unlockedBy: {
      id: user.id,
      name: user.name,
    },
  },
});

export const formSubmitted = (user: User, form: FormEntity): DomainEvent => ({
  name: FORM_SUBMITTED,
  timestamp: form.submitted,
  tenantId: form.tenantId,
  correlationId: form.id,
  context: {
    definitionId: form.definition.id,
  },
  payload: {
    form: mapForm(form),
    submittedBy: {
      id: user.id,
      name: user.name,
    },
  },
});
