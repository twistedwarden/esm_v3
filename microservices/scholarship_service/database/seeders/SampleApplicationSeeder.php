<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ScholarshipApplication;
use App\Models\Student;
use App\Models\School;
use App\Models\ScholarshipCategory;
use App\Models\ScholarshipSubcategory;
use App\Models\AcademicRecord;
use App\Models\Address;
use App\Models\FamilyMember;
use App\Models\FinancialInformation;
use Illuminate\Support\Facades\Hash;

class SampleApplicationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing categories and schools
        $categories = ScholarshipCategory::all();
        $subcategories = ScholarshipSubcategory::all();
        $schools = School::all();

        if ($categories->isEmpty() || $subcategories->isEmpty() || $schools->isEmpty()) {
            $this->command->error('Please run the other seeders first (ScholarshipCategorySeeder, SchoolSeeder, etc.)');
            return;
        }

        // Create sample students with applications
        $sampleData = [
            [
                'student' => [
                    'first_name' => 'Juan',
                    'middle_name' => 'Santos',
                    'last_name' => 'Cruz',
                    'student_id_number' => 'STU-2024-001',
                    'email_address' => 'juan.cruz@student.caloocan.edu.ph',
                    'contact_number' => '+63-912-345-6789',
                    'birth_date' => '2005-03-15',
                    'gender' => 'male',
                    'civil_status' => 'single',
                    'citizenship' => 'Filipino',
                    'religion' => 'Catholic',
                ],
                'address' => [
                    'address_line_1' => '123 Barangay Road',
                    'address_line_2' => 'Near City Hall',
                    'barangay' => 'Barangay 1',
                    'city' => 'Caloocan City',
                    'province' => 'Metro Manila',
                    'postal_code' => '1400',
                    'country' => 'Philippines',
                ],
                'family' => [
                    'father_name' => 'Pedro Cruz',
                    'father_occupation' => 'Driver',
                    'father_monthly_income' => 15000,
                    'mother_name' => 'Maria Cruz',
                    'mother_occupation' => 'Vendor',
                    'mother_monthly_income' => 8000,
                    'total_family_income' => 23000,
                    'number_of_siblings' => 2,
                ],
                'academic' => [
                    'educational_level' => 'TERTIARY/COLLEGE',
                    'program' => 'Bachelor of Science in Computer Science',
                    'major' => 'Software Engineering',
                    'year_level' => '2nd Year',
                    'school_year' => '2024-2025',
                    'school_term' => '1st Semester',
                    'general_weighted_average' => 1.75,
                    'units_enrolled' => 21,
                ],
                'application' => [
                    'type' => 'new',
                    'financial_need_description' => 'Family income is insufficient to cover tuition and living expenses. Father works as a driver with irregular income, mother sells goods in the market. Have 2 younger siblings also in school.',
                    'requested_amount' => 25000,
                    'marginalized_groups' => ['indigent_family'],
                    'is_school_at_caloocan' => true,
                    'digital_wallets' => ['GCash'],
                    'wallet_account_number' => '09123456789',
                ]
            ],
            [
                'student' => [
                    'first_name' => 'Maria',
                    'middle_name' => 'Garcia',
                    'last_name' => 'Santos',
                    'student_id_number' => 'STU-2024-002',
                    'email_address' => 'maria.santos@student.caloocan.edu.ph',
                    'contact_number' => '+63-923-456-7890',
                    'birth_date' => '2004-07-22',
                    'gender' => 'female',
                    'civil_status' => 'single',
                    'citizenship' => 'Filipino',
                    'religion' => 'Christian',
                ],
                'address' => [
                    'address_line_1' => '456 Rizal Street',
                    'address_line_2' => 'Block 5, Lot 12',
                    'barangay' => 'Barangay 2',
                    'city' => 'Caloocan City',
                    'province' => 'Metro Manila',
                    'postal_code' => '1401',
                    'country' => 'Philippines',
                ],
                'family' => [
                    'father_name' => 'Carlos Santos',
                    'father_occupation' => 'Construction Worker',
                    'father_monthly_income' => 12000,
                    'mother_name' => 'Ana Santos',
                    'mother_occupation' => 'Housewife',
                    'mother_monthly_income' => 0,
                    'total_family_income' => 12000,
                    'number_of_siblings' => 3,
                ],
                'academic' => [
                    'educational_level' => 'TERTIARY/COLLEGE',
                    'program' => 'Bachelor of Science in Education',
                    'major' => 'Elementary Education',
                    'year_level' => '3rd Year',
                    'school_year' => '2024-2025',
                    'school_term' => '1st Semester',
                    'general_weighted_average' => 1.50,
                    'units_enrolled' => 18,
                ],
                'application' => [
                    'type' => 'new',
                    'financial_need_description' => 'Single income family with father working in construction. Mother is a housewife caring for 3 children. Monthly income is barely enough for basic needs.',
                    'requested_amount' => 20000,
                    'marginalized_groups' => ['indigent_family', 'single_income'],
                    'is_school_at_caloocan' => true,
                    'digital_wallets' => ['PayMaya'],
                    'wallet_account_number' => '09234567890',
                ]
            ],
            [
                'student' => [
                    'first_name' => 'Jose',
                    'middle_name' => 'Reyes',
                    'last_name' => 'Gonzales',
                    'student_id_number' => 'STU-2024-003',
                    'email_address' => 'jose.gonzales@student.caloocan.edu.ph',
                    'contact_number' => '+63-934-567-8901',
                    'birth_date' => '2006-01-10',
                    'gender' => 'male',
                    'civil_status' => 'single',
                    'citizenship' => 'Filipino',
                    'religion' => 'Catholic',
                ],
                'address' => [
                    'address_line_1' => '789 Bonifacio Avenue',
                    'address_line_2' => 'Unit 3B',
                    'barangay' => 'Barangay 3',
                    'city' => 'Caloocan City',
                    'province' => 'Metro Manila',
                    'postal_code' => '1402',
                    'country' => 'Philippines',
                ],
                'family' => [
                    'father_name' => 'Miguel Gonzales',
                    'father_occupation' => 'Security Guard',
                    'father_monthly_income' => 18000,
                    'mother_name' => 'Elena Gonzales',
                    'mother_occupation' => 'Cleaner',
                    'mother_monthly_income' => 10000,
                    'total_family_income' => 28000,
                    'number_of_siblings' => 1,
                ],
                'academic' => [
                    'educational_level' => 'SENIOR HIGH SCHOOL',
                    'program' => 'STEM Strand',
                    'year_level' => 'Grade 12',
                    'school_year' => '2024-2025',
                    'school_term' => '1st Semester',
                    'general_weighted_average' => 1.85,
                    'units_enrolled' => 25,
                ],
                'application' => [
                    'type' => 'new',
                    'financial_need_description' => 'Parents work hard to provide for the family but income is still insufficient for school expenses. Both parents have low-paying jobs and have another child to support.',
                    'requested_amount' => 15000,
                    'marginalized_groups' => ['low_income_family'],
                    'is_school_at_caloocan' => true,
                ]
            ]
        ];

        foreach ($sampleData as $data) {
            // Create student
            $student = Student::create([
                'citizen_id' => 'CIT-' . date('Y') . '-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT),
                'user_id' => null, // Will be set when user account is created
                'student_id_number' => $data['student']['student_id_number'],
                'first_name' => $data['student']['first_name'],
                'middle_name' => $data['student']['middle_name'],
                'last_name' => $data['student']['last_name'],
                'email_address' => $data['student']['email_address'],
                'contact_number' => $data['student']['contact_number'],
                'birth_date' => $data['student']['birth_date'],
                'sex' => ucfirst($data['student']['gender']), // Capitalize to match enum
                'civil_status' => ucfirst($data['student']['civil_status']), // Capitalize to match enum
                'nationality' => $data['student']['citizenship'],
                'religion' => $data['student']['religion'],
                'is_currently_enrolled' => true,
            ]);

            // Create address
            Address::create([
                'student_id' => $student->id,
                'type' => 'permanent',
                'address_line_1' => $data['address']['address_line_1'],
                'address_line_2' => $data['address']['address_line_2'],
                'barangay' => $data['address']['barangay'],
                'city' => $data['address']['city'],
                'province' => $data['address']['province'],
                'zip_code' => $data['address']['postal_code'],
            ]);

            // Create family member (father)
            $fatherName = explode(' ', $data['family']['father_name']);
            FamilyMember::create([
                'student_id' => $student->id,
                'relationship' => 'father',
                'first_name' => $fatherName[0] ?? '',
                'middle_name' => $fatherName[1] ?? '',
                'last_name' => $fatherName[2] ?? $fatherName[1] ?? '',
                'occupation' => $data['family']['father_occupation'],
                'monthly_income' => $data['family']['father_monthly_income'],
                'is_alive' => true,
                'is_employed' => true,
                'contact_number' => '+63-900-000-0000',
            ]);

            // Create family member (mother)
            $motherName = explode(' ', $data['family']['mother_name']);
            FamilyMember::create([
                'student_id' => $student->id,
                'relationship' => 'mother',
                'first_name' => $motherName[0] ?? '',
                'middle_name' => $motherName[1] ?? '',
                'last_name' => $motherName[2] ?? $motherName[1] ?? '',
                'occupation' => $data['family']['mother_occupation'],
                'monthly_income' => $data['family']['mother_monthly_income'],
                'is_alive' => true,
                'is_employed' => $data['family']['mother_monthly_income'] > 0,
                'contact_number' => '+63-900-000-0001',
            ]);

            // Create financial information
            $incomeRange = $data['family']['total_family_income'] <= 10000 ? '5,000-10,000' : 
                          ($data['family']['total_family_income'] <= 15000 ? '10,000-15,000' : 
                          ($data['family']['total_family_income'] <= 20000 ? '15,000-20,000' : 
                          ($data['family']['total_family_income'] <= 30000 ? '20,000-30,000' : '30,000-50,000')));
            
            FinancialInformation::create([
                'student_id' => $student->id,
                'family_monthly_income_range' => $incomeRange,
                'monthly_income' => $data['family']['total_family_income'],
                'number_of_siblings' => $data['family']['number_of_siblings'],
                'siblings_currently_enrolled' => rand(0, $data['family']['number_of_siblings']),
                'home_ownership_status' => 'rented',
                'is_4ps_beneficiary' => rand(0, 1) === 1,
            ]);

            // Get random category and subcategory
            $category = $categories->random();
            $subcategory = $subcategories->where('scholarship_category_id', $category->id)->first() ?? $subcategories->random();
            $school = $schools->random();

            // Create academic record
            $academicRecord = AcademicRecord::create([
                'student_id' => $student->id,
                'school_id' => $school->id,
                'educational_level' => $data['academic']['educational_level'],
                'program' => $data['academic']['program'] ?? null,
                'major' => $data['academic']['major'] ?? null,
                'track_specialization' => $data['academic']['program'] ?? null,
                'year_level' => $data['academic']['year_level'],
                'school_year' => $data['academic']['school_year'],
                'school_term' => $data['academic']['school_term'],
                'general_weighted_average' => $data['academic']['general_weighted_average'],
                'units_enrolled' => $data['academic']['units_enrolled'],
                'is_current' => true,
            ]);

            // Note: current_academic_record_id field doesn't exist in students table

            // Generate application number
            $applicationNumber = 'APP-' . date('Y') . '-' . str_pad(
                ScholarshipApplication::count() + 1, 
                6, 
                '0', 
                STR_PAD_LEFT
            );

            // Create scholarship application
            ScholarshipApplication::create([
                'application_number' => $applicationNumber,
                'student_id' => $student->id,
                'category_id' => $category->id,
                'subcategory_id' => $subcategory->id,
                'school_id' => $school->id,
                'type' => $data['application']['type'],
                'status' => 'submitted',
                'financial_need_description' => $data['application']['financial_need_description'],
                'requested_amount' => $data['application']['requested_amount'],
                'approved_amount' => null,
                'marginalized_groups' => json_encode($data['application']['marginalized_groups']),
                'is_school_at_caloocan' => $data['application']['is_school_at_caloocan'],
                'digital_wallets' => json_encode($data['application']['digital_wallets'] ?? []),
                'wallet_account_number' => $data['application']['wallet_account_number'] ?? null,
                'submitted_at' => now()->subDays(rand(1, 30)),
                'created_at' => now()->subDays(rand(1, 30)),
                'updated_at' => now()->subDays(rand(1, 30)),
            ]);
        }

        $this->command->info('Sample scholarship applications created successfully!');
    }
}
