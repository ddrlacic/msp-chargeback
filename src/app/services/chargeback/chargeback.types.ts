export const CHARGEBACK_STATUSES = [
  'action-required',
  'evidence-required',
  'returned-by-worldpay',
  'response-submitted',
  'under-review',
  'pre-arbitration',
  'pre-arbitration-response-required',
  'decision-needed',
  'arbitration',
  'won',
  'partially-won',
  'dispute-withdrawn',
  'lost',
  'accepted',
  'deadline-missed',
] as const;

export type ChargebackStatus = (typeof CHARGEBACK_STATUSES)[number];

export const CHARGEBACK_COLOR_STATES = ['needs-action', 'in-review', 'won', 'lost'] as const;

export type ChargebackColorState = (typeof CHARGEBACK_COLOR_STATES)[number];

export const CARD_NETWORKS = ['visa', 'mastercard', 'amex', 'discover'] as const;

export type CardNetwork = (typeof CARD_NETWORKS)[number];

export type ChargebackCycle = 'first-chargeback' | 'pre-arbitration' | 'arbitration';

export type ChargebackAction =
  | 'accept'
  | 'challenge'
  | 'continue-challenge'
  | 'resubmit'
  | 'respond-pre-arbitration'
  | 'request-arbitration';

export type ChargebackDocumentType =
  | 'transaction-receipt'
  | 'invoice'
  | 'delivery-proof'
  | 'customer-communication'
  | 'refund-proof'
  | 'authorization-proof'
  | 'terms-and-conditions'
  | 'other';

export type ChargebackDocumentSecurityStatus = 'scanning' | 'clean' | 'rejected' | 'upload-failed';

export interface ChargebackDocument {
  readonly id: string;
  readonly name: string;
  readonly type: ChargebackDocumentType;
  readonly sizeBytes: number;
  readonly securityStatus: ChargebackDocumentSecurityStatus;
  readonly uploadedBy: string;
  readonly createdDateTime: string;
}

export type TimelineActor = 'cardholder-bank' | 'card-network' | 'worldpay' | 'merchant';

export interface TimelineEvent {
  readonly id: string;
  readonly occurredAt: string;
  readonly cycle: ChargebackCycle;
  readonly actor: TimelineActor;
  readonly title: string;
  readonly worldpayTerm?: string;
  readonly description?: string;
  readonly amountChange?: number;
  readonly documentIds?: readonly string[];
}

export const CHALLENGE_REASONS = [
  'credit-issued',
  'cardholder-withdrew',
  'invalid-dispute',
  'proof-of-purchase',
] as const;

export type ChallengeReason = (typeof CHALLENGE_REASONS)[number];

export interface ChallengeDraft {
  readonly savedAt: string;
  readonly reason?: ChallengeReason;
  readonly challengedAmount?: number;
  readonly documentIds: readonly string[];
  readonly note?: string;
}

export interface ChargebackCase {
  readonly caseId: string;
  readonly status: ChargebackStatus;
  readonly cycle: ChargebackCycle;
  readonly allowedActions: readonly ChargebackAction[];
  readonly network: CardNetwork;
  readonly cardLastFour: string;
  readonly reasonCode: string;
  readonly reasonDescription: string;
  readonly merchantId: string;
  readonly legalEntityName: string;
  readonly dbaName: string;
  readonly conceptName: string;
  readonly locationName: string;
  readonly transactionId: string;
  readonly orderReference: string;
  readonly transactionDate: string;
  readonly transactionAmount: number;
  readonly chargebackDate: string;
  readonly chargebackAmount: number;
  readonly currency: string;
  readonly replyByDate?: string;
  readonly challengedAmount?: number;
  readonly challengeReason?: ChallengeReason;
  readonly challengeNote?: string;
  readonly amountDebited: number;
  readonly amountCredited: number;
  readonly documents: readonly ChargebackDocument[];
  readonly timeline: readonly TimelineEvent[];
  readonly draft?: ChallengeDraft;
  readonly worldpayNote?: string;
}

export interface ChargebackMoneySummary {
  readonly currency: string;
  readonly chargebackAmount: number;
  readonly challengedAmount: number;
  readonly amountDebited: number;
  readonly amountCredited: number;
  readonly netAmount: number;
}
