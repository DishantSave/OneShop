export interface SubAccountScreenAccess {
  screenName: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SubAccountAuditTrail {
  sequence: number;
  userName: string;
  field: string;
  description: string;
  dateModified: string;
  modifiedBy: string;
}

export interface SubAccount {
  sequence: number;
  userName: string;
  accountId: string;
  subUserId: string;
  designation: string | null;
  department: string | null;
  isCustomerAccount: boolean;
  isSellerAccount: boolean;
  company: string;
  profilePicture: string | null;
  email: string;
  contact: string;
  country: string;
  isTestAccount: boolean;
  isActive: boolean;
  dateCreated: string;
  dateModified: string;
  screenAccess: SubAccountScreenAccess[];
  audit?: SubAccountAuditTrail[];
  auditTrail?: SubAccountAuditTrail[];
}

export interface ScreenDefinition {
  name: string;
  displayName: string;
  category: string;
  icon: string;
  description: string;
}

export const ALL_SUBACCOUNT_SCREENS: ScreenDefinition[] = [
  {
    name: 'Dashboard',
    displayName: 'Dashboard',
    category: 'Core',
    icon: 'pi pi-home',
    description: 'Overview metrics, quick statistics, and recent activity.'
  },
  {
    name: 'CompanyMaster',
    displayName: 'Company Master',
    category: 'Administration',
    icon: 'pi pi-building',
    description: 'Manage legal entities, tax details, and company profiles.'
  },
  {
    name: 'DivisionMaster',
    displayName: 'Store / Division Master',
    category: 'Administration',
    icon: 'pi pi-shop',
    description: 'Manage physical outlets, storefronts, and division settings.'
  },
  {
    name: 'CustomerMaster',
    displayName: 'Customer Master',
    category: 'Sales & Support',
    icon: 'pi pi-users',
    description: 'Customer directory, contact lists, and client profiles.'
  },
  {
    name: 'Items',
    displayName: 'Items & Products',
    category: 'Catalog',
    icon: 'pi pi-box',
    description: 'Product catalog, pricing, SKUs, and specifications.'
  },
  {
    name: 'Inventory',
    displayName: 'Inventory Management',
    category: 'Supply Chain',
    icon: 'pi pi-database',
    description: 'Stock levels, warehouse allocation, and batch tracking.'
  },
  {
    name: 'Orders',
    displayName: 'Orders & Sales',
    category: 'Sales & Support',
    icon: 'pi pi-shopping-cart',
    description: 'Customer orders, dispatch tracking, and fulfillment status.'
  },
  {
    name: 'Invoicing',
    displayName: 'Invoicing & Billing',
    category: 'Finance',
    icon: 'pi pi-file',
    description: 'Tax invoices, credit notes, payment receipts, and billing.'
  },
  {
    name: 'Reports',
    displayName: 'Reports & Statements',
    category: 'Analytics & Reports',
    icon: 'pi pi-chart-bar',
    description: 'Operational reports, sales summaries, and exportable statements.'
  },
  {
    name: 'Analytics',
    displayName: 'BI & Analytics',
    category: 'Analytics & Reports',
    icon: 'pi pi-chart-line',
    description: 'Business intelligence charts, trends, and executive insights.'
  },
  {
    name: 'Settings',
    displayName: 'System Settings',
    category: 'Administration',
    icon: 'pi pi-cog',
    description: 'Regional preferences, formatting, notifications, and defaults.'
  },
  {
    name: 'Integrations',
    displayName: 'API & Integrations',
    category: 'Technical',
    icon: 'pi pi-sync',
    description: 'Third-party marketplaces, webhooks, and sync connectors.'
  }
];

export interface TeamPreset {
  id: string;
  name: string;
  badge: string;
  department: string;
  description: string;
  defaultPermissions: {
    screenName: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }[];
}

export const TEAM_PRESETS: TeamPreset[] = [
  {
    id: 'sales',
    name: 'Sales Team',
    badge: 'Sales',
    department: 'Sales',
    description: 'Access to Storefront, Products, Customer contacts, and Order management.',
    defaultPermissions: [
      { screenName: 'Dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'CompanyMaster', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'DivisionMaster', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'CustomerMaster', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { screenName: 'Items', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Inventory', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Orders', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'Invoicing', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Reports', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Analytics', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Integrations', canView: false, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    id: 'bi',
    name: 'BI & Analytics Team',
    badge: 'BI / Analytics',
    department: 'BI & Analytics',
    description: 'Full access to Business Intelligence, Trend Analytics, Reports, and read-only data.',
    defaultPermissions: [
      { screenName: 'Dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'CompanyMaster', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'DivisionMaster', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'CustomerMaster', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Items', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Inventory', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Orders', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Invoicing', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Reports', canView: true, canCreate: true, canEdit: false, canDelete: false },
      { screenName: 'Analytics', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { screenName: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Integrations', canView: false, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    id: 'finance',
    name: 'Finance & Accounts',
    badge: 'Finance',
    department: 'Finance',
    description: 'Invoicing, Billing, Payment reconciliation, Financial reports, and Orders.',
    defaultPermissions: [
      { screenName: 'Dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'CompanyMaster', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'DivisionMaster', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'CustomerMaster', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Items', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Inventory', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Orders', canView: true, canCreate: false, canEdit: true, canDelete: false },
      { screenName: 'Invoicing', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'Reports', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { screenName: 'Analytics', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Integrations', canView: false, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    id: 'support',
    name: 'Customer Support',
    badge: 'Support',
    department: 'Support',
    description: 'Customer contact management, order lookups, tracking, and issue resolution.',
    defaultPermissions: [
      { screenName: 'Dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'CompanyMaster', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'DivisionMaster', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'CustomerMaster', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { screenName: 'Items', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Inventory', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Orders', canView: true, canCreate: false, canEdit: true, canDelete: false },
      { screenName: 'Invoicing', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Reports', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Analytics', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Integrations', canView: false, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    id: 'warehouse',
    name: 'Warehouse & Logistics',
    badge: 'Warehouse',
    department: 'Warehouse',
    description: 'Inventory levels, stock dispatch, warehouse management, and item catalogs.',
    defaultPermissions: [
      { screenName: 'Dashboard', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'CompanyMaster', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'DivisionMaster', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'CustomerMaster', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Items', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { screenName: 'Inventory', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'Orders', canView: true, canCreate: false, canEdit: true, canDelete: false },
      { screenName: 'Invoicing', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Reports', canView: true, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Analytics', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Settings', canView: false, canCreate: false, canEdit: false, canDelete: false },
      { screenName: 'Integrations', canView: false, canCreate: false, canEdit: false, canDelete: false }
    ]
  },
  {
    id: 'operations',
    name: 'Operations Manager',
    badge: 'Operations',
    department: 'Operations',
    description: 'Comprehensive operational access across all catalog, orders, inventory, and masters.',
    defaultPermissions: [
      { screenName: 'Dashboard', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'CompanyMaster', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { screenName: 'DivisionMaster', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { screenName: 'CustomerMaster', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'Items', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'Inventory', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'Orders', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'Invoicing', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'Reports', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'Analytics', canView: true, canCreate: true, canEdit: true, canDelete: true },
      { screenName: 'Settings', canView: true, canCreate: true, canEdit: true, canDelete: false },
      { screenName: 'Integrations', canView: true, canCreate: true, canEdit: true, canDelete: false }
    ]
  }
];
