import { RESPOND_PATH } from '../../features/chargebacks/chargebacks.constants';
import { CHARGEBACKS_PATH } from '../app-sidebar/sidebar.constants';

const CASE_URL = new RegExp(`^${CHARGEBACKS_PATH}/([^/?#]+)`);
const RESPOND_URL = new RegExp(`^${CHARGEBACKS_PATH}/[^/?#]+/${RESPOND_PATH}(?:[?#]|$)`);

export function getCaseIdFromUrl(url: string): string | undefined {
  const match = CASE_URL.exec(url);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function isRespondUrl(url: string): boolean {
  return RESPOND_URL.test(url);
}
