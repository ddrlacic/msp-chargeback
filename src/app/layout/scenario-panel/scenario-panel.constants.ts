import { ScenarioEvent } from '../../services/chargeback/chargeback-scenario.utils';

export const SCENARIO_PANEL_ID = 'scenario-panel';

export const SCENARIO_PANEL_COPY = {
  TITLE: 'Scenarios',
  DESCRIPTION: 'Only in this prototype. Change a case to see how each status looks.',
  CLOSE: 'Close scenarios',
  CASE: 'Case',
  CASE_PLACEHOLDER: 'Choose a case',
  CASE_OPTION: (caseId: string, location: string, status: string) =>
    `${caseId} · ${location} · ${status}`,
  STATUS: 'Status',
  STATUS_HINT: 'Rebuilds the case so its timeline and amounts match the status.',
  EVENTS: 'Simulate next event',
  NO_EVENTS: 'This case is closed. Nothing more happens to it.',
  NO_CASE: 'Choose a case to change its status or simulate what happens next.',
  BECOMES: (status: string) => `Status becomes ${status}`,
  RESET: 'Reset all data',
  RESET_HINT: 'Brings back the original cases and drops your changes.',
  ANNOUNCE_STATUS: (caseId: string, status: string) => `${caseId} is now ${status}.`,
  ANNOUNCE_RESET: 'All data reset.',
  EVENT_LABELS: {
    'worldpay-forwards-response': 'Worldpay sends your response to the bank',
    'worldpay-returns-response': 'Worldpay returns your response',
    'issuer-accepts': 'Cardholder’s bank accepts your response',
    'issuer-withdraws-dispute': 'Cardholder’s bank withdraws the dispute',
    'pre-arbitration-filed': 'Cardholder’s bank challenges your response',
    'pre-arbitration-handled': 'Cardholder’s bank challenges; Worldpay handles it',
    'issuer-declines-pre-arbitration': 'Cardholder’s bank declines your response',
    'issuer-wins-pre-arbitration': 'Cardholder’s bank wins pre-arbitration',
    'arbitration-won': 'Card network rules in your favor',
    'arbitration-split': 'Card network splits the amount',
    'arbitration-lost': 'Card network rules for the cardholder',
    'deadline-passes': 'Due date passes',
  } satisfies Record<ScenarioEvent, string>,
} as const;
