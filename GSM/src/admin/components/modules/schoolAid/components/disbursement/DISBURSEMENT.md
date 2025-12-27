# Disbursement Module Technical Documentation

## Overview

The Disbursement Module facilitates the manual processing of scholarship grants to students. It provides a secure workflow for administrators to record fund transfers, upload proof of payment, and track the status of disbursements from approval to student receipt.

## 1. Workflow Explanation

The disbursement lifecycle follows a strict state machine enforced by `statusLogic.ts`:

1.  **Approved**: Application has been reviewed and approved for funding.
2.  **Pending Disbursement**: The application is queued for payment processing.
    *   *Action*: Admin opens the "Process Disbursement" modal.
3.  **Disbursed**: Funds have been transferred by the admin.
    *   *Trigger*: Admin submits the manual disbursement form with a valid receipt.
    *   *System Action*: Status updates to `disbursed`, payment details are recorded, and the receipt is stored.
    *   *Student View*: Student sees "Funds Disbursed" and can view the receipt.
4.  **Received**: Student confirms receipt of funds.
    *   *Trigger*: Student clicks "Confirm Receipt" in the portal.
    *   *System Action*: Status updates to `received`, completing the lifecycle.

## 2. Reason for Manual Disbursement

While automated payouts are a future goal, a **Manual Disbursement** approach was chosen for the initial release to:

*   **Support Diverse Channels**: Accommodate various payment methods (GCash, Maya, Bank Transfer, Cheque, Cash) without requiring immediate API integration for each.
*   **Human Verification**: Ensure a human administrator verifies the recipient's details before funds leave the organization's accounts.
*   **Flexibility**: Handle edge cases or offline payments that automated gateways might reject or fail to process.

## 3. Receipt Handling and Audit Trail

### Receipt Management
*   **Mandatory Upload**: Administrators *must* upload a proof of transfer (JPG, PNG, PDF) to complete a disbursement.
*   **Storage**: Files are renamed with a timestamp and application ID (`{timestamp}_{appId}_{sanitizedName}`) to prevent collisions and improve organization.
*   **Validation**:
    *   File Type: Restricted to images and PDFs.
    *   File Size: Capped at 5MB to optimize storage.

### Audit Trail
Every disbursement action records:
*   **Processed By**: The ID of the administrator who performed the action.
*   **Processed At**: Precise timestamp of the transaction.
*   **Transaction Reference**: External reference number (e.g., bank transaction ID) for reconciliation.
*   **Provider**: The specific service used (e.g., "BDO", "GCash").

## 4. Security Measures

*   **Data Masking**: Sensitive student account numbers (e.g., e-wallet numbers, bank accounts) are masked by default in the UI (e.g., `•••• 1234`). A "reveal" toggle is available for verification purposes.
*   **Status Guards**: Strict validation logic prevents illegal state transitions (e.g., an application cannot skip from `approved` to `received`).
*   **Idempotency**: The frontend implements double-submission prevention to ensure a single payment isn't recorded twice due to UI lag.
*   **Read-Only Records**: Once an application reaches `disbursed` or `received` status, the payment record becomes immutable in the disbursement interface to preserve integrity.

## 5. Limitations and Future Improvements

### Current Limitations
*   **No Real-Time Validation**: The system records the *claim* of a transfer but does not verify with the bank that funds actually moved.
*   **Manual Entry**: prone to typo errors in reference numbers or amounts if not carefully checked.

### Future Improvements
1.  **Payment Gateway Integration**: Automate payouts via Xendit or PayMongo for supported channels (GCash, Maya).
2.  **Batch Processing**: Allow administrators to upload a bulk CSV of payments and receipts for mass disbursement.
3.  **OCR for Receipts**: Automatically extract reference numbers and amounts from uploaded screenshots to cross-verify with form data.
4.  **Email/SMS Notifications**: Automatically notify students when funds are disbursed.
