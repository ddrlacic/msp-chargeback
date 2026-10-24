import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { ChargebackDocument } from '../../../../services/chargeback/chargeback.types';
import { formatFileSize } from '../../../../shared/utils/file.utils';
import { formatMoney } from '../../../../shared/utils/money.utils';
import {
  CHALLENGE_REASON_COPY,
  CHARGEBACK_DOCUMENT_TYPE_LABELS,
  CHARGEBACKS_CONSTANTS,
} from '../../chargebacks.constants';
import { DocumentChipComponent } from '../../shared/document-chip/document-chip.component';
import { ChargebackRespondFlow } from '../chargeback-respond.flow';
import { RespondStep } from '../chargeback-respond.utils';

type SectionKey = 'reason' | 'amount' | 'documents' | 'note';

@Component({
  selector: 'app-respond-submit-step',
  imports: [DocumentChipComponent, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './respond-submit-step.component.html',
  host: { class: 'flex flex-col gap-6' },
})
export class RespondSubmitStepComponent {
  private readonly flow = inject(ChargebackRespondFlow);

  readonly edit = output<RespondStep>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.RESPOND.SUBMIT;

  protected readonly sections = computed(() => {
    const flow = this.flow;
    const currency = flow.currency();
    const reason = flow.reason();
    const amount = flow.challengedAmount() ?? flow.fullAmount();
    const note = flow.note().trim();
    const formatted = formatMoney(amount, currency);
    const full = formatMoney(flow.fullAmount(), currency);
    const sections: {
      key: SectionKey;
      title: string;
      step: RespondStep;
      value?: string;
    }[] = [
      {
        key: 'reason',
        title: this.copy.REASON,
        step: 'reason',
        value: reason ? CHALLENGE_REASON_COPY[reason].label : undefined,
      },
      {
        key: 'amount',
        title: this.copy.AMOUNT,
        step: 'reason',
        value: amount === flow.fullAmount() ? formatted : this.copy.AMOUNT_PARTIAL(formatted, full),
      },
      { key: 'documents', title: this.copy.DOCUMENTS, step: 'evidence' },
    ];
    if (note) {
      sections.push({ key: 'note', title: this.copy.NOTE, step: 'evidence', value: note });
    }
    return sections.map((section) => ({
      ...section,
      editLabel: this.copy.EDIT_LABEL(section.title),
    }));
  });

  protected readonly files = computed(() =>
    this.flow.documents().map((document) => this.toFile(document)),
  );

  protected readonly next = computed(() => {
    if (this.flow.mode() === 'pre-arbitration') {
      return this.copy.NEXT_PRE_ARBITRATION;
    }
    const credit = this.flow.chargeback()?.network !== 'visa';
    return credit
      ? this.copy.NEXT_CREDIT(formatMoney(this.flow.challengedAmount() ?? 0, this.flow.currency()))
      : this.copy.NEXT_NO_CREDIT;
  });

  protected readonly warning = computed(() => {
    if (this.flow.blocked()) {
      return this.copy.BLOCKED;
    }
    return this.flow.scanning() ? this.copy.SCANNING : undefined;
  });

  protected preview(document: ChargebackDocument): void {
    this.flow.preview(document);
  }

  private toFile(document: ChargebackDocument) {
    return {
      document,
      details: `${CHARGEBACK_DOCUMENT_TYPE_LABELS[document.type]} · ${formatFileSize(document.sizeBytes)}`,
    };
  }
}
