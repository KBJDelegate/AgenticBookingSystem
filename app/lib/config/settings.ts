import settingsData from '@/config/settings.json';

export interface ServiceConfig {
  id: string;
  name: string;
  duration: number;
  description?: string;
}

export interface BrandConfig {
  id: string;
  name: string;
  domain: string;
  sharedMailbox: string; // Shared mailbox calendar
  availabilityPattern: string; // Pattern to identify available slots
  services: ServiceConfig[]; // Services offered by this brand
}

export interface EmployeeConfig {
  id: string;
  name: string;
  email: string;
  primaryCalendarId: string;
  brands: string[]; // Array of brand IDs this employee works for
}

export interface Settings {
  brands: BrandConfig[];
  employees: EmployeeConfig[];
}

export function getSettings(): Settings {
  return settingsData as Settings;
}

export function getBrandById(brandId: string): BrandConfig | undefined {
  return settingsData.brands.find(b => b.id === brandId);
}

export function getEmployeeById(employeeId: string): EmployeeConfig | undefined {
  return settingsData.employees.find(e => e.id === employeeId);
}

export function getEmployeesForBrand(brandId: string): EmployeeConfig[] {
  return settingsData.employees.filter(emp => emp.brands.includes(brandId));
}

export function getServiceById(brandId: string, serviceId: string): ServiceConfig | undefined {
  const brand = getBrandById(brandId);
  if (!brand) return undefined;
  return brand.services.find(s => s.id === serviceId);
}

export function getServicesForBrand(brandId: string): ServiceConfig[] {
  const brand = getBrandById(brandId);
  return brand?.services || [];
}
