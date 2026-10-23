import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { CHARGEBACKS_PATH } from '../../../layout/app-sidebar/sidebar.constants';
import { ChargebackStore } from '../../../services/chargeback/chargeback.store';
import { getRespondMode } from './chargeback-respond.utils';

export const chargebackRespondGuard: CanActivateFn = (route) => {
  const caseId = route.paramMap.get('caseId') ?? '';
  const chargeback = inject(ChargebackStore).getById(caseId);
  if (chargeback && getRespondMode(chargeback)) {
    return true;
  }
  return inject(Router).createUrlTree([CHARGEBACKS_PATH, caseId]);
};
