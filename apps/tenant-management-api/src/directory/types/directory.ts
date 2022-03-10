export interface Service {
  service: string;
  api?: string;
  host: string;
}
export interface Directory {
  id?: string;
  name: string;
  services: Service[];
}

export interface Criteria {
  name: { $regex: string; $options: 'i' };
}
