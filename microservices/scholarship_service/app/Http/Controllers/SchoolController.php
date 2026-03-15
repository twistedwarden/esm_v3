<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class SchoolController extends Controller
{
    /**
     * Cache TTL in seconds (1 hour)
     */
    private const CACHE_TTL = 3600;

    /**
     * Display a listing of schools
     * Results are cached for performance
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = School::query();

            // Apply filters
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('campus', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            }

            if ($request->has('classification')) {
                $query->where('classification', $request->classification);
            }

            if ($request->has('is_partner_school')) {
                $query->where('is_partner_school', $request->boolean('is_partner_school'));
            }

            if ($request->has('is_public')) {
                $query->where('is_public', $request->boolean('is_public'));
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $schools = $query->orderBy('name', 'asc')
                ->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $schools
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch schools',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created school
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'campus' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'classification' => 'required|in:LOCAL UNIVERSITY/COLLEGE (LUC),STATE UNIVERSITY/COLLEGE (SUC),PRIVATE UNIVERSITY/COLLEGE,TECHNICAL/VOCATIONAL INSTITUTE,OTHER',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'zip_code' => 'nullable|string|max:20',
            'is_public' => 'boolean',
            'is_partner_school' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $school = School::create($request->all());

            // Invalidate schools cache
            $this->clearSchoolsCache();

            return response()->json([
                'success' => true,
                'message' => 'School created successfully',
                'data' => $school
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create school',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified school
     */
    public function show(School $school): JsonResponse
    {
        $school->load([
            'academicRecords.student',
            'scholarshipApplications.student',
            'partnerSchoolApplication',
            'verificationDocuments'
        ]);

        return response()->json([
            'success' => true,
            'data' => $school
        ]);
    }

    /**
     * Update the specified school
     */
    public function update(Request $request, School $school): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'campus' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|url|max:255',
            'classification' => 'sometimes|required|in:LOCAL UNIVERSITY/COLLEGE (LUC),STATE UNIVERSITY/COLLEGE (SUC),PRIVATE UNIVERSITY/COLLEGE,TECHNICAL/VOCATIONAL INSTITUTE,OTHER',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'province' => 'nullable|string|max:255',
            'region' => 'nullable|string|max:255',
            'zip_code' => 'nullable|string|max:20',
            'is_public' => 'boolean',
            'is_partner_school' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $school->update($request->all());

            // Invalidate schools cache
            $this->clearSchoolsCache();

            return response()->json([
                'success' => true,
                'message' => 'School updated successfully',
                'data' => $school
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update school',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified school
     */
    public function destroy(School $school): JsonResponse
    {
        try {
            $school->delete();

            // Invalidate schools cache
            $this->clearSchoolsCache();

            return response()->json([
                'success' => true,
                'message' => 'School deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete school',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear all schools-related cache entries
     */
    private function clearSchoolsCache(): void
    {
        // Clear all cache keys starting with 'schools:'
        // Note: This uses pattern matching which works with Redis
        // For database cache, you may need to track keys differently
        Cache::flush(); // Simple approach - clears all cache
        // Alternative with Redis: Cache::getRedis()->keys('schools:*') and delete each
    }
    /**
     * Get top schools by application count for dashboard
     */
    public function getTopSchools(Request $request): JsonResponse
    {
        try {
            $schools = School::withCount([
                'scholarshipApplications' => function ($query) {
                    // Count all applications except draft
                    $query->where('status', '!=', 'draft');
                }
            ])
                ->withCount([
                    'scholarshipApplications as approved_count' => function ($query) {
                        $query->where('status', 'approved');
                    }
                ])
                ->orderByDesc('scholarship_applications_count')
                ->limit(4)
                ->get();

            $data = $schools->map(function ($school) {
                return [
                    'name' => $school->name,
                    'applications' => $school->scholarship_applications_count,
                    'approved' => $school->approved_count
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch top schools',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export schools based on filters
     */
    public function exportSchools(Request $request)
    {
        try {
            $format = $request->get('format', 'csv');
            $query = School::query();

            // Apply filters identically to index
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('campus', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%");
                });
            }

            if ($request->has('classification')) {
                $query->where('classification', $request->classification);
            }

            if ($request->has('is_partner_school')) {
                $query->where('is_partner_school', $request->boolean('is_partner_school'));
            }

            if ($request->has('is_public')) {
                $query->where('is_public', $request->boolean('is_public'));
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $query->orderBy('name', 'asc');

            if ($format === 'pdf') {
                $schools = $query->get();
                $html = '<h1>School Management Export</h1>';
                $html .= '<table border="1" cellpadding="5" cellspacing="0" width="100%">';
                $html .= '<tr><th>School Name</th><th>Campus</th><th>Classification</th><th>Location</th><th>Contact Details</th><th>Type</th><th>Status</th></tr>';
                foreach ($schools as $school) {
                    $location = implode(', ', array_filter([$school->address, $school->city, $school->region]));
                    $contact = implode(' / ', array_filter([$school->email, $school->contact_number]));
                    
                    $html .= '<tr>';
                    $html .= '<td>' . ($school->name ?? 'N/A') . '</td>';
                    $html .= '<td>' . ($school->campus ?? 'N/A') . '</td>';
                    $html .= '<td>' . ($school->classification ?? 'N/A') . '</td>';
                    $html .= '<td>' . ($location ?: 'N/A') . '</td>';
                    $html .= '<td>' . ($contact ?: 'N/A') . '</td>';
                    $html .= '<td>' . ($school->is_public ? 'Public' : 'Private') . '</td>';
                    $html .= '<td>' . ($school->is_active ? 'Active' : 'Inactive') . '</td>';
                    $html .= '</tr>';
                }
                $html .= '</table>';

                $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'landscape');
                return $pdf->download('school_management_' . date('Ymd_His') . '.pdf');
            }

            // CSV Export
            $filename = 'school_management_' . date('Ymd_His') . '.csv';
            $headers = [
                "Content-type"        => "text/csv",
                "Content-Disposition" => "attachment; filename=$filename",
                "Pragma"              => "no-cache",
                "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
                "Expires"             => "0"
            ];

            $callback = function () use ($query) {
                $file = fopen('php://output', 'w');
                fputcsv($file, [
                    'School Name',
                    'Campus',
                    'Classification',
                    'Address',
                    'City',
                    'Region',
                    'Email',
                    'Contact Number',
                    'Website',
                    'Type',
                    'Status',
                    'Partner School'
                ]);

                $query->chunk(100, function ($schools) use ($file) {
                    foreach ($schools as $school) {
                        fputcsv($file, [
                            $school->name ?? 'N/A',
                            $school->campus ?? 'N/A',
                            $school->classification ?? 'N/A',
                            $school->address ?? 'N/A',
                            $school->city ?? 'N/A',
                            $school->region ?? 'N/A',
                            $school->email ?? 'N/A',
                            $school->contact_number ?? 'N/A',
                            $school->website ?? 'N/A',
                            $school->is_public ? 'Public' : 'Private',
                            $school->is_active ? 'Active' : 'Inactive',
                            $school->is_partner_school ? 'Yes' : 'No'
                        ]);
                    }
                });
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('School Export Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Export failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

