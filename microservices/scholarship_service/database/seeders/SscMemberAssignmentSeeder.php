<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SscMemberAssignment;

class SscMemberAssignmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $members = [
            // SSC Chairperson - City Administrator
            [
                'user_id' => 1, // Assuming user_id 1 is the City Administrator
                'ssc_role' => 'chairperson',
                'review_stage' => 'final_approval',
                'is_active' => true,
                'assigned_at' => now(),
            ],

            // Document Verification Stage - City Council, HRD, Social Services
            [
                'user_id' => 2, // City Council Representative
                'ssc_role' => 'city_council',
                'review_stage' => 'document_verification',
                'is_active' => true,
                'assigned_at' => now(),
            ],
            [
                'user_id' => 3, // HRD Representative
                'ssc_role' => 'hrd',
                'review_stage' => 'document_verification',
                'is_active' => true,
                'assigned_at' => now(),
            ],
            [
                'user_id' => 4, // Social Services Representative
                'ssc_role' => 'social_services',
                'review_stage' => 'document_verification',
                'is_active' => true,
                'assigned_at' => now(),
            ],

            // Financial Review Stage - Budget Dept, Accounting, Treasurer
            [
                'user_id' => 5, // Budget Department Head
                'ssc_role' => 'budget_dept',
                'review_stage' => 'financial_review',
                'is_active' => true,
                'assigned_at' => now(),
            ],
            [
                'user_id' => 6, // Accounting Department Head
                'ssc_role' => 'accounting',
                'review_stage' => 'financial_review',
                'is_active' => true,
                'assigned_at' => now(),
            ],
            [
                'user_id' => 7, // City Treasurer
                'ssc_role' => 'treasurer',
                'review_stage' => 'financial_review',
                'is_active' => true,
                'assigned_at' => now(),
            ],

            // Academic Review Stage - Education Affairs, QCYDO, Planning Dept, Schools Division, QCU
            [
                'user_id' => 8, // Education Affairs Unit Head
                'ssc_role' => 'education_affairs',
                'review_stage' => 'academic_review',
                'is_active' => true,
                'assigned_at' => now(),
            ],
            [
                'user_id' => 9, // QCYDO Representative
                'ssc_role' => 'qcydo',
                'review_stage' => 'academic_review',
                'is_active' => true,
                'assigned_at' => now(),
            ],
            [
                'user_id' => 10, // Planning Department Head
                'ssc_role' => 'planning_dept',
                'review_stage' => 'academic_review',
                'is_active' => true,
                'assigned_at' => now(),
            ],
            [
                'user_id' => 11, // Schools Division Representative
                'ssc_role' => 'schools_division',
                'review_stage' => 'academic_review',
                'is_active' => true,
                'assigned_at' => now(),
            ],
            [
                'user_id' => 12, // QCU Representative
                'ssc_role' => 'qcu',
                'review_stage' => 'academic_review',
                'is_active' => true,
                'assigned_at' => now(),
            ],

            // Additional members for redundancy (inactive by default)
            [
                'user_id' => 13, // Backup City Council Representative
                'ssc_role' => 'city_council',
                'review_stage' => 'document_verification',
                'is_active' => false,
                'assigned_at' => now(),
            ],
            [
                'user_id' => 14, // Backup Budget Department Representative
                'ssc_role' => 'budget_dept',
                'review_stage' => 'financial_review',
                'is_active' => false,
                'assigned_at' => now(),
            ],
            [
                'user_id' => 15, // Backup Education Affairs Representative
                'ssc_role' => 'education_affairs',
                'review_stage' => 'academic_review',
                'is_active' => false,
                'assigned_at' => now(),
            ],
        ];

        foreach ($members as $member) {
            SscMemberAssignment::updateOrCreate(
                [
                    'user_id' => $member['user_id'],
                    'ssc_role' => $member['ssc_role'],
                    'review_stage' => $member['review_stage'],
                ],
                $member
            );
        }

        $this->command->info('SSC Member Assignments seeded successfully!');
        $this->command->info('Total members assigned: ' . count($members));
        $this->command->info('Active members: ' . collect($members)->where('is_active', true)->count());
    }
}
