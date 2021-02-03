import { Schema } from 'mongoose';

export const serviceOptionSchema = new Schema({
  _id: {
    type: String,
    required: true
  },
  service: { 
    type: String,
    required: true,
    unique: true
  },
  version: {
    type: String
  },
  configOptions: {
    type: String
  }
});

export const tenantConfigSchema = new Schema({
  realmName: { 
    type: String,
    required: true,
    unique: true
  },
  configurationSettingsList: {
    type: String
  }
});
