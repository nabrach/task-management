export interface IOrganization {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateOrganization {
  name: string;
  description?: string;
}

export interface IUpdateOrganization {
  name?: string;
  description?: string;
}
