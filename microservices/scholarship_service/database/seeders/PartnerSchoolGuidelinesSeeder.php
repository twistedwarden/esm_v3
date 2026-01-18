<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PartnerSchoolGuideline;
use Illuminate\Support\Facades\DB;

class PartnerSchoolGuidelinesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing data
        DB::table('partner_school_guidelines')->truncate();

        $guidelines = [
            // REQUIREMENTS Section - Documents needed for verification
            [
                'section' => 'requirements',
                'title' => 'Valid Institutional Accreditation',
                'content' => 'Submit valid accreditation certificate from DepEd (for basic education) or CHED (for tertiary institutions). Document must be current and in good standing.',
                'display_order' => 1,
                'is_active' => true,
            ],
            [
                'section' => 'requirements',
                'title' => 'Legal Registration Documents',
                'content' => 'Provide Certificate of Registration, Business Permit, and Tax Identification Number (TIN) to verify legal operation status.',
                'display_order' => 2,
                'is_active' => true,
            ],
            [
                'section' => 'requirements',
                'title' => 'Authorized Representative Designation',
                'content' => 'Submit letter of designation for authorized representative with contact details and proof of authority to act on behalf of the institution.',
                'display_order' => 3,
                'is_active' => true,
            ],
            [
                'section' => 'requirements',
                'title' => 'Memorandum of Agreement',
                'content' => 'Submit the signed Memorandum of Agreement (MOA) between the school and the scholarship provider.',
                'display_order' => 4,
                'is_active' => true,
            ],

            // BENEFITS Section - What partner schools receive
            [
                'section' => 'benefits',
                'title' => 'Priority Scholarship Allocation',
                'content' => 'Partner schools receive priority consideration for scholarship slots and expedited application processing for qualified students.',
                'display_order' => 1,
                'is_active' => true,
            ],
            [
                'section' => 'benefits',
                'title' => 'Technical Support Access',
                'content' => 'Access to dedicated support team, online portal, training materials, and regular updates on scholarship programs.',
                'display_order' => 2,
                'is_active' => true,
            ],

            // RESPONSIBILITIES Section - Ongoing obligations with proof requirements
            [
                'section' => 'responsibilities',
                'title' => 'Student Verification System',
                'content' => 'Maintain accurate student records and provide enrollment certifications. Submit sample verification documents to demonstrate capability.',
                'display_order' => 1,
                'is_active' => true,
            ],
            [
                'section' => 'responsibilities',
                'title' => 'Quarterly Reporting Compliance',
                'content' => 'Submit quarterly reports on scholarship recipients\' academic progress and enrollment status. Provide sample reporting format during application.',
                'display_order' => 2,
                'is_active' => true,
            ],
            [
                'section' => 'responsibilities',
                'title' => 'Data Privacy and Security',
                'content' => 'Demonstrate compliance with Data Privacy Act. Submit data protection policies and security measures documentation.',
                'display_order' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($guidelines as $guideline) {
            PartnerSchoolGuideline::create($guideline);
        }

        $this->command->info('Partner School Guidelines seeded successfully!');
    }
}
