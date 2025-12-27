import { ApplicationStatus } from '../../types';

export const DISBURSEMENT_STATUS = {
  APPROVED: 'approved',
  PENDING_DISBURSEMENT: 'pending_disbursement',
  DISBURSED: 'disbursed',
  RECEIVED: 'received'
} as const;

export const canDisburse = (status: ApplicationStatus): boolean => {
  return status === DISBURSEMENT_STATUS.PENDING_DISBURSEMENT;
};

export const canViewReceipt = (status: ApplicationStatus): boolean => {
  return status === DISBURSEMENT_STATUS.DISBURSED || status === DISBURSEMENT_STATUS.RECEIVED;
};

export const isReadOnly = (status: ApplicationStatus): boolean => {
  return status === DISBURSEMENT_STATUS.DISBURSED || status === DISBURSEMENT_STATUS.RECEIVED;
};

export const validateStatusTransition = (
  currentStatus: ApplicationStatus, 
  newStatus: ApplicationStatus
): boolean => {
  const allowedTransitions: Record<string, string[]> = {
    [DISBURSEMENT_STATUS.APPROVED]: [DISBURSEMENT_STATUS.PENDING_DISBURSEMENT],
    [DISBURSEMENT_STATUS.PENDING_DISBURSEMENT]: [DISBURSEMENT_STATUS.DISBURSED],
    [DISBURSEMENT_STATUS.DISBURSED]: [DISBURSEMENT_STATUS.RECEIVED],
    [DISBURSEMENT_STATUS.RECEIVED]: []
  };

  const allowed = allowedTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
};
