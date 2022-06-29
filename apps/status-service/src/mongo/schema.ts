import { Schema } from 'mongoose';

export const serviceStatusEndpointSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'disabled',
      required: true,
    },
  },
  { _id: false }
);

export const endpointStatusEntrySchema = new Schema({
  ok: {
    type: Boolean,
  },
  url: {
    type: String,
    required: true,
  },
  status: {
    type: String,
  },
  applicationId: {
    type: String,
  },
  responseTime: {
    type: Number,
  },
  timestamp: {
    type: Number,
    index: true,
  },
});

export const serviceStatusApplicationSchema = new Schema(
  {
    tenantId: {
      type: String,
      required: true,
    },
    tenantRealm: {
      type: String,
      required: true,
    },
    tenantName: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    statusTimestamp: {
      type: Number,
    },
    status: {
      type: String,
    },
    enabled: {
      type: Boolean,
    },
    endpoint: serviceStatusEndpointSchema,
  },
  { timestamps: true }
);

export const noticeEndpointSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

export const noticeApplicationSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    tennantServRef: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    mode: {
      type: String,
      default: 'draft',
    },
    tenantId: {
      type: String,
      required: true,
    },
    isAllApplications: {
      type: Boolean,
      default: false,
    },
    endpoints: [noticeEndpointSchema],
    tenantName: {
      type: String,
    },
  },
  { timestamps: true }
);

export const configurationSchema = {
  type: 'object',
  properties: {
    contact: {
      type: 'object',
      properties: {
        contactEmail: { type: 'string' },
      },
    },
  },
};

noticeApplicationSchema.index({ createdAt: 1 });
