export interface SidebarLink {
  readonly label: string;
  readonly path: string;
}

export interface SidebarItem {
  readonly label: string;
  readonly icon: string;
  readonly path?: string;
  readonly children?: readonly SidebarLink[];
}

export const CHARGEBACKS_PATH = '/chargebacks';

export const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  { label: 'Dashboard', icon: 'layout-dashboard', path: '/dashboard' },
  { label: 'Deposit details', icon: 'wallet', path: '/deposit-details' },
  { label: 'Sub-merchants', icon: 'users', path: '/sub-merchants' },
  { label: 'Chargebacks', icon: 'rotate-ccw', path: CHARGEBACKS_PATH },
  { label: 'Transactions', icon: 'arrow-left-right', path: '/transactions' },
  { label: 'Statements', icon: 'file-text', path: '/statements' },
  {
    label: 'Settings',
    icon: 'settings',
    children: [
      { label: 'Users', path: '/settings/users' },
      { label: 'Roles', path: '/settings/roles' },
    ],
  },
];

export const SIDEBAR_COPY = {
  NAV_LABEL: 'Main',
} as const;

export function getPlaceholderLinks(): SidebarLink[] {
  return SIDEBAR_ITEMS.flatMap((item) =>
    item.children ? [...item.children] : item.path ? [{ label: item.label, path: item.path }] : [],
  ).filter((link) => link.path !== CHARGEBACKS_PATH);
}
