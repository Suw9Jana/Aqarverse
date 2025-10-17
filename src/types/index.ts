export type UserRole = 'company' | 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  licenseNumber?: string;
}

export interface Company {
  id: string;
  name: string;
  city: string;
  logo: string;
}

export type PropertyStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Property {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  type: string;
  location: string;
  description: string;
  modelFile?: File | string;
  status: PropertyStatus;
  rejectionReason?: string;
  createdAt: Date;
  submittedAt?: Date;
}
