<?php

namespace App\Http\Controllers;

use App\Models\PartnerSchoolApplication;
use App\Models\PartnerSchoolVerificationDocument;
use App\Models\School;
use App\Models\PartnerSchoolRepresentative;
use App\Services\FileSecurityService;
use App\Services\PartnerSchoolAccountService;
use App\Services\PartnerSchoolVerificationService;
use App\Services\PhpMailerService;
use App\Models\FileSecurityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Http\BinaryFileResponse;
use Barryvdh\DomPDF\Facade\Pdf;

class PartnerSchoolApplicationController extends Controller
{
    private $accountService;
    private $verificationService;
    private $mailerService;

    public function __construct(
        PartnerSchoolAccountService $accountService,
        PartnerSchoolVerificationService $verificationService,
        PhpMailerService $mailerService
    ) {
        $this->accountService = $accountService;
        $this->verificationService = $verificationService;
        $this->mailerService = $mailerService;
    }
    /**
     * List applications with filters
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = PartnerSchoolApplication::with(['school', 'verificationDocuments']);

            // Apply filters
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('school_id')) {
                $query->where('school_id', $request->school_id);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('school', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            }

            $perPage = $request->get('per_page', 15);
            $applications = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $applications
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching applications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applications'
            ], 500);
        }
    }

    /**
     * Get application details
     */
    public function show($id): JsonResponse
    {
        try {
            $application = PartnerSchoolApplication::with([
                'school',
                'verificationDocuments'
            ])->findOrFail($id);

            // Add view and download URLs to verification documents
            $application->verificationDocuments->transform(function ($document) use ($id) {
                $document->view_url = url("/api/partner-school/applications/{$id}/documents/{$document->id}/view");
                $document->download_url = url("/api/partner-school/applications/{$id}/documents/{$document->id}/download");
                return $document;
            });

            return response()->json([
                'success' => true,
                'data' => $application
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching application: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Application not found'
            ], 404);
        }
    }

    /**
     * Get application status for current partner school representative
     */
    public function getMyApplication(Request $request): JsonResponse
    {
        try {
            $authUser = $request->get('auth_user');
            
            // Verify this is a partner school representative
            if (!$authUser || !isset($authUser['role']) || $authUser['role'] !== 'ps_rep') {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Partner school representative role required.'
                ], 403);
            }

            if (!isset($authUser['citizen_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Citizen ID not found in authentication data.'
                ], 400);
            }

            // Look up the representative's school using PartnerSchoolRepresentative
            $representative = \App\Models\PartnerSchoolRepresentative::with('school.partnerSchoolApplication.verificationDocuments')
                ->where('citizen_id', $authUser['citizen_id'])
                ->where('is_active', true)
                ->first();

