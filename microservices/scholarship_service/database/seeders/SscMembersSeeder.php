<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SscMembersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Note: This creates sample SSC member data for testing.
     * In production, these users should be created in the auth service.
     */
    public function run(): void
    {
        $sscMembers = [
            // SSC Chairperson - City Administrator
            [
                'id' => 1,
                'name' => 'Hon. Dale Gonzalo C. Malapitan',
                'email' => 'mayor@caloocan.gov.ph',
                'role' => 'ssc_chairperson',
                'department' => 'Office of the City Mayor',
                'position' => 'City Mayor / SSC Chairperson',
                'phone' => '+63-2-8888-8888',
                'is_active' => true,
            ],

            // Document Verification Stage
            [
                'id' => 2,
                'name' => 'Hon. Maria Luisa C. Santos',
                'email' => 'council.education@caloocan.gov.ph',
                'role' => 'ssc_city_council',
                'department' => 'City Council - Committee on Education',
                'position' => 'Committee Chairperson',
                'phone' => '+63-2-8888-8889',
                'is_active' => true,
            ],
            [
                'id' => 3,
                'name' => 'Atty. Roberto M. Cruz',
                'email' => 'hrd@caloocan.gov.ph',
                'role' => 'ssc_hrd',
                'department' => 'Human Resource Management Department',
                'position' => 'Department Head',
                'phone' => '+63-2-8888-8890',
                'is_active' => true,
            ],
            [
                'id' => 4,
                'name' => 'Dr. Ana Maria L. Reyes',
                'email' => 'social.services@caloocan.gov.ph',
                'role' => 'ssc_social_services',
                'department' => 'Social Services Development Department',
                'position' => 'Department Head',
                'phone' => '+63-2-8888-8891',
                'is_active' => true,
            ],

            // Financial Review Stage
            [
                'id' => 5,
                'name' => 'Engr. Carlos P. Mendoza',
                'email' => 'budget@caloocan.gov.ph',
                'role' => 'ssc_budget_dept',
                'department' => 'City Budget Department',
                'position' => 'Budget Officer',
                'phone' => '+63-2-8888-8892',
                'is_active' => true,
            ],
            [
                'id' => 6,
                'name' => 'CPA Maria Elena S. Torres',
                'email' => 'accounting@caloocan.gov.ph',
                'role' => 'ssc_accounting',
                'department' => 'City Accounting Department',
                'position' => 'City Accountant',
                'phone' => '+63-2-8888-8893',
                'is_active' => true,
            ],
            [
                'id' => 7,
                'name' => 'CPA Juan Carlos D. Villanueva',
                'email' => 'treasurer@caloocan.gov.ph',
                'role' => 'ssc_treasurer',
                'department' => 'City Treasurer\'s Office',
                'position' => 'City Treasurer',
                'phone' => '+63-2-8888-8894',
                'is_active' => true,
            ],

            // Academic Review Stage
            [
                'id' => 8,
                'name' => 'Dr. Patricia A. Dela Cruz',
                'email' => 'education.affairs@caloocan.gov.ph',
                'role' => 'ssc_education_affairs',
                'department' => 'Education Affairs Unit',
                'position' => 'Unit Head',
                'phone' => '+63-2-8888-8895',
                'is_active' => true,
            ],
            [
                'id' => 9,
                'name' => 'Ms. Jennifer L. Morales',
                'email' => 'qcydo@caloocan.gov.ph',
                'role' => 'ssc_qcydo',
                'department' => 'Quezon City Youth Development Office',
                'position' => 'Office Head',
                'phone' => '+63-2-8888-8896',
                'is_active' => true,
            ],
            [
                'id' => 10,
                'name' => 'Arch. Miguel R. Santiago',
                'email' => 'planning@caloocan.gov.ph',
                'role' => 'ssc_planning_dept',
                'department' => 'City Planning and Development Department',
                'position' => 'Department Head',
                'phone' => '+63-2-8888-8897',
                'is_active' => true,
            ],
            [
                'id' => 11,
                'name' => 'Dr. Rosario M. Bautista',
                'email' => 'schools.division@caloocan.gov.ph',
                'role' => 'ssc_schools_division',
                'department' => 'Schools Division Office, Quezon City',
                'position' => 'Schools Division Superintendent',
                'phone' => '+63-2-8888-8898',
                'is_active' => true,
            ],
            [
                'id' => 12,
                'name' => 'Dr. Francisco J. Aguilar',
                'email' => 'qcu@caloocan.gov.ph',
                'role' => 'ssc_qcu',
                'department' => 'Quezon City University',
                'position' => 'University President',
                'phone' => '+63-2-8888-8899',
                'is_active' => true,
            ],

            // Backup/Alternate Members
            [
                'id' => 13,
                'name' => 'Hon. Ricardo T. Gutierrez',
                'email' => 'council.education.alt@caloocan.gov.ph',
                'role' => 'ssc_city_council',
                'department' => 'City Council - Committee on Education',
                'position' => 'Committee Vice-Chairperson',
                'phone' => '+63-2-8888-8900',
                'is_active' => false,
            ],
            [
                'id' => 14,
                'name' => 'Ms. Lourdes C. Fernandez',
                'email' => 'budget.alt@caloocan.gov.ph',
                'role' => 'ssc_budget_dept',
                'department' => 'City Budget Department',
                'position' => 'Assistant Budget Officer',
                'phone' => '+63-2-8888-8901',
                'is_active' => false,
            ],
            [
                'id' => 15,
                'name' => 'Dr. Antonio M. Rodriguez',
                'email' => 'education.affairs.alt@caloocan.gov.ph',
                'role' => 'ssc_education_affairs',
                'department' => 'Education Affairs Unit',
                'position' => 'Assistant Unit Head',
                'phone' => '+63-2-8888-8902',
                'is_active' => false,
            ],
        ];

        // Note: In a real implementation, these users would be created in the auth service
        // This seeder is for demonstration purposes only
        $this->command->info('SSC Members data prepared:');
        $this->command->info('Total SSC members: ' . count($sscMembers));
        $this->command->info('Active members: ' . collect($sscMembers)->where('is_active', true)->count());
        $this->command->info('Inactive/backup members: ' . collect($sscMembers)->where('is_active', false)->count());
        
        $this->command->table(
            ['ID', 'Name', 'Role', 'Department', 'Position', 'Email', 'Status'],
            collect($sscMembers)->map(function ($member) {
                return [
                    $member['id'],
                    $member['name'],
                    $member['role'],
                    $member['department'],
                    $member['position'],
                    $member['email'],
                    $member['is_active'] ? 'Active' : 'Inactive'
                ];
            })->toArray()
        );

        $this->command->warn('Note: These are sample SSC member profiles.');
        $this->command->warn('In production, create these users in the auth service first.');
    }
}
