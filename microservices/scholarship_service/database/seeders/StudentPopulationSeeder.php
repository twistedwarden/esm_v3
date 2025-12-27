<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\Student;
use App\Models\AcademicRecord;
use App\Models\ScholarshipApplication;
use App\Models\ScholarshipCategory;

class StudentPopulationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first school
        $school = School::first();
        
        if (!$school) {
            $this->command->info('No schools found. Please run school seeder first.');
            return;
        }

        // Get all students
        $students = Student::all();
        
        if ($students->isEmpty()) {
            $this->command->info('No students found. Please run student seeder first.');
            return;
        }

        // Create academic records for each student
        foreach ($students as $index => $student) {
            AcademicRecord::create([
                'student_id' => $student->id,
                'school_id' => $school->id,
                'educational_level' => 'TERTIARY/COLLEGE',
                'program' => 'Bachelor of Science in Computer Science',
                'major' => 'Software Engineering',
                'year_level' => ($index % 4) + 1, // 1st to 4th year
                'school_year' => '2024-2025',
                'school_term' => 'First Semester',
                'units_enrolled' => 18,
                'units_completed' => 15,
                'gpa' => 3.5 + ($index * 0.1),
                'general_weighted_average' => 3.5 + ($index * 0.1),
                'is_current' => true,
                'is_graduating' => $index === 2, // Third student is graduating
                'enrollment_date' => now()->subMonths(3),
            ]);
        }

        // Create scholarship categories if they don't exist
        $meritCategory = ScholarshipCategory::firstOrCreate([
            'name' => 'Merit Scholarship',
        ], [
            'description' => 'Academic excellence scholarship',
            'is_active' => true,
        ]);

        $needBasedCategory = ScholarshipCategory::firstOrCreate([
            'name' => 'Need-Based Scholarship',
        ], [
            'description' => 'Financial need scholarship',
            'is_active' => true,
        ]);

        // Create scholarship subcategories
        $subcategory = \App\Models\ScholarshipSubcategory::firstOrCreate([
            'name' => 'General Scholarship',
        ], [
            'category_id' => $meritCategory->id,
            'description' => 'General scholarship subcategory',
            'is_active' => true,
        ]);

        // Create scholarship applications for some students
        $scholarshipStudents = $students->take(2); // First 2 students get scholarships
        
        foreach ($scholarshipStudents as $index => $student) {
            ScholarshipApplication::create([
                'application_number' => 'APP-' . str_pad($student->id, 6, '0', STR_PAD_LEFT),
                'student_id' => $student->id,
                'school_id' => $school->id,
                'category_id' => $index === 0 ? $meritCategory->id : $needBasedCategory->id,
                'subcategory_id' => $subcategory->id,
                'type' => 'new',
                'status' => 'approved',
                'financial_need_description' => 'Financial assistance needed for education',
                'requested_amount' => 50000,
                'approved_amount' => 50000,
                'submitted_at' => now()->subDays(30),
                'approved_at' => now()->subDays(25),
            ]);
        }

        $this->command->info('Student population data created successfully!');
        $this->command->info('Created ' . $students->count() . ' academic records');
        $this->command->info('Created ' . $scholarshipStudents->count() . ' scholarship applications');
    }
}