            if (!$representative || !$representative->school) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assigned to this account'
                ], 404);
            }

            $school = $representative->school;
            $application = $school->partnerSchoolApplication;

            // Add view and download URLs to verification documents if application exists
            if ($application) {
                $application->load('verificationDocuments');
                $application->verificationDocuments->transform(function ($document) use ($application) {
                    $document->view_url = url("/api/partner-school/applications/{$application->id}/documents/{$document->id}/view");
                    $document->download_url = url("/api/partner-school/applications/{$application->id}/documents/{$document->id}/download");
                    return $document;
                });
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'school' => $school,
                    'application' => $application,
                    'verification_status' => $school->verification_status,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching my application: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch application status'
            ], 500);
        }
    }

    /**
     * Create new application from email or manually
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'school_id' => 'nullable|exists:schools,id',
            'school_name' => 'required_if:school_id,null|string|max:255',
            'classification' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:20',
            'contact_email' => 'required|email',
            'contact_first_name' => 'required|string|max:255',
            'contact_last_name' => 'required|string|max:255',
            'admin_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $authUser = $request->get('auth_user');

            // Create or get school
            $school = null;
            if ($request->school_id) {
                $school = School::find($request->school_id);
            } elseif ($request->school_name) {
                // Create new school record
                $school = School::create([
                    'name' => $request->school_name,
                    'email' => $request->contact_email,
                    'classification' => $request->classification,
                    'address' => $request->address,
                    'city' => $request->city,
                    'province' => $request->province,
                    'region' => $request->region,
                    'contact_number' => $request->contact_number,
                    'is_partner_school' => false,
                    'is_active' => false,
                    'verification_status' => 'pending',
                ]);
            }

            if (!$school || !$school->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'School is required to create an application'
                ], 400);
            }

            // Create application
            $application = PartnerSchoolApplication::create([
                'school_id' => $school->id,
                'status' => 'draft',
                'submitted_by' => $authUser['id'] ?? null,
                'admin_notes' => $request->admin_notes,
            ]);

            // Link school to application
            $school->application_id = $application->id;
            $school->save();

            // Automatically create account
            try {
                $accountData = [
                    'email' => $request->contact_email,
                    'first_name' => $request->contact_first_name,
                    'last_name' => $request->contact_last_name,
                    'contact_number' => $request->contact_number,
                ];

                $result = $this->accountService->createSchoolAccount($application, $accountData);

                Log::info('Application and account created', [
                    'application_id' => $application->id,
                    'user_id' => $result['user_id'] ?? null
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Application and account created successfully. Credentials sent via email.',
                    'data' => [
                        'application' => $application->load(['school']),
                        'account_created' => true,
                        'user_id' => $result['user_id'] ?? null,
                    ]
                ], 201);
            } catch (\Exception $accountError) {
                // Log the error but still return success for application creation
                Log::error('Application created but account creation failed: ' . $accountError->getMessage(), [
                    'application_id' => $application->id
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Application created successfully, but account creation failed. Please create account manually.',
                    'data' => [
                        'application' => $application->load(['school']),
                        'account_created' => false,
                        'error' => $accountError->getMessage(),
                    ]
                ], 201);
            }
        } catch (\Exception $e) {
            Log::error('Error creating application: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create application'
            ], 500);
        }
    }

    /**
     * Update application
     */
    public function update(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'school_id' => 'nullable|exists:schools,id',
            'admin_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $application = PartnerSchoolApplication::findOrFail($id);

            // Only allow updates if in draft status
            if ($application->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => 'Application cannot be updated in current status'
                ], 400);
            }

            $application->update($request->only(['school_id', 'admin_notes']));

            Log::info('Application updated', ['application_id' => $application->id]);

            return response()->json([
                'success' => true,
                'message' => 'Application updated successfully',
                'data' => $application
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating application: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update application'
            ], 500);
        }
    }

    /**
     * Submit application for review
     */
    public function submit(Request $request, $id): JsonResponse
    {
        try {
            $application = PartnerSchoolApplication::findOrFail($id);

            if (!$application->canBeSubmitted()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application cannot be submitted in current status'
                ], 400);
            }

            $authUser = $request->get('auth_user');

            $application->update([
                'status' => 'submitted',
                'submitted_by' => $authUser['id'] ?? null,
                'submitted_at' => now(),
            ]);

            // Update school verification status
            if ($application->school_id) {
                $application->school->update([
                    'verification_status' => 'pending',
                    'application_id' => $application->id,
                ]);
            }

            Log::info('Application submitted', ['application_id' => $application->id]);

            return response()->json([
                'success' => true,
                'message' => 'Application submitted successfully',
                'data' => $application
            ]);
        } catch (\Exception $e) {
            Log::error('Error submitting application: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit application'
            ], 500);
        }
    }

    /**
     * Mark application as under review
     */
    public function markUnderReview(Request $request, $id): JsonResponse
    {
        try {
            $application = PartnerSchoolApplication::findOrFail($id);

            if ($application->status !== 'submitted') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only submitted applications can be marked as under review'
                ], 400);
            }

            $authUser = $request->get('auth_user');

            $application->update([
                'status' => 'under_review',
                'reviewed_by' => $authUser['id'] ?? null,
            ]);

            Log::info('Application marked as under review', [
                'application_id' => $application->id,
                'reviewed_by' => $authUser['id'] ?? null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Application marked as under review',
                'data' => $application
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking application as under review: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark application as under review'
            ], 500);
        }
    }

    /**
     * Approve application
     */
    public function approve(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $application = PartnerSchoolApplication::findOrFail($id);

            if (!$application->canBeApproved()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application cannot be approved in current status'
                ], 400);
            }

            $authUser = $request->get('auth_user');

            $application->update([
                'status' => 'approved',
                'reviewed_by' => $authUser['id'] ?? null,
                'reviewed_at' => now(),
                'admin_notes' => $request->notes ?? $application->admin_notes,
            ]);

            // Update school
            if ($application->school_id) {
                $application->school->update([
                    'is_partner_school' => true,
                    'is_active' => true,
                    'verification_status' => 'verified',
                    'verification_date' => now(),
                    'verification_expiry_date' => now()->addYear(), // 1 year validity
                    'application_id' => $application->id,
                ]);
            }

            // Send notification email
            if ($application->school?->email) {
                $this->mailerService->sendApplicationStatusEmail(
                    $application->school->email,
                    $application->school->name,
                    'approved',
                    $request->notes ?? 'Your partner school application has been approved.'
                );
            }

            Log::info('Application approved', ['application_id' => $application->id]);

            return response()->json([
                'success' => true,
                'message' => 'Application approved successfully',
                'data' => $application->load(['school'])
            ]);
        } catch (\Exception $e) {
            Log::error('Error approving application: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve application'
            ], 500);
        }
    }

    /**
     * Reject application
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $application = PartnerSchoolApplication::findOrFail($id);

            if (!$application->canBeApproved()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application cannot be rejected in current status'
                ], 400);
            }

            $authUser = $request->get('auth_user');

            $application->update([
                'status' => 'rejected',
                'rejection_reason' => $request->reason,
                'reviewed_by' => $authUser['id'] ?? null,
                'reviewed_at' => now(),
            ]);

            // Update school
            if ($application->school_id) {
                $application->school->update([
                    'verification_status' => 'rejected',
                    'application_id' => $application->id,
                ]);
            }

            // Send notification email
            if ($application->school?->email) {
                $this->mailerService->sendApplicationStatusEmail(
                    $application->school->email,
                    $application->school->name,
                    'rejected',
                    $request->reason
                );
            }

            Log::info('Application rejected', ['application_id' => $application->id]);

            return response()->json([
                'success' => true,
                'message' => 'Application rejected',
                'data' => $application
            ]);
        } catch (\Exception $e) {
            Log::error('Error rejecting application: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject application'
            ], 500);
        }
    }

    /**
     * Withdraw application
     */
    public function withdraw(Request $request, $id): JsonResponse
    {
        try {
            $application = PartnerSchoolApplication::findOrFail($id);

            // Only submitted or under_review applications can be withdrawn
            if (!in_array($application->status, ['submitted', 'under_review'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only submitted or under review applications can be withdrawn'
                ], 400);
            }

            $authUser = $request->get('auth_user');

            $application->update([
                'status' => 'withdrawn',
                'reviewed_by' => $authUser['id'] ?? null,
                'reviewed_at' => now(),
            ]);

            // Update school verification status
            if ($application->school_id) {
                $application->school->update([
                    'verification_status' => 'not_applied',
                    'application_id' => $application->id,
                ]);
            }

            Log::info('Application withdrawn', [
                'application_id' => $application->id,
                'withdrawn_by' => $authUser['id'] ?? null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Application withdrawn successfully',
                'data' => $application
            ]);
        } catch (\Exception $e) {
            Log::error('Error withdrawing application: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to withdraw application'
            ], 500);
        }
    }

    /**
     * Upload verification document
     */
    public function uploadDocument(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'document_type' => 'required|string|in:accreditation,license,registration,other',
            'document_name' => 'required|string|max:255',
            'file' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png,doc,docx',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $application = PartnerSchoolApplication::findOrFail($id);
            $file = $request->file('file');

            // File security validation
            $securityService = new FileSecurityService();
            $securityResult = $securityService->validateFile($file);

            // Log security scan
            $securityLog = FileSecurityLog::create([
                'file_name' => $file->getClientOriginalName(),
                'file_path' => 'temp/' . $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'is_clean' => $securityResult['is_clean'],
                'threat_name' => $securityResult['threat_name'],
                'notes' => implode('; ', $securityResult['notes'] ?? []),
                'scan_duration' => $securityResult['scan_duration'],
                'scanner_type' => 'file_security',
            ]);

            if (!$securityResult['is_clean']) {
                return response()->json([
                    'success' => false,
                    'message' => 'File upload rejected due to security concerns',
                    'data' => [
                        'reason' => $securityResult['threat_name'],
                    ]
                ], 422);
            }

            // Store file
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileName = Str::uuid() . '.' . $extension;
            $filePath = 'partner-school-documents/' . $fileName;

            $fileContents = file_get_contents($file);
            if ($fileContents === false) {
                throw new \Exception('Failed to read file contents');
            }

            Storage::disk('public')->put($filePath, $fileContents);

            // Update security log
            $securityLog->update(['file_path' => $filePath]);

            // Create document record
            $document = PartnerSchoolVerificationDocument::create([
                'application_id' => $application->id,
                'document_type' => $request->document_type,
                'document_name' => $request->document_name,
                'file_name' => $originalName,
                'file_path' => $filePath,
                'file_size' => (string)$file->getSize(),
                'mime_type' => $file->getMimeType(),
                'verification_status' => 'pending',
            ]);

            // Update application status if needed
            if ($application->status === 'submitted') {
                $application->update(['status' => 'under_review']);
            }

            Log::info('Document uploaded', [
                'application_id' => $application->id,
                'document_id' => $document->id
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'data' => $document
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error uploading document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get application documents
     */
    public function getDocuments($id): JsonResponse
    {
        try {
            $application = PartnerSchoolApplication::findOrFail($id);
            $documents = $application->verificationDocuments()->get();

            // Add view and download URLs to each document
            $documents = $documents->map(function ($document) use ($id) {
                $document->view_url = url("/api/partner-school/applications/{$id}/documents/{$document->id}/view");
                $document->download_url = url("/api/partner-school/applications/{$id}/documents/{$document->id}/download");
                return $document;
            });

            return response()->json([
                'success' => true,
                'data' => $documents
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching documents: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch documents'
            ], 500);
        }
    }

    /**
     * View verification document (for partner school representatives and admins)
     */
    public function viewDocument(Request $request, $id, $docId)
    {
        try {
            $authUser = $request->get('auth_user');
            
            if (!$authUser || !isset($authUser['role'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Authentication required.'
                ], 403);
            }

            $rawRole = $authUser['role'] ?? '';
            $systemRole = $authUser['system_role'] ?? '';
            $userRole = strtolower(trim($rawRole));
            $userSystemRole = strtolower(trim($systemRole));
            
            // Check if user is admin - check both role and system_role fields
            $isAdmin = in_array($userRole, ['admin', 'administrator']) || 
                      in_array($userSystemRole, ['administrator']);
            
            // Log for debugging
            Log::info('Document view access attempt', [
                'user_id' => $authUser['id'] ?? 'unknown',
                'user_email' => $authUser['email'] ?? 'unknown',
                'user_role_raw' => $rawRole,
                'user_system_role' => $systemRole,
                'user_role_lower' => $userRole,
                'user_system_role_lower' => $userSystemRole,
                'is_admin' => $isAdmin,
                'application_id' => $id,
                'document_id' => $docId,
                'all_auth_data' => $authUser
            ]);

            // If not admin, verify this is a partner school representative and check school ownership
            if (!$isAdmin) {
                if ($userRole !== 'ps_rep') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied. Partner school representative or admin role required.'
                    ], 403);
                }

                if (!isset($authUser['citizen_id'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Citizen ID not found in authentication data.'
                    ], 400);
                }

                // Look up the representative's school
                $representative = \App\Models\PartnerSchoolRepresentative::with('school')
                    ->where('citizen_id', $authUser['citizen_id'])
                    ->where('is_active', true)
                    ->first();

                if (!$representative || !$representative->school) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No school assigned to this account'
                    ], 404);
                }

                // Get the application and verify it belongs to the representative's school
                $application = PartnerSchoolApplication::findOrFail($id);
                if ($application->school_id !== $representative->school_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied. This document does not belong to your school.'
                    ], 403);
                }
            } else {
                // Admin can access any document, just verify application exists
                Log::info('Admin accessing document', [
                    'application_id' => $id,
                    'document_id' => $docId
                ]);
                $application = PartnerSchoolApplication::findOrFail($id);
            }

            // Get the document
            $document = PartnerSchoolVerificationDocument::where('application_id', $id)
                ->findOrFail($docId);

            // Check if file exists
            if (!Storage::disk('public')->exists($document->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            $filePath = Storage::disk('public')->path($document->file_path);
            
            // Set headers for inline viewing
            $headers = [
                'Content-Type' => $document->mime_type,
                'Content-Disposition' => 'inline; filename="' . $document->file_name . '"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ];

            return response()->file($filePath, $headers);

        } catch (\Exception $e) {
            Log::error('Error viewing document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to view document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download verification document (for partner school representatives and admins)
     */
    public function downloadDocument(Request $request, $id, $docId)
    {
        try {
            $authUser = $request->get('auth_user');
            
            if (!$authUser || !isset($authUser['role'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Authentication required.'
                ], 403);
            }

            $rawRole = $authUser['role'] ?? '';
            $systemRole = $authUser['system_role'] ?? '';
            $userRole = strtolower(trim($rawRole));
            $userSystemRole = strtolower(trim($systemRole));
            
            // Check if user is admin - check both role and system_role fields
            $isAdmin = in_array($userRole, ['admin', 'administrator']) || 
                      in_array($userSystemRole, ['administrator']);
            
            // Log for debugging
            Log::info('Document download access attempt', [
                'user_id' => $authUser['id'] ?? 'unknown',
                'user_email' => $authUser['email'] ?? 'unknown',
                'user_role_raw' => $rawRole,
                'user_system_role' => $systemRole,
                'user_role_lower' => $userRole,
                'user_system_role_lower' => $userSystemRole,
                'is_admin' => $isAdmin,
                'application_id' => $id,
                'document_id' => $docId,
                'all_auth_data' => $authUser
            ]);

            // If not admin, verify this is a partner school representative and check school ownership
            if (!$isAdmin) {
                if ($userRole !== 'ps_rep') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied. Partner school representative or admin role required.'
                    ], 403);
                }

                if (!isset($authUser['citizen_id'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Citizen ID not found in authentication data.'
                    ], 400);
                }

                // Look up the representative's school
                $representative = \App\Models\PartnerSchoolRepresentative::with('school')
                    ->where('citizen_id', $authUser['citizen_id'])
                    ->where('is_active', true)
                    ->first();

                if (!$representative || !$representative->school) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No school assigned to this account'
                    ], 404);
                }

                // Get the application and verify it belongs to the representative's school
                $application = PartnerSchoolApplication::findOrFail($id);
                if ($application->school_id !== $representative->school_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access denied. This document does not belong to your school.'
                    ], 403);
                }
            } else {
                // Admin can access any document, just verify application exists
                Log::info('Admin downloading document', [
                    'application_id' => $id,
                    'document_id' => $docId
                ]);
                $application = PartnerSchoolApplication::findOrFail($id);
            }

            // Get the document
            $document = PartnerSchoolVerificationDocument::where('application_id', $id)
                ->findOrFail($docId);

            // Check if file exists
            if (!Storage::disk('public')->exists($document->file_path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            $filePath = Storage::disk('public')->path($document->file_path);
            $headers = [
                'Content-Type' => $document->mime_type,
                'Content-Disposition' => 'attachment; filename="' . $document->file_name . '"',
            ];

            return response()->download($filePath, $document->file_name, $headers);

        } catch (\Exception $e) {
            Log::error('Error downloading document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to download document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify document (admin only)
     */
    public function verifyDocument(Request $request, $id, $docId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:verified,rejected',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $application = PartnerSchoolApplication::findOrFail($id);
            $document = PartnerSchoolVerificationDocument::where('application_id', $id)
                ->findOrFail($docId);

            $authUser = $request->get('auth_user');

            $document->update([
                'verification_status' => $request->status,
                'verification_notes' => $request->notes,
                'verified_by' => $authUser['id'] ?? null,
                'verified_at' => now(),
            ]);

            // Update application status if all documents verified
            if ($request->status === 'verified' && $application->allDocumentsVerified()) {
                $application->update(['status' => 'under_review']);
            }

            Log::info('Document verified', [
                'application_id' => $application->id,
                'document_id' => $document->id,
                'status' => $request->status
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document verification updated',
                'data' => $document
            ]);
        } catch (\Exception $e) {
            Log::error('Error verifying document: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to verify document'
            ], 500);
        }
    }


    /**
     * Create school account with temporary password (Method 1)
     */
    public function createAccount(Request $request, $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $application = PartnerSchoolApplication::with('school')->findOrFail($id);
            
            if (!$application->school_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Application must have a school linked'
                ], 400);
            }

            $accountData = [
                'email' => $request->email,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'contact_number' => $request->contact_number,
            ];

            $result = $this->accountService->createSchoolAccount($application, $accountData);

            return response()->json([
                'success' => true,
                'message' => 'Account created successfully. Credentials sent via email.',
                'data' => [
                    'user_id' => $result['user_id'],
                    'email_sent' => $result['email_sent'],
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating account: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create account: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download MOA template for partner school
     */
    public function downloadMOA(Request $request)
    {
        try {
            $authUser = $request->get('auth_user');
            
            // Check if user has assigned school
            if (!isset($authUser['assigned_school_id']) || !$authUser['assigned_school_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'No school assigned to this user'
                ], 400);
            }
            
            // Get the school information
            $school = School::find($authUser['assigned_school_id']);
            
            if (!$school) {
                return response()->json([
                    'success' => false,
                    'message' => 'School not found'
                ], 404);
            }

            // Get application if exists
            $application = PartnerSchoolApplication::where('school_id', $school->id)->first();

            // Generate MOA HTML content
            $moaContent = $this->generateMOAContent($school, $application);
            
            // Generate PDF from HTML
            $pdf = Pdf::loadHTML($moaContent);
            $pdf->setPaper('a4', 'portrait');
            
            // Create filename
            $fileName = 'MOA_' . str_replace(' ', '_', $school->name) . '_' . date('Y-m-d') . '.pdf';
            
            // Return PDF download
            return $pdf->download($fileName);
            
        } catch (\Exception $e) {
            Log::error('Error generating MOA: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate MOA'
            ], 500);
        }
    }

    /**
     * Generate MOA content
     */
    private function generateMOAContent($school, $application = null): string
    {
        $currentDate = date('F d, Y');
        $schoolName = $school->name ?? '[School Name]';
        $schoolAddress = $school->address ?? '[School Address]';
        $contactPerson = $school->contact_person ?? '[Contact Person]';
        $contactEmail = $school->email ?? '[Email]';
        $contactNumber = $school->contact_number ?? '[Contact Number]';
        
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memorandum of Agreement</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 24px;
            margin-bottom: 5px;
            text-transform: uppercase;
        }
        .header h2 {
            font-size: 18px;
            margin-top: 5px;
            font-weight: normal;
        }
        .section {
            margin: 20px 0;
            text-align: justify;
        }
        .section-title {
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            text-decoration: underline;
        }
        .parties {
            margin: 20px 0;
        }
        .party {
            margin: 15px 0;
        }
        .signature-section {
            margin-top: 50px;
        }
        .signature-block {
            display: inline-block;
            width: 45%;
            margin: 20px 0;
            vertical-align: top;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 5px;
        }
        ul {
            margin: 10px 0;
            padding-left: 40px;
        }
        li {
            margin: 8px 0;
        }
        .date {
            text-align: right;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Memorandum of Agreement</h1>
        <h2>Education & Scholarship Management System</h2>
        <h2>Partner School Program</h2>
    </div>

    <div class="date">
        Date: {$currentDate}
    </div>

    <div class="section">
        <p><strong>This Memorandum of Agreement (MOA)</strong> is entered into on this day between:</p>
    </div>

    <div class="parties">
        <div class="party">
            <p><strong>FIRST PARTY:</strong></p>
            <p>
                <strong>Managing Office</strong><br>
                Education & Scholarship Management System<br>
                [Address]<br>
                Represented by: [Name and Title]
            </p>
        </div>

        <div class="party">
            <p><strong>SECOND PARTY:</strong></p>
            <p>
                <strong>{$schoolName}</strong><br>
                {$schoolAddress}<br>
                Represented by: {$contactPerson}<br>
                Email: {$contactEmail}<br>
                Contact: {$contactNumber}
            </p>
        </div>
    </div>

    <div class="section">
        <div class="section-title">I. PURPOSE</div>
        <p>
            This Memorandum of Agreement establishes a partnership between the Managing Office and {$schoolName} 
            to facilitate the Education & Scholarship Management System's partner school program. The agreement 
            outlines the terms, responsibilities, and scope of the partnership to ensure effective collaboration 
            in supporting educational initiatives and scholarship opportunities.
        </p>
    </div>

    <div class="section">
        <div class="section-title">II. SCOPE OF PARTNERSHIP</div>
        <p>The partnership shall include but is not limited to:</p>
        <ul>
            <li>Access to the Education & Scholarship Management System platform</li>
            <li>Student enrollment and academic performance tracking</li>
            <li>Scholarship application and management support</li>
            <li>Data sharing for monitoring and reporting purposes</li>
            <li>Participation in system training and capacity building programs</li>
        </ul>
    </div>

    <div class="section">
        <div class="section-title">III. RESPONSIBILITIES OF THE MANAGING OFFICE</div>
        <ul>
            <li>Provide access credentials and technical support for the platform</li>
            <li>Ensure data security and privacy protection in accordance with applicable laws</li>
            <li>Conduct training sessions for partner school personnel</li>
            <li>Provide regular system updates and improvements</li>
            <li>Process and manage scholarship applications efficiently</li>
            <li>Maintain transparent communication channels</li>
        </ul>
    </div>

    <div class="section">
        <div class="section-title">IV. RESPONSIBILITIES OF THE PARTNER SCHOOL</div>
        <ul>
            <li>Designate authorized representatives to access and manage the system</li>
            <li>Provide accurate and timely student enrollment and academic data</li>
            <li>Ensure data privacy and confidentiality of student information</li>
            <li>Cooperate in monitoring and evaluation activities</li>
            <li>Comply with system policies and data-sharing protocols</li>
            <li>Submit required reports and documentation within specified timelines</li>
            <li>Participate in training programs and capacity-building initiatives</li>
            <li>Inform the Managing Office of any significant changes affecting the partnership</li>
        </ul>
    </div>

    <div class="section">
        <div class="section-title">V. DATA PRIVACY AND SECURITY</div>
        <p>
            Both parties agree to comply with all applicable data privacy laws and regulations. Student and 
            institutional data will be handled with strict confidentiality and used solely for the purposes 
            outlined in this agreement. The Managing Office shall implement appropriate technical and 
            organizational measures to ensure data security.
        </p>
    </div>

    <div class="section">
        <div class="section-title">VI. DURATION AND TERMINATION</div>
        <p>
            This agreement shall remain in effect for a period of one (1) year from the date of signing and 
            shall be automatically renewed annually unless either party provides written notice of termination 
            at least thirty (30) days prior to the renewal date. Either party may terminate this agreement 
            for cause with written notice if the other party fails to comply with the terms herein.
        </p>
    </div>

    <div class="section">
        <div class="section-title">VII. AMENDMENTS</div>
        <p>
            Any amendments or modifications to this agreement must be made in writing and signed by authorized 
            representatives of both parties.
        </p>
    </div>

    <div class="section">
        <p>
            <strong>IN WITNESS WHEREOF</strong>, the parties have executed this Memorandum of Agreement on the 
            date first written above.
        </p>
    </div>

    <div class="signature-section">
        <div class="signature-block">
            <p><strong>FIRST PARTY</strong></p>
            <div class="signature-line">
                <p>Signature Over Printed Name<br>
                [Name and Title]<br>
                Managing Office Representative</p>
            </div>
        </div>

        <div class="signature-block" style="float: right;">
            <p><strong>SECOND PARTY</strong></p>
            <div class="signature-line">
                <p>Signature Over Printed Name<br>
                {$contactPerson}<br>
                {$schoolName}</p>
            </div>
        </div>
    </div>

    <div style="clear: both; margin-top: 100px;">
        <p style="text-align: center; font-style: italic; color: #666;">
            This document is automatically generated from the Education & Scholarship Management System.<br>
            Generated on: {$currentDate}
        </p>
    </div>
</body>
</html>
HTML;
    }
}
