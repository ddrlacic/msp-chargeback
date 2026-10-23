import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { CHARGEBACKS_PATH } from '../../../layout/app-sidebar/sidebar.constants';
import { PageBreadcrumb, PageComponent } from '../../../layout/page/page.component';
import { ButtonDirective } from '../../../shared/components/button/button.directive';
import { formatDate } from '../../../shared/utils/date.utils';
import { CHARGEBACKS_CONSTANTS } from '../chargebacks.constants';
import { ChargebackRespondFlow } from './chargeback-respond.flow';
import { ConfirmsLeave } from './chargeback-respond.guard';
import { RESPOND_STEPS, RespondStep } from './chargeback-respond.utils';
import { RespondEvidenceStepComponent } from './respond-evidence-step/respond-evidence-step.component';
import {
  LeaveChoice,
  RespondLeaveDialogComponent,
} from './respond-leave-dialog/respond-leave-dialog.component';
import { RespondReasonStepComponent } from './respond-reason-step/respond-reason-step.component';
import { RespondReviewStepComponent } from './respond-review-step/respond-review-step.component';
import { RespondStepperComponent } from './respond-stepper/respond-stepper.component';
import { RespondSubmitStepComponent } from './respond-submit-step/respond-submit-step.component';

let nextRespondId = 0;

@Component({
  selector: 'app-chargeback-respond',
  imports: [
    ButtonDirective,
    LucideAngularModule,
    PageComponent,
    RespondEvidenceStepComponent,
    RespondLeaveDialogComponent,
    RespondReasonStepComponent,
    RespondReviewStepComponent,
    RespondStepperComponent,
    RespondSubmitStepComponent,
  ],
  providers: [ChargebackRespondFlow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chargeback-respond.component.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class ChargebackRespondComponent implements OnInit, ConfirmsLeave {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly heading = viewChild<ElementRef<HTMLElement>>('heading');
  private resolveLeave?: (leave: boolean) => void;

  protected readonly flow = inject(ChargebackRespondFlow);

  readonly caseId = input.required<string>();

  protected readonly copy = CHARGEBACKS_CONSTANTS.RESPOND;
  protected readonly headingId = `respond-heading-${nextRespondId++}`;

  protected readonly chargeback = this.flow.chargeback;
  protected readonly title = computed(() => this.copy.TITLE[this.flow.mode()]);
  protected readonly stepTitle = computed(() => this.copy.STEPS[this.flow.step()]);
  protected readonly casePath = computed(() => [CHARGEBACKS_PATH, this.caseId()]);

  protected readonly breadcrumbs = computed<readonly PageBreadcrumb[]>(() => [
    { label: CHARGEBACKS_CONSTANTS.CASE.BREADCRUMB, link: CHARGEBACKS_PATH },
    { label: this.caseId(), link: `${CHARGEBACKS_PATH}/${this.caseId()}` },
    { label: this.title() },
  ]);

  protected readonly reachable = computed(() =>
    RESPOND_STEPS.filter((step) => this.flow.canOpen(step)),
  );

  protected readonly note = computed(() => {
    const note = this.flow.incomingNote();
    if (!note) {
      return undefined;
    }
    const fromBank = note.from === 'cardholder-bank';
    const date = this.chargeback()?.replyByDate;
    return {
      title: fromBank ? this.copy.NOTE.BANK_TITLE : this.copy.NOTE.TITLE,
      text: note.text,
      deadline: date
        ? (fromBank ? this.copy.NOTE.BANK_DEADLINE : this.copy.NOTE.DEADLINE)(formatDate(date))
        : undefined,
    };
  });

  protected readonly canSaveDraft = computed(() => this.flow.mode() !== 'resubmit');
  protected readonly leaveOpen = signal(false);

  ngOnInit(): void {
    this.flow.init(this.caseId());
  }

  confirmLeave(): boolean | Promise<boolean> {
    if (this.flow.tryLeave()) {
      return true;
    }
    this.resolveLeave?.(false);
    this.leaveOpen.set(true);
    return new Promise((resolve) => (this.resolveLeave = resolve));
  }

  protected onLeave(choice: LeaveChoice): void {
    if (choice === 'save') {
      this.flow.saveAndExit();
    } else if (choice === 'discard') {
      this.flow.discard();
    }
    this.leaveOpen.set(false);
    this.resolveLeave?.(choice !== 'stay');
    this.resolveLeave = undefined;
  }

  protected onNext(): void {
    if (this.flow.next()) {
      this.focusHeading();
    }
  }

  protected onBack(): void {
    if (this.flow.back()) {
      this.focusHeading();
    }
  }

  protected onSelect(step: RespondStep): void {
    if (this.flow.goTo(step)) {
      this.focusHeading();
    }
  }

  protected onExit(): void {
    if (this.canSaveDraft()) {
      this.flow.saveAndExit();
    }
    void this.router.navigate(this.casePath());
  }

  protected onSubmit(): void {
    if (this.flow.submit()) {
      void this.router.navigate(this.casePath());
    }
  }

  private focusHeading(): void {
    afterNextRender(() => this.heading()?.nativeElement.focus({ preventScroll: false }), {
      injector: this.injector,
    });
  }
}
