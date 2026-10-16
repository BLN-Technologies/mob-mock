/**
 * Cargo Mobile V1 - Centralized Error Normalization
 * Converts technical exceptions into safe, user-facing localized feedback
 * without leaking raw stack traces, tokens, or unhandled promise errors.
 */

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  BR_VIOLATION = 'BR_VIOLATION',
  OFFLINE_STORAGE_ERROR = 'OFFLINE_STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONFLICT = 'CONFLICT',
  UNKNOWN = 'UNKNOWN',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly userFacingMessageEn: string;
  public readonly userFacingMessageRw: string;
  public readonly technicalDetails?: string;

  constructor(params: {
    code: ErrorCode;
    messageEn: string;
    messageRw: string;
    technicalDetails?: string;
  }) {
    super(params.messageEn);
    this.name = 'AppError';
    this.code = params.code;
    this.userFacingMessageEn = params.messageEn;
    this.userFacingMessageRw = params.messageRw;
    this.technicalDetails = params.technicalDetails;
  }
}

export function normalizeError(err: any): { messageEn: string; messageRw: string; code: ErrorCode } {
  if (err instanceof AppError) {
    return {
      messageEn: err.userFacingMessageEn,
      messageRw: err.userFacingMessageRw,
      code: err.code,
    };
  }

  const rawMsg = err?.message || String(err) || 'An unexpected error occurred.';

  // Business Rule Invariants
  if (rawMsg.includes('BR-01')) {
    return {
      code: ErrorCode.BR_VIOLATION,
      messageEn: 'Harvest declaration rejected: Produce must be confirmed harvested and warehouse-ready (BR-01).',
      messageRw: 'Umusaruro ntiwemewe: Ugomba kuba wareze neza kandi witeguye mu bubiko (BR-01).',
    };
  }
  if (rawMsg.includes('BR-02')) {
    return {
      code: ErrorCode.BR_VIOLATION,
      messageEn: 'Administrative verification required before lot can be listed for trading (BR-02).',
      messageRw: 'Isuzumwa ry\'ubuyobozi bwa Cargo rirakenewe mbere y\'uko umusaruro ugaragara ku isoko (BR-02).',
    };
  }
  if (rawMsg.includes('BR-03')) {
    return {
      code: ErrorCode.PAYMENT_REQUIRED,
      messageEn: 'Payment confirmation in escrow is strictly required before dispatch (BR-03).',
      messageRw: 'Kwishyura muri escrow birakenewe mbere yo kohereza umusaruro mu nzira (BR-03).',
    };
  }
  if (rawMsg.includes('BR-04')) {
    return {
      code: ErrorCode.BR_VIOLATION,
      messageEn: 'Active trade dispute has placed a temporary hold on this settlement payout (BR-04).',
      messageRw: 'Impaka ziriho zahagaritse by\'agateganyo kwishyura uyu musaruro (BR-04).',
    };
  }
  if (rawMsg.includes('network') || rawMsg.includes('offline') || rawMsg.includes('connection')) {
    return {
      code: ErrorCode.NETWORK_ERROR,
      messageEn: 'Internet connection is unavailable. Action has been safely queued locally.',
      messageRw: 'Nta murandasi ihari. Igikorwa cyabitswe muri terefoni kizoherezwa nyuma.',
    };
  }

  return {
    code: ErrorCode.UNKNOWN,
    messageEn: rawMsg,
    messageRw: rawMsg,
  };
}
