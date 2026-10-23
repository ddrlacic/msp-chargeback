import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import {
  ChargebackAction,
  ChargebackCase,
  ChargebackColorState,
} from '../../../../services/chargeback/chargeback.types';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { CHARGEBACKS_CONSTANTS } from '../../chargebacks.constants';
import { getCaseBanner } from '../chargeback-case.utils';

interface BannerTone {
  readonly icon: string;
  readonly surface: string;
  readonly iconColor: string;
}

const TONES: Record<ChargebackColorState, BannerTone> = {
  'needs-action': {
    icon: 'circle-alert',
    surface: 'border-warning-30 bg-warning-15',
    iconColor: 'text-warning-120',
  },
  'in-review': {
    icon: 'hourglass',
    surface: 'border-info-30 bg-info-15',
    iconColor: 'text-info-120',
  },
  won: {
    icon: 'circle-check',
    surface: 'border-success-30 bg-success-15',
    iconColor: 'text-success-120',
  },
  lost: { icon: 'circle-x', surface: 'border-error-30 bg-error-15', iconColor: 'text-error-120' },
};

let nextBannerId = 0;

@Component({
  selector: 'app-case-status-banner',
  imports: [ButtonDirective, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './case-status-banner.component.html',
  host: {
    class: '@container flex flex-col gap-3',
    '[attr.data-state]': 'banner().state',
  },
})
export class CaseStatusBannerComponent {
  readonly chargeback = input.required<ChargebackCase>();
  readonly action = output<ChargebackAction>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.CASE;
  protected readonly titleId = `case-banner-${nextBannerId++}`;
  protected readonly banner = computed(() => getCaseBanner(this.chargeback()));
  protected readonly tone = computed(() => TONES[this.banner().state]);
}
