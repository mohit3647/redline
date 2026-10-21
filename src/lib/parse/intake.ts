/**
 * The intake gate (ADR 0005, ADR 0002). The file picker is unusable until the
 * signer has acknowledged the disclosure and said the document has a
 * counterparty who can accept changes. A "no" refuses the document.
 */
export type Counterparty = 'unanswered' | 'yes' | 'no';

export interface IntakeState {
  disclosureAcknowledged: boolean;
  counterparty: Counterparty;
}

export type IntakeStage = 'disclosure' | 'counterparty' | 'ready' | 'refused';

export const initialIntake: IntakeState = { disclosureAcknowledged: false, counterparty: 'unanswered' };

export function acknowledgeDisclosure(state: IntakeState): IntakeState {
  return { ...state, disclosureAcknowledged: true };
}

/** Answering before the disclosure is acknowledged has no effect: the order is part of the gate. */
export function answerCounterparty(state: IntakeState, answer: 'yes' | 'no'): IntakeState {
  if (!state.disclosureAcknowledged) return state;
  return { ...state, counterparty: answer };
}

export function resetIntake(): IntakeState {
  return initialIntake;
}

export function intakeStage(state: IntakeState): IntakeStage {
  if (!state.disclosureAcknowledged) return 'disclosure';
  if (state.counterparty === 'no') return 'refused';
  if (state.counterparty === 'yes') return 'ready';
  return 'counterparty';
}

export function isPickerUsable(state: IntakeState): boolean {
  return intakeStage(state) === 'ready';
}
