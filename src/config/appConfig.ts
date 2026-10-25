/**
 * Centralized Project & Organization Configuration
 * Maayya Future Foods — Smart Business Manager
 *
 * Configurable metadata for Client and Software Developer.
 * Sensitive credentials, secrets, and database connection strings are NEVER exposed here.
 */

export interface OrganizationEntityConfig {
  companyName: string;
  address?: string;
  contactDetails?: string;
  officialLogo?: string;
}

export interface DeveloperEntityConfig {
  developerName: string;
  officialLogo?: string;
  supportEmail?: string;
  website?: string;
}

export interface DeploymentStackConfig {
  frontend: string;
  backend: string;
  database: string;
}

export interface OwnerEntityConfig {
  name: string;
  role: string;
}

export interface TerminalSecurityConfig {
  terminalDesk: string;
  defaultPin: string;
}

export interface AppMetadataConfig {
  productName: string;
  shortDescription: string;
  applicationType: string;
  stack: DeploymentStackConfig;
  owner: OwnerEntityConfig;
  terminalSecurity: TerminalSecurityConfig;
  client: OrganizationEntityConfig;
  developer: DeveloperEntityConfig;
}

export const APP_CONFIG: AppMetadataConfig = {
  productName: 'Maayya Future Foods — Smart Business Manager',
  shortDescription:
    'A business management application designed for billing, inventory, purchases, retail shop outstanding balances, expenses, and financial reports.',
  applicationType: 'Single-user web application',
  stack: {
    frontend: 'Vercel',
    backend: 'Render',
    database: 'Render PostgreSQL',
  },
  owner: {
    name: 'Kalai',
    role: 'Owner',
  },
  terminalSecurity: {
    terminalDesk: 'TERMINAL-01 (Main POS)',
    defaultPin: (import.meta as any).env?.VITE_OWNER_PIN || '1911',
  },
  client: {
    companyName: 'Maayya Future Foods',
    address: undefined, // Not configured until verified by owner
    contactDetails: undefined, // Not configured until verified by owner
    officialLogo: undefined, // Not configured until verified by owner
  },
  developer: {
    developerName: 'MSR Solutions',
    officialLogo: undefined, // Not configured until verified by owner
    supportEmail: undefined, // Not configured until verified by owner
    website: undefined, // Not configured until verified by owner
  },
};
