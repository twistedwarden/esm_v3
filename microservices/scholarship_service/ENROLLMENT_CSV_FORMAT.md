# Enrollment Data CSV Format Guide

This guide explains the required format for CSV files containing partner school enrollment data.

## Required CSV Format

### File Requirements
- **File Type**: CSV (Comma-Separated Values)
- **File Size**: Maximum 10MB
- **Encoding**: UTF-8 (recommended)
- **Line Endings**: Unix (LF) or Windows (CRLF)

### Required Columns

The following columns are **mandatory** and must be present in your CSV file:

| Column Name | Description | Example | Notes |
|-------------|-------------|---------|-------|
| `student_id_number` | Student's unique ID number | `2024-001234` | Must be unique per school |
| `first_name` | Student's first name | `Juan` | Case insensitive |
| `last_name` | Student's last name | `Dela Cruz` | Case insensitive |
| `enrollment_year` | Academic year | `2024-2025` | Format: YYYY-YYYY |
| `enrollment_term` | Academic term | `1st Semester` | See valid terms below |

### Optional Columns

The following columns are **optional** but recommended:

| Column Name | Description | Example | Default Value |
|-------------|-------------|---------|---------------|
| `is_currently_enrolled` | Current enrollment status | `true`, `false`, `yes`, `no`, `1`, `0` | `true` |
| `enrollment_date` | Date of enrollment | `2024-08-15` | `null` |
| `program` | Academic program | `Bachelor of Science in Computer Science` | `null` |
| `year_level` | Academic year level | `1st Year`, `2nd Year`, `3rd Year`, `4th Year` | `null` |

## Valid Values

### Enrollment Terms
- `1st Semester`
- `2nd Semester`
- `Summer`
- `Midyear`

### Enrollment Status
- `true`, `1`, `yes`, `y` → Currently enrolled
- `false`, `0`, `no`, `n` → Not currently enrolled

### Date Format
- Use `YYYY-MM-DD` format (e.g., `2024-08-15`)
- Invalid dates will be ignored

## Sample CSV File

```csv
student_id_number,first_name,last_name,enrollment_year,enrollment_term,is_currently_enrolled,enrollment_date,program,year_level
2024-001234,Juan,Dela Cruz,2024-2025,1st Semester,true,2024-08-15,Bachelor of Science in Computer Science,1st Year
2024-001235,Maria,Santos,2024-2025,1st Semester,true,2024-08-16,Bachelor of Arts in Psychology,2nd Year
2024-001236,John,Smith,2024-2025,1st Semester,false,2024-08-10,Bachelor of Science in Engineering,3rd Year
2024-001237,Ana,Garcia,2024-2025,2nd Semester,true,,Bachelor of Science in Nursing,4th Year
```

## Upload Process

### 1. Duplicate Handling
The system will check for duplicates in two ways:

#### Within CSV File
- Duplicate records within the same CSV file are detected
- You'll be warned about internal duplicates before upload

#### Against Database
- Records that already exist in the database are identified
- You can choose to update existing records or skip them

### 2. Update Modes

#### Merge Mode (Recommended)
- Updates existing records with new data
- Adds new records that don't exist
- Preserves historical data

#### Replace Mode
- Clears all existing enrollment data for the school
- Uploads only the new data from CSV
- **Use with caution** - this action cannot be undone

### 3. Upload Steps
1. **Select School**: Choose the partner school
2. **Upload File**: Select your CSV file
3. **Check Duplicates**: System analyzes the file
4. **Review Warnings**: Address any duplicate issues
5. **Choose Mode**: Select merge or replace
6. **Confirm Upload**: Complete the import process

## Common Issues and Solutions

### Issue: "Missing required column" error
**Solution**: Ensure all required columns are present and spelled correctly

### Issue: "Invalid file type" error
**Solution**: Save your file as `.csv` format, not Excel (`.xlsx`)

### Issue: "File too large" error
**Solution**: Split your data into smaller files (max 10MB each)

### Issue: "Duplicate records found"
**Solution**: 
- Review the duplicate list
- Choose appropriate update mode
- Consider cleaning your data before upload

### Issue: "Invalid date format" error
**Solution**: Use `YYYY-MM-DD` format for dates

## Best Practices

### 1. Data Preparation
- Clean your data before uploading
- Remove unnecessary spaces and special characters
- Ensure student ID numbers are consistent
- Use standard term names

### 2. File Organization
- Use descriptive filenames with dates
- Include school name in filename
- Keep backup copies of your data

### 3. Regular Updates
- Upload data regularly (monthly recommended)
- Update enrollment status changes promptly
- Remove graduated or withdrawn students

### 4. Data Quality
- Verify student ID numbers are correct
- Check name spellings
- Ensure enrollment dates are accurate
- Validate program names

## Template Download

You can download a CSV template from the admin portal that includes:
- All required and optional columns
- Sample data showing proper format
- Column headers in correct order

## Support

If you encounter issues with CSV uploads:

1. **Check the error message** - it usually indicates the specific problem
2. **Download the template** - use it as a reference for proper format
3. **Review your data** - ensure it matches the required format
4. **Contact support** - if problems persist, contact the system administrator

## Technical Notes

### Character Encoding
- The system expects UTF-8 encoding
- Special characters (ñ, ü, etc.) are supported
- Avoid using non-standard characters

### Line Endings
- Both Unix (LF) and Windows (CRLF) line endings are supported
- The system automatically detects and handles both

### File Validation
- Files are validated before processing
- Invalid records are skipped with warnings
- Processing continues even if some records fail

### Performance
- Large files are processed in batches
- Progress is shown during upload
- You can safely close the browser after starting upload

---

*Last updated: January 2025*

