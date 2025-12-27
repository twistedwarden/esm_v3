<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FlexibleStudentData extends Model
{
    use HasFactory;

    protected $table = 'flexible_student_data';

    protected $fillable = [
        'school_id',
        'student_id_number',
        'first_name',
        'last_name',
        'data',
        'headers',
        'uploaded_by',
        'uploaded_at'
    ];

    protected $casts = [
        'data' => 'array',
        'headers' => 'array',
        'uploaded_at' => 'datetime'
    ];

    public function school()
    {
        return $this->belongsTo(School::class);
    }

    /**
     * Create a new record from CSV row data
     * Smart extraction handles any format of fields and empty values
     * Always sets status as "Enrolled"
     */
    public static function createFromCSVRow(array $row, int $schoolId, string $uploadedBy, array $headers = []): self
    {
        // Extract required fields with enhanced smart mapping
        $studentId = self::extractFieldSmart($row, [
            'student_id_number', 'student_id', 'id', 'student_number', 'student_no',
            'Student ID', 'ID Number', 'student id', 'id number', 'studentid', 'idnumber',
            'Student Number', 'student no', 'studentno', 'ID', 'Student', 'STUDENT_ID',
            'STUDENT_NUMBER', 'STUDENT_NO', 'STUDENTID', 'ID_NUMBER', 'STUDENT_ID_NUMBER'
        ]);
        $firstName = self::extractFieldSmart($row, [
            'first_name', 'firstname', 'first name', 'given_name', 'given name',
            'First Name', 'Given Name', 'firstname', 'givenname', 'First', 'Given',
            'FIRST_NAME', 'FIRSTNAME', 'FIRST_NAME', 'GIVEN_NAME', 'GIVEN', 'FIRST'
        ]);
        $lastName = self::extractFieldSmart($row, [
            'last_name', 'lastname', 'last name', 'surname', 'family_name', 'family name',
            'Last Name', 'Surname', 'Family Name', 'lastname', 'surname', 'familyname',
            'Last', 'Surname', 'Family', 'LAST_NAME', 'LASTNAME', 'SURNAME', 'FAMILY_NAME'
        ]);

        // Validate required fields
        if (empty($studentId)) {
            throw new \Exception('Student ID is required');
        }
        if (empty($firstName)) {
            throw new \Exception('First name is required');
        }
        if (empty($lastName)) {
            throw new \Exception('Last name is required');
        }

        // Smart data processing - normalize and enhance the data
        $data = self::processCSVData($row);
        $data['status'] = 'Enrolled';
        $data['is_currently_enrolled'] = true;

        // Create new record
        return self::create([
            'school_id' => $schoolId,
            'student_id_number' => $studentId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'data' => $data,
            'headers' => $headers,
            'uploaded_by' => $uploadedBy,
            'uploaded_at' => now()
        ]);
    }

    /**
     * Extract field value using multiple possible field names
     */
    private static function extractField(array $row, array $possibleNames): ?string
    {
        foreach ($possibleNames as $name) {
            if (isset($row[$name]) && !empty(trim($row[$name]))) {
                return trim($row[$name]);
            }
        }
        return null;
    }

    /**
     * Enhanced smart field extraction with fuzzy matching
     */
    private static function extractFieldSmart(array $row, array $possibleNames): ?string
    {
        // First try exact matches
        foreach ($possibleNames as $name) {
            if (isset($row[$name]) && !empty(trim($row[$name]))) {
                return trim($row[$name]);
            }
        }

        // Try case-insensitive matches
        foreach ($possibleNames as $name) {
            foreach ($row as $key => $value) {
                if (strcasecmp($key, $name) === 0 && !empty(trim($value))) {
                    return trim($value);
                }
            }
        }

        // Try partial matches (contains)
        foreach ($possibleNames as $name) {
            foreach ($row as $key => $value) {
                if (stripos($key, $name) !== false && !empty(trim($value))) {
                    return trim($value);
                }
            }
        }

        // Try word-based matches
        foreach ($possibleNames as $name) {
            $nameWords = preg_split('/[\s_-]+/', strtolower($name));
            foreach ($row as $key => $value) {
                $keyWords = preg_split('/[\s_-]+/', strtolower($key));
                $matchCount = 0;
                foreach ($nameWords as $nameWord) {
                    foreach ($keyWords as $keyWord) {
                        if (strpos($keyWord, $nameWord) !== false || strpos($nameWord, $keyWord) !== false) {
                            $matchCount++;
                            break;
                        }
                    }
                }
                if ($matchCount >= count($nameWords) * 0.5 && !empty(trim($value))) {
                    return trim($value);
                }
            }
        }

        return null;
    }

    /**
     * Process and normalize CSV data with smart field mapping
     */
    public static function processCSVData(array $row): array
    {
        $processedData = [];
        
        // Define field mappings for common variations
        $fieldMappings = [
            'year_level' => [
                'year_level', 'year level', 'yearlevel', 'grade', 'level', 'year',
                'Year Level', 'YearLevel', 'YEAR_LEVEL', 'GRADE', 'LEVEL', 'YEAR',
                'academic_year', 'academic year', 'academicyear', 'class', 'Class'
            ],
            'program' => [
                'program', 'course', 'major', 'degree', 'field', 'subject',
                'Program', 'Course', 'Major', 'Degree', 'Field', 'Subject',
                'PROGRAM', 'COURSE', 'MAJOR', 'DEGREE', 'FIELD', 'SUBJECT',
                'course_name', 'course name', 'coursename', 'program_name', 'program name'
            ],
            'enrollment_date' => [
                'enrollment_date', 'enrollment date', 'enrollmentdate', 'date', 'enrolled_date',
                'Enrollment Date', 'EnrollmentDate', 'ENROLLMENT_DATE', 'DATE', 'ENROLLED_DATE',
                'enroll_date', 'enroll date', 'enrolldate', 'admission_date', 'admission date'
            ],
            'enrollment_year' => [
                'enrollment_year', 'enrollment year', 'enrollmentyear', 'academic_year', 'academic year',
                'Enrollment Year', 'EnrollmentYear', 'ENROLLMENT_YEAR', 'ACADEMIC_YEAR',
                'school_year', 'school year', 'schoolyear', 'year', 'Year'
            ],
            'enrollment_term' => [
                'enrollment_term', 'enrollment term', 'enrollmentterm', 'term', 'semester',
                'Enrollment Term', 'EnrollmentTerm', 'ENROLLMENT_TERM', 'TERM', 'SEMESTER',
                'period', 'Period', 'PERIOD', 'quarter', 'Quarter', 'QUARTER'
            ],
            'status' => [
                'status', 'enrollment_status', 'enrollment status', 'enrollmentstatus',
                'Status', 'Enrollment Status', 'EnrollmentStatus', 'STATUS', 'ENROLLMENT_STATUS',
                'state', 'State', 'STATE', 'condition', 'Condition', 'CONDITION'
            ]
        ];

        // Process each field mapping
        foreach ($fieldMappings as $targetField => $possibleNames) {
            $value = self::extractFieldSmart($row, $possibleNames);
            if ($value !== null) {
                $processedData[$targetField] = self::normalizeValue($targetField, $value);
            }
        }

        // Add any remaining fields that weren't mapped
        foreach ($row as $key => $value) {
            if (!empty(trim($value)) && !isset($processedData[$key])) {
                $processedData[$key] = trim($value);
            }
        }

        return $processedData;
    }

    /**
     * Normalize field values based on field type
     */
    private static function normalizeValue(string $fieldName, string $value): string
    {
        $value = trim($value);
        
        switch ($fieldName) {
            case 'year_level':
                // Normalize year level formats
                $value = strtolower($value);
                if (preg_match('/\d+/', $value, $matches)) {
                    $number = $matches[0];
                    if (strpos($value, 'grade') !== false) {
                        return $number . 'th Grade';
                    } elseif (strpos($value, 'year') !== false) {
                        return $number . 'st Year';
                    }
                }
                return ucwords($value);
                
            case 'program':
                // Normalize program names
                return ucwords(strtolower($value));
                
            case 'enrollment_date':
                // Normalize date formats
                try {
                    $date = new \DateTime($value);
                    return $date->format('Y-m-d');
                } catch (\Exception $e) {
                    return $value; // Return as-is if can't parse
                }
                
            case 'enrollment_year':
                // Normalize year formats
                if (preg_match('/(\d{4})[-\/](\d{4})/', $value, $matches)) {
                    return $matches[1] . '-' . $matches[2];
                } elseif (preg_match('/(\d{4})/', $value, $matches)) {
                    $year = intval($matches[1]);
                    return $year . '-' . ($year + 1);
                }
                return $value;
                
            case 'enrollment_term':
                // Normalize term formats
                $value = strtolower($value);
                if (strpos($value, 'first') !== false || strpos($value, '1st') !== false) {
                    return '1st Semester';
                } elseif (strpos($value, 'second') !== false || strpos($value, '2nd') !== false) {
                    return '2nd Semester';
                } elseif (strpos($value, 'summer') !== false) {
                    return 'Summer';
                }
                return ucwords($value);
                
            case 'status':
                // Normalize status values
                $value = strtolower($value);
                if (in_array($value, ['active', 'enrolled', 'current', 'present'])) {
                    return 'Enrolled';
                } elseif (in_array($value, ['inactive', 'not enrolled', 'dropped', 'withdrawn'])) {
                    return 'Not Enrolled';
                } elseif (in_array($value, ['graduated', 'completed', 'finished'])) {
                    return 'Graduated';
                }
                return ucwords($value);
                
            default:
                return $value;
        }
    }
}