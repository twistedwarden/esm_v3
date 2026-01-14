// School Aid Distribution Types

export type ApplicationStatus = 
  | 'submitted' 
  | 'under_review' 
  | 'approved' 
  | 'pending_disbursement'
  | 'grants_processing' 
  | 'grants_disbursed' 
  | 'payment_failed' 
  | 'disbursed'
  | 'received'
  | 'rejected';

export type PaymentMethod = 'bank_transfer' | 'gcash' | 'paymaya' | 'check';

export interface ScholarshipApplication {
  id: string;
  studentName: string;
  studentId: string;
  school: string;
  schoolId: string;
  amount: number;
  status: ApplicationStatus;
  submittedDate: string;
  approvalDate?: string;
  processingDate?: string;
  disbursedDate?: string;
  schoolYear?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  notes?: string;
  documents: Document[];
  digitalWallets?: string[];
  walletAccountNumber?: string;
  // Disbursement fields
  proofOfTransferUrl?: string;
  transactionReference?: string;
  processedBy?: string;
  processedAt?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

export interface PaymentRecord {
  id: string;
  applicationId: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  status: 'processing' | 'completed' | 'failed';
  initiatedAt: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface DisbursementHistoryRecord {
  id: string;
  applicationId: string;
  applicationNumber?: string | null;
  studentName?: string | null;
  schoolName?: string | null;
  amount: number;
  method: PaymentMethod | string;
  providerName: string;
  referenceNumber: string;
  accountNumber?: string | null;
  receiptPath: string;
  notes?: string | null;
   disbursedByUserId?: string | null;
   disbursedByName?: string | null;
  disbursedAt?: string | null;
}

export interface TimelineEvent {
  id: string;
  applicationId: string;
  action: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  userId?: string;
  userName?: string;
}

export interface BudgetInfo {
  total_budget: number;
  disbursed: number;
  remaining: number;
  utilization_rate: number;
}

export interface ProcessingMetrics {
  totalApplications: number;
  approvedApplications: number;
  processingApplications: number;
  disbursedApplications: number;
  failedApplications: number;
  totalAmount: number;
  disbursedAmount: number;
  pendingAmount: number;
  averageProcessingTime: number;
  successRate: number;
  school_year?: string;
  budgets?: {
    financial_support: BudgetInfo;
    scholarship_benefits: BudgetInfo;
  };
}

export interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  component?: React.ComponentType<any>;
  statusFilter?: ApplicationStatus[];
  submodules: SubmoduleConfig[];
}

export interface SubmoduleConfig {
  id: string;
  label: string;
  description: string;
  component: React.ComponentType<any>;
  statusFilter?: ApplicationStatus[];
  actions?: string[];
}

export interface PaymentProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error?: string;
  success?: boolean;
}

export interface ModalState {
  isOpen: boolean;
  application: ScholarshipApplication | undefined;
  mode: 'view' | 'process' | 'edit';
  processingState?: PaymentProcessingState;
}
