export interface ContactDTO {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  companyId?: string;
}
