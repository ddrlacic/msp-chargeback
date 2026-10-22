import { FIXTURE_BRAND } from '../../services/chargeback/chargeback.fixtures';

export const HEADER_COPY = {
  LOGO_ALT: 'PAR',
  PRODUCT_NAME: 'Payment Services',
  OPEN_MENU: 'Open menu',
  CLOSE_MENU: 'Close menu',
  NOTIFICATIONS: 'Notifications',
  NO_NOTIFICATIONS: 'No new notifications',
  USER_MENU: 'Your account',
  USER_NAME: FIXTURE_BRAND.userName,
  USER_EMAIL: FIXTURE_BRAND.userEmail,
  PROFILE: 'Profile',
  SIGN_OUT: 'Sign out',
} as const;
