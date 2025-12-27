import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { scholarshipApiService, type School, type ScholarshipCategory, type Student } from '../../services/scholarshipApiService';
import { useAuthStore } from '../../store/v1authStore';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';

// Local storage key for form data
const FORM_STORAGE_KEY = 'scholarship_application_form_data';


// Helper functions for local storage
const saveFormDataToStorage = (formData: any, currentStep: number) => {
  try {
    const dataToSave = {
      formData,
      currentStep,
      timestamp: Date.now()
    };
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Failed to save form data to localStorage:', error);
  }
};

const loadFormDataFromStorage = () => {
  try {
    const savedData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // Check if data is not too old (e.g., within 7 days)
      const isDataFresh = Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000;
      if (isDataFresh) {
        return parsed;
      } else {
        // Clear old data
        localStorage.removeItem(FORM_STORAGE_KEY);
      }
    }
  } catch (error) {
    console.error('Failed to load form data from localStorage:', error);
  }
  return null;
};

const clearFormDataFromStorage = () => {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear form data from localStorage:', error);
  }
};

export const NewApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const [currentStep, setCurrentStep] = useState(1);
  const [schools, setSchools] = useState<School[]>([]);
  const [scholarshipCategories, setScholarshipCategories] = useState<ScholarshipCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [gwaInputFormat, setGwaInputFormat] = useState<'gwa' | 'percentage'>('percentage');
  const [studentIdType, setStudentIdType] = useState<'school' | 'lrn'>('school');
  const [isCheckingApplications, setIsCheckingApplications] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showReligionOther, setShowReligionOther] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    clearErrors,
    reset,
    setValue,
  } = useForm<any>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      // Personal Information
      lastName: '',
      firstName: '',
      middleName: '',
      extensionName: '',
      studentId: '',
      sex: '',
      civilStatus: '',
      dateOfBirth: '',
      religion: '',
      religionOther: '',
      nationality: 'Filipino',
      birthPlace: '',
      heightCm: '',
      weightKg: '',
      isPwd: undefined,
      pwdSpecification: '',
      presentAddress: '',
      barangay: '',
      district: '',
      city: 'QUEZON CITY',
      zipCode: '',
      contactNumber: '',
      emailAddress: '',
      
      // Parent/Guardian Information
      motherFirstName: '',
      motherLastName: '',
      motherMiddleName: '',
      motherExtensionName: '',
      motherContactNumber: '',
      motherOccupation: '',
      motherMonthlyIncome: '',
      isMotherAvailable: '',
      isFatherAvailable: '',
      fatherFirstName: '',
      fatherLastName: '',
      fatherMiddleName: '',
      fatherExtensionName: '',
      fatherContactNumber: '',
      fatherOccupation: '',
      fatherMonthlyIncome: '',
      
      // Emergency Contact
      emergencyContactName: '',
      emergencyContactNumber: '',
      emergencyContactRelationship: '',
      
      // Employment & Financial
      isStudentEmployed: '',
      studentOccupation: '',
      studentMonthlyIncome: '',
      totalFamilyMonthlyIncome: '',
      totalAnnualIncome: '',
      numberOfSiblings: '',
      numberOfSiblingsInSchool: '',
      homeOwnershipStatus: '',
      
      // Marginalized Groups & Benefits
      isSoloParent: '',
      isIndigenousGroup: '',
      indigenousGroupName: '',
      is4PsBeneficiary: '',
      isPwdBeneficiary: '',
      
      // Voter & Payment
      isRegisteredVoter: '',
      voterNationality: '',
      paymentMethod: '',
      accountNumber: '',
      preferredMobileNumber: '',
      
      // Financial Need
      financialNeedDescription: '',
      
      // Scholarship Information
      scholarshipCategory: '',
      scholarshipSubCategory: '',
      howDidYouKnow: [],
      
      // Academic Information
      educationalLevel: 'TERTIARY/COLLEGE',
      isSchoolAtCaloocan: 'YES',
      schoolName: '',
      campus: '',
      unitsEnrolled: '',
      gradeYearLevel: '1st Year',
      courseProgram: '',
      major: '',
      schoolTerm: '1st Semester',
      schoolYear: '2024-2025',
      previousSchool: '',
      previousSchoolAddress: '',
      unitsCompleted: 'N/A',
      generalWeightedAverage: '',
      
      // Legacy/deprecated fields
      marginalizedGroups: [],
      digitalWallets: [],
      birthCertificate: null,
      reportCard: null,
      incomeCertificate: null,
      barangayCertificate: null,
      idPicture: null,
      otherDocuments: null,
    },
  });

  const isPwd = watch('isPwd');
  const paymentMethod = watch('paymentMethod');
  const isMotherAvailable = watch('isMotherAvailable');
  const isFatherAvailable = watch('isFatherAvailable');
  const isIndigenousGroup = watch('isIndigenousGroup');
  const isStudentEmployed = watch('isStudentEmployed');
  const educationalLevel = watch('educationalLevel');

  // Define field groups for each step
  const stepFields = {
    1: ['lastName', 'firstName', 'studentId', 'sex', 'civilStatus', 'dateOfBirth', 'religion', 'nationality', 'birthPlace', 'presentAddress', 'barangay', 'district', 'city', 'zipCode', 'contactNumber', 'emailAddress', 'isPwd'],
    2: ['motherFirstName', 'motherLastName', 'motherContactNumber', 'motherOccupation', 'motherMonthlyIncome', 'isMotherAvailable', 'isFatherAvailable', 'emergencyContactName', 'emergencyContactNumber', 'emergencyContactRelationship'],
    3: ['isStudentEmployed', 'totalFamilyMonthlyIncome', 'numberOfSiblings', 'numberOfSiblingsInSchool', 'homeOwnershipStatus', 'isSoloParent', 'isIndigenousGroup', 'is4PsBeneficiary', 'isRegisteredVoter', 'paymentMethod', 'financialNeedDescription'],
    4: ['scholarshipCategory', 'scholarshipSubCategory', 'howDidYouKnow', 'educationalLevel', 'isSchoolAtCaloocan', 'schoolName', 'campus', 'unitsEnrolled', 'gradeYearLevel', 'courseProgram', 'schoolTerm', 'schoolYear', 'previousSchool', 'unitsCompleted', 'generalWeightedAverage']
  };


  // Function to validate current step before proceeding
  const validateCurrentStep = async (step: number): Promise<boolean> => {
    // In edit mode, use more lenient validation
    if (isEditMode) {
      return await validateCurrentStepEditMode(step);
    }
    let fieldsToValidate = stepFields[step as keyof typeof stepFields] || [];
    
    // For step 1, conditionally include pwdSpecification based on isPwd
    if (step === 1) {
      const currentIsPwd = watch('isPwd');
      if (currentIsPwd === true) {
        fieldsToValidate = [...fieldsToValidate, 'pwdSpecification'];
      }
    }
    
    // For step 2, conditionally include mother's info based on isMotherAvailable
    if (step === 2) {
      const currentIsMotherAvailable = watch('isMotherAvailable');
      if (currentIsMotherAvailable === 'yes') {
        fieldsToValidate = [...fieldsToValidate, 'motherFirstName', 'motherLastName', 'motherContactNumber', 'motherOccupation', 'motherMonthlyIncome'];
      }
      
      // For step 2, conditionally include father's info based on isFatherAvailable
      const currentIsFatherAvailable = watch('isFatherAvailable');
      if (currentIsFatherAvailable === 'yes') {
        fieldsToValidate = [...fieldsToValidate, 'fatherFirstName', 'fatherLastName', 'fatherContactNumber', 'fatherOccupation', 'fatherMonthlyIncome'];
      }
    }
    
    // For step 3, conditionally validate fields
    if (step === 3) {
      const currentPaymentMethod = watch('paymentMethod');
      const currentIsStudentEmployed = watch('isStudentEmployed');
      const currentIsIndigenousGroup = watch('isIndigenousGroup');
      
      // Add accountNumber if payment method is not Cash
      if (currentPaymentMethod && currentPaymentMethod !== 'Cash') {
        fieldsToValidate = [...fieldsToValidate, 'accountNumber'];
      }
      
      // Add student occupation and income if employed
      if (currentIsStudentEmployed === 'yes') {
        fieldsToValidate = [...fieldsToValidate, 'studentOccupation', 'studentMonthlyIncome'];
      }
      
      // Add indigenous group name if member
      if (currentIsIndigenousGroup === 'yes') {
        fieldsToValidate = [...fieldsToValidate, 'indigenousGroupName'];
      }
    }
    
    // For step 4, conditionally validate major field for college students
    if (step === 4) {
      const currentEducationalLevel = watch('educationalLevel');
      if (currentEducationalLevel === 'TERTIARY/COLLEGE') {
        fieldsToValidate = [...fieldsToValidate, 'major'];
      }
    }
    
    
    console.log(`Validating step ${step} fields:`, fieldsToValidate);
    console.log(`Current step is: ${currentStep}`);
    
    // Clear errors for fields not in current step
    const allFields = [
      ...stepFields[1],
      ...stepFields[2], 
      ...stepFields[3],
      ...stepFields[4]
    ];
    // Clear errors for fields not in current step
    fieldsToValidate.forEach(field => {
      if (allFields.includes(field)) {
        clearErrors(field as any);
      }
    });
    
    // Small delay to ensure errors are cleared and form state is updated
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Only validate the specific fields for the current step
    const isValid = await trigger(fieldsToValidate);
    console.log(`Step ${step} validation result:`, isValid);
    
    // Log current form values for debugging
    const currentValues = watch();
    console.log('Current form values:', currentValues);
    
    // Log which fields have errors
    console.log('Form errors:', errors);
    console.log('isPwd value:', watch('isPwd'));
    console.log('isPwd type:', typeof watch('isPwd'));
    
    // Log specific field values for step 1
    if (step === 1) {
      console.log('Step 1 field values:');
      fieldsToValidate.forEach(field => {
        const value = watch(field as any);
        console.log(`${field}:`, value, typeof value);
      });
    }
    
    return isValid;
  };

  // Function to handle step navigation
  const handleStepNavigation = (targetStep: number) => {
    console.log(`Navigating to step ${targetStep} from step ${currentStep}`);
    setCurrentStep(targetStep);
  };

  // More lenient validation for edit mode
  const validateCurrentStepEditMode = async (step: number): Promise<boolean> => {
    console.log(`Edit mode validation for step ${step}`);
    
    // In edit mode, we're more lenient - only validate truly critical fields
    let criticalFields: string[] = [];
    
    switch (step) {
      case 1:
        criticalFields = ['lastName', 'firstName', 'sex', 'civilStatus', 'dateOfBirth', 'contactNumber', 'emailAddress'];
        break;
      case 2:
        criticalFields = ['isMotherAvailable', 'isFatherAvailable'];
        break;
      case 3:
        criticalFields = ['totalFamilyMonthlyIncome', 'paymentMethod'];
        break;
      case 4:
        criticalFields = ['scholarshipCategory', 'educationalLevel', 'schoolName', 'campus'];
        break;
    }
    
    console.log(`Edit mode critical fields for step ${step}:`, criticalFields);
    
    // Only validate critical fields
    const isValid = await trigger(criticalFields);
    console.log(`Edit mode validation result for step ${step}:`, isValid);
    
    // In edit mode, we're more permissive - if most fields are valid, allow progression
    return isValid;
  };

  // Helper function to parse income values
  const parseIncomeToNumber = (incomeString: string): number => {
    if (!incomeString) return 0;
    
    // Handle different income range formats
    if (incomeString.includes('Below')) return 50000; // Below 100,000
    if (incomeString.includes('Above')) return 750000; // Above 500,000
    if (incomeString.includes('-')) {
      const [min, max] = incomeString.split('-').map(s => parseInt(s.replace(/[^\d]/g, '')));
      return (min + max) / 2; // Return average
    }
    
    return parseFloat(incomeString.replace(/[^\d]/g, '')) || 0;
  };

  // Helper function to convert percentage to GWA (1.00-5.00 scale, 1.00 being highest)
  const convertPercentageToGWA = (percentage: number): number => {
    // Clamp percentage to valid range (0-100)
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    
    if (clampedPercentage >= 96) return 1.00;
    if (clampedPercentage >= 94) return 1.25;
    if (clampedPercentage >= 92) return 1.50;
    if (clampedPercentage >= 89) return 1.75;
    if (clampedPercentage >= 87) return 2.00;
    if (clampedPercentage >= 84) return 2.25;
    if (clampedPercentage >= 82) return 2.50;
    if (clampedPercentage >= 79) return 2.75;
    if (clampedPercentage >= 75) return 3.00;
    return 5.00; // Below 75
  };



  // Check for existing applications on component mount
  useEffect(() => {
    const checkExistingApplications = async () => {
      if (!currentUser) {
        setIsCheckingApplications(false);
        return;
      }

      try {
        setIsCheckingApplications(true);
        const applications = await scholarshipApiService.getUserApplications();
        
        // Check if user has any pending or active applications
        // Check if user has any active applications that would prevent creating a new one
        // Draft applications can be edited, so they don't block access to this page
        // Only non-draft active statuses block new applications
        const blockingStatuses = ['submitted', 'documents_reviewed', 'interview_scheduled', 'endorsed_to_ssc', 'approved', 'grants_processing', 'grants_disbursed', 'on_hold', 'for_compliance', 'compliance_documents_submitted'];
        const hasBlockingApplication = applications.some(app => blockingStatuses.includes(app.status?.toLowerCase()));
        
        // Check if user has a draft application that they might want to edit
        const draftApplication = applications.find(app => app.status?.toLowerCase() === 'draft');
        const hasDraftApplication = !!draftApplication;
        
        // Allow access if:
        // 1. No blocking applications exist, OR
        // 2. User has only draft applications (which can be edited)
        const shouldAllowAccess = !hasBlockingApplication;
        
        setAccessDenied(!shouldAllowAccess);
        
        // Set edit mode if user has a draft application
        if (draftApplication && shouldAllowAccess) {
          setIsEditMode(true);
          // Fetch full application data with all relationships
          if (draftApplication.id && typeof draftApplication.id === 'number') {
            try {
              const fullApplication = await scholarshipApiService.getApplication(draftApplication.id);
              setExistingApplication(fullApplication);
              console.log('Edit mode detected. Loading full application data:', fullApplication);
            } catch (error) {
              console.error('Failed to fetch full application data:', error);
              // Fallback to the basic application data
              setExistingApplication(draftApplication);
              console.log('Edit mode detected. Using basic application data:', draftApplication);
            }
          } else {
            setExistingApplication(draftApplication);
            console.log('Edit mode detected. Using basic application data (no ID):', draftApplication);
          }
        }
        
        console.log('User applications:', applications);
        console.log('Has blocking application:', hasBlockingApplication);
        console.log('Has draft application:', hasDraftApplication);
        console.log('Should allow access:', shouldAllowAccess);
        console.log('Is edit mode:', !!draftApplication && shouldAllowAccess);
      } catch (error) {
        console.error('Error checking existing applications:', error);
        // If there's an error, allow access (fail open)
        setAccessDenied(false);
      } finally {
        setIsCheckingApplications(false);
      }
    };

    checkExistingApplications();
  }, [currentUser]);

  // Load reference data and saved form data on component mount
  useEffect(() => {
    const loadReferenceData = async () => {
      setIsLoadingData(true);
      try {
        const [schoolsData, categoriesData] = await Promise.all([
          scholarshipApiService.getSchools(),
          scholarshipApiService.getScholarshipCategories()
        ]);
        
        // Ensure data is in array format
        setSchools(Array.isArray(schoolsData) ? schoolsData : []);
        setScholarshipCategories(Array.isArray(categoriesData) ? categoriesData : []);
        
        console.log('Loaded schools:', schoolsData);
        console.log('Loaded categories:', categoriesData);
      } catch (error) {
        console.error('Failed to load reference data:', error);
        setSubmitError('Failed to load form data. Please refresh the page.');
        // Set empty arrays as fallback
        setSchools([]);
        setScholarshipCategories([]);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadReferenceData();
  }, []);

  // Load saved form data on component mount
  useEffect(() => {
    const savedData = loadFormDataFromStorage();
    if (savedData && !isEditMode) {
      // Only load saved data if we're not in edit mode
      console.log('Loading saved form data:', savedData);
      reset(savedData.formData);
      setCurrentStep(savedData.currentStep);
      setSelectedCategoryId(savedData.formData.scholarshipCategory ? parseInt(savedData.formData.scholarshipCategory) : null);
      setSelectedSubcategoryId(savedData.formData.scholarshipSubCategory ? parseInt(savedData.formData.scholarshipSubCategory) : null);
      setSelectedSchoolId(savedData.formData.schoolName || null);
      setGwaInputFormat(savedData.formData.gwaInputFormat || 'percentage');
      setStudentIdType(savedData.formData.studentIdType || 'school');
      setShowReligionOther(savedData.formData.religion === 'OTHERS, PLEASE SPECIFY');
    } else if (isEditMode) {
      // In edit mode, always start from step 1 and clear localStorage
      console.log('Edit mode detected - starting from step 1 and clearing localStorage');
      setCurrentStep(1);
      clearFormDataFromStorage();
    }
  }, [reset, isEditMode]);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [currentStep]);

  // Populate form fields when editing existing application
  useEffect(() => {
    if (isEditMode && existingApplication && !isCheckingApplications) {
      console.log('=== FORM POPULATION DEBUG ===');
      console.log('isEditMode:', isEditMode);
      console.log('existingApplication:', existingApplication);
      console.log('existingApplication type:', typeof existingApplication);
      console.log('existingApplication keys:', Object.keys(existingApplication || {}));
      console.log('Student data:', existingApplication.student);
      console.log('Student data keys:', Object.keys(existingApplication.student || {}));
      console.log('Emergency contacts:', existingApplication.student?.emergency_contacts);
      
      // Map the existing application data to form fields
      const formData = {
        // Personal Information
        lastName: existingApplication.student?.last_name || '',
        firstName: existingApplication.student?.first_name || '',
        middleName: existingApplication.student?.middle_name || '',
        extensionName: existingApplication.student?.extension_name || '',
        studentId: existingApplication.student?.student_id_number || '',
        sex: existingApplication.student?.sex || '',
        civilStatus: existingApplication.student?.civil_status || '',
        dateOfBirth: existingApplication.student?.birth_date ? new Date(existingApplication.student.birth_date).toISOString().split('T')[0] : '',
        religion: existingApplication.student?.religion || '',
        nationality: existingApplication.student?.nationality || 'Filipino',
        birthPlace: existingApplication.student?.birth_place || '',
        heightCm: existingApplication.student?.height_cm?.toString() || '',
        weightKg: existingApplication.student?.weight_kg?.toString() || '',
        isPwd: existingApplication.student?.is_pwd === true,
        pwdSpecification: existingApplication.student?.pwd_specification || '',
        presentAddress: existingApplication.student?.addresses?.[0]?.address_line_1 || '',
        presentAddressLine2: existingApplication.student?.addresses?.[0]?.address_line_2 || '',
        barangay: existingApplication.student?.addresses?.[0]?.barangay || '',
        district: existingApplication.student?.addresses?.[0]?.district || '',
        city: existingApplication.student?.addresses?.[0]?.city || 'QUEZON CITY',
        province: existingApplication.student?.addresses?.[0]?.province || '',
        region: existingApplication.student?.addresses?.[0]?.region || '',
        zipCode: existingApplication.student?.addresses?.[0]?.zip_code || '',
        contactNumber: existingApplication.student?.contact_number || '',
        emailAddress: existingApplication.student?.email_address || '',
        
        // Parent/Guardian Information
        motherFirstName: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'mother')?.first_name || '',
        motherLastName: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'mother')?.last_name || '',
        motherMiddleName: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'mother')?.middle_name || '',
        motherExtensionName: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'mother')?.extension_name || '',
        motherContactNumber: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'mother')?.contact_number || '',
        motherOccupation: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'mother')?.occupation || '',
        motherMonthlyIncome: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'mother')?.monthly_income?.toString() || '',
        isMotherAvailable: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'mother') ? 'yes' : 'no',
        isFatherAvailable: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'father') ? 'yes' : 'no',
        fatherFirstName: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'father')?.first_name || '',
        fatherLastName: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'father')?.last_name || '',
        fatherMiddleName: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'father')?.middle_name || '',
        fatherExtensionName: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'father')?.extension_name || '',
        fatherContactNumber: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'father')?.contact_number || '',
        fatherOccupation: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'father')?.occupation || '',
        fatherMonthlyIncome: existingApplication.student?.family_members?.find((member: any) => member.relationship === 'father')?.monthly_income?.toString() || '',
        
        // Emergency Contact
        emergencyContactName: existingApplication.student?.emergency_contacts?.[0]?.full_name || '',
        emergencyContactNumber: existingApplication.student?.emergency_contacts?.[0]?.contact_number || '',
        emergencyContactRelationship: existingApplication.student?.emergency_contacts?.[0]?.relationship || '',
        
        // Employment & Financial
        isStudentEmployed: existingApplication.student?.is_employed ? 'yes' : 'no',
        studentOccupation: existingApplication.student?.occupation || '',
        studentMonthlyIncome: existingApplication.student?.financial_information?.monthly_income?.toString() || '',
        totalFamilyMonthlyIncome: existingApplication.student?.financial_information?.family_monthly_income_range || '',
        totalAnnualIncome: '', // This field is no longer used as we now use family_monthly_income_range
        numberOfSiblings: existingApplication.student?.financial_information?.number_of_siblings?.toString() || '',
        numberOfSiblingsInSchool: existingApplication.student?.financial_information?.siblings_currently_enrolled?.toString() || '',
        homeOwnershipStatus: existingApplication.student?.financial_information?.home_ownership_status || '',
        
        // Marginalized Groups & Benefits
        isSoloParent: existingApplication.student?.is_solo_parent ? 'yes' : 'no',
        isIndigenousGroup: existingApplication.student?.is_indigenous_group ? 'yes' : 'no',
        indigenousGroupName: existingApplication.student?.indigenous_group_name || '',
        is4PsBeneficiary: existingApplication.student?.financial_information?.is_4ps_beneficiary ? 'yes' : 'no',
        isPwdBeneficiary: existingApplication.student?.family_information?.is_pwd_beneficiary ? 'yes' : 'no',
        
        // Voter & Payment
        isRegisteredVoter: existingApplication.student?.is_registered_voter ? 'yes' : 'no',
        voterNationality: existingApplication.student?.voter_nationality || '',
        paymentMethod: existingApplication.digital_wallets && existingApplication.digital_wallets.length > 0 ? existingApplication.digital_wallets[0] : '',
        accountNumber: existingApplication.wallet_account_number || '',
        hasPayMayaAccount: existingApplication.student?.has_paymaya_account ? 'yes' : 'no',
        preferredMobileNumber: existingApplication.student?.preferred_mobile_number || '',
        
        // Scholarship Information
        scholarshipCategory: existingApplication.category_id?.toString() || '',
        scholarshipSubCategory: existingApplication.subcategory_id?.toString() || '',
        schoolName: existingApplication.school?.name || '',
        howDidYouKnow: existingApplication.how_did_you_know || [],
        financialNeedDescription: existingApplication.financial_need_description || '',
        requestedAmount: existingApplication.requested_amount?.toString() || '',
        marginalizedGroups: existingApplication.marginalized_groups || [],
        digitalWallets: existingApplication.digital_wallets || [],
        walletAccountNumber: existingApplication.wallet_account_number || '',
        isSchoolAtCaloocan: existingApplication.is_school_at_caloocan ? 'yes' : 'no',
        
        // Academic Information
        educationalLevel: existingApplication.student?.current_academic_record?.educational_level || '',
        courseProgram: existingApplication.student?.current_academic_record?.program || '',
        program: existingApplication.student?.current_academic_record?.program || '',
        major: existingApplication.student?.current_academic_record?.major || '',
        trackSpecialization: existingApplication.student?.current_academic_record?.track_specialization || '',
        currentTrackSpecialization: existingApplication.student?.current_academic_record?.track_specialization || '',
        areaOfSpecialization: existingApplication.student?.current_academic_record?.area_of_specialization || '',
        gradeYearLevel: existingApplication.student?.current_academic_record?.year_level || '',
        yearLevel: existingApplication.student?.current_academic_record?.year_level || '',
        schoolTerm: existingApplication.student?.current_academic_record?.school_term || '',
        schoolYear: existingApplication.student?.current_academic_record?.school_year || '',
        campus: existingApplication.school?.campus || '',
        unitsEnrolled: existingApplication.student?.current_academic_record?.units_enrolled?.toString() || '',
        unitsCompleted: existingApplication.student?.current_academic_record?.units_completed?.toString() || 'N/A',
        generalWeightedAverage: existingApplication.student?.current_academic_record?.general_weighted_average?.toString() || '',
        previousSchool: existingApplication.student?.current_academic_record?.previous_school || '',
        previousSchoolAddress: existingApplication.student?.current_academic_record?.previous_school_address || '',
        
        // Additional academic fields
        isCurrentlyEnrolled: existingApplication.student?.current_academic_record?.is_currently_enrolled ? 'yes' : 'no',
        isGraduating: existingApplication.student?.current_academic_record?.is_graduating ? 'yes' : 'no',
        
        // Application type
        type: existingApplication.type || 'new',
        reasonForRenewal: existingApplication.reason_for_renewal || '',
        parentApplicationId: existingApplication.parent_application_id || '',
        notes: existingApplication.notes || ''
      };
      
      // Debug log the form data before reset
      console.log('Form data to be populated:', formData);
      
      // Reset form with populated data
      reset(formData);
      
      // Ensure we start from step 1 in edit mode
      setCurrentStep(1);
      
      // Set the selected IDs for dropdowns
      if (existingApplication.category_id) {
        setSelectedCategoryId(existingApplication.category_id);
      }
      if (existingApplication.subcategory_id) {
        setSelectedSubcategoryId(existingApplication.subcategory_id);
      }
      if (existingApplication.school?.name) {
        setSelectedSchoolId(existingApplication.school.name);
      }
      
      // Set GWA input format based on existing data
      const gwaValue = existingApplication.student?.current_academic_record?.general_weighted_average;
      if (gwaValue) {
        if (gwaValue <= 5.0) {
          setGwaInputFormat('gwa');
        } else {
          setGwaInputFormat('percentage');
        }
      }
      
      // Set student ID type
      const studentId = existingApplication.student?.student_id_number;
      if (studentId) {
        if (studentId.length === 12) {
          setStudentIdType('lrn');
        } else {
          setStudentIdType('school');
        }
      }
      
      // Handle religion field for "OTHERS, PLEASE SPECIFY"
      if (formData.religion === 'OTHERS, PLEASE SPECIFY') {
        setShowReligionOther(true);
      }
      
      console.log('=== FORM POPULATION COMPLETED ===');
      console.log('Form populated with existing application data');
      console.log('Current step set to:', 1);
      console.log('Selected category ID:', existingApplication.category_id);
      console.log('Selected subcategory ID:', existingApplication.subcategory_id);
      console.log('Selected school:', existingApplication.school?.name);
    }
  }, [isEditMode, existingApplication, isCheckingApplications, reset]);

  // Auto-populate personal information from authenticated user
  useEffect(() => {
    const populateUserData = async () => {
      if (!currentUser || isEditMode || isCheckingApplications) {
        return;
      }

      // Check if there's saved data in localStorage - if so, don't auto-populate
      const savedData = loadFormDataFromStorage();
      const forceAutoPopulate = new URLSearchParams(window.location.search).get('force-populate') === 'true';
      
      if (savedData && !forceAutoPopulate) {
        console.log('Skipping auto-population - saved form data exists in localStorage');
        console.log('To test auto-population, add ?force-populate=true to URL or clear localStorage');
        return;
      }
      
      if (forceAutoPopulate && savedData) {
        console.log('Force auto-population enabled - clearing saved data and populating from user record');
        clearFormDataFromStorage();
      }

      console.log('Auto-populating form with user data:', currentUser);
      
      // Only populate fields that have actual data from the citizen record
      if (currentUser.first_name) {
        setValue('firstName', currentUser.first_name);
      }
      if (currentUser.last_name) {
        setValue('lastName', currentUser.last_name);
      }
      if (currentUser.middle_name) {
        setValue('middleName', currentUser.middle_name);
      }
      if (currentUser.extension_name) {
        setValue('extensionName', currentUser.extension_name);
      }
      if (currentUser.email) {
        setValue('emailAddress', currentUser.email);
      }
      if (currentUser.mobile) {
        setValue('contactNumber', currentUser.mobile);
      }
      if (currentUser.birthdate) {
        setValue('dateOfBirth', new Date(currentUser.birthdate).toISOString().split('T')[0]);
      }
      if (currentUser.address) {
        setValue('presentAddress', currentUser.address);
      }
      if (currentUser.barangay) {
        setValue('barangay', currentUser.barangay);
      }

      // Optionally try to fetch additional student data if it exists (from previous applications)
      try {
        const studentsResponse = await scholarshipApiService.getStudents();
        const existingStudent: Student | null = studentsResponse.data && studentsResponse.data.length > 0 
          ? studentsResponse.data[0] 
          : null;

        if (existingStudent) {
          console.log('Found existing student record, populating additional fields:', existingStudent);
          
          // Populate additional fields from student record
          if (existingStudent.contact_number) {
            setValue('contactNumber', existingStudent.contact_number);
          }
          if (existingStudent.sex) {
            setValue('sex', existingStudent.sex);
          }
          if (existingStudent.civil_status) {
            setValue('civilStatus', existingStudent.civil_status);
          }
          if (existingStudent.birth_date) {
            setValue('dateOfBirth', new Date(existingStudent.birth_date).toISOString().split('T')[0]);
          }
          if (existingStudent.religion) {
            setValue('religion', existingStudent.religion);
          }
          if (existingStudent.nationality) {
            setValue('nationality', existingStudent.nationality);
          }
          if (existingStudent.birth_place) {
            setValue('birthPlace', existingStudent.birth_place);
          }
          if (existingStudent.height_cm) {
            setValue('heightCm', existingStudent.height_cm.toString());
          }
          if (existingStudent.weight_kg) {
            setValue('weightKg', existingStudent.weight_kg.toString());
          }
          if (existingStudent.is_pwd !== undefined) {
            setValue('isPwd', existingStudent.is_pwd);
          }
          if (existingStudent.pwd_specification) {
            setValue('pwdSpecification', existingStudent.pwd_specification);
          }
          
          // Populate address if available
          if (existingStudent.addresses && existingStudent.addresses.length > 0) {
            const address = existingStudent.addresses[0];
            setValue('presentAddress', address.address_line_1 || '');
            setValue('presentAddressLine2', address.address_line_2 || '');
            setValue('barangay', address.barangay || '');
            setValue('district', address.district || '');
            setValue('city', address.city || 'QUEZON CITY');
            setValue('province', address.province || '');
            setValue('region', address.region || '');
            setValue('zipCode', address.zip_code || '');
          }
          
          // Populate employment info
          if (existingStudent.is_employed !== undefined) {
            setValue('isStudentEmployed', existingStudent.is_employed ? 'yes' : 'no');
          }
          if (existingStudent.occupation) {
            setValue('studentOccupation', existingStudent.occupation);
          }
          
          // Populate other flags
          if (existingStudent.is_solo_parent !== undefined) {
            setValue('isSoloParent', existingStudent.is_solo_parent ? 'yes' : 'no');
          }
          if (existingStudent.is_indigenous_group !== undefined) {
            setValue('isIndigenousGroup', existingStudent.is_indigenous_group ? 'yes' : 'no');
          }
          if (existingStudent.is_registered_voter !== undefined) {
            setValue('isRegisteredVoter', existingStudent.is_registered_voter ? 'yes' : 'no');
          }
          if (existingStudent.voter_nationality) {
            setValue('voterNationality', existingStudent.voter_nationality);
          }
          if (existingStudent.has_paymaya_account !== undefined) {
            setValue('hasPayMayaAccount', existingStudent.has_paymaya_account ? 'yes' : 'no');
          }
          if (existingStudent.preferred_mobile_number) {
            setValue('preferredMobileNumber', existingStudent.preferred_mobile_number);
          }
          
          // Populate student ID if available
          if (existingStudent.student_id_number) {
            setValue('studentId', existingStudent.student_id_number);
          }
        } else {
          console.log('No existing student record found - using only auth user data');
        }
      } catch (error) {
        console.error('Error fetching additional student data (non-critical):', error);
        // This is not critical - we already have the basic user data populated
      }
    };

    populateUserData();
  }, [currentUser, isEditMode, isCheckingApplications, setValue]);

  // Save form data to localStorage whenever form values change
  useEffect(() => {
    const subscription = watch((formData) => {
      const dataToSave = {
        ...formData,
        gwaInputFormat,
        studentIdType
      };
      saveFormDataToStorage(dataToSave, currentStep);
    });
    return () => subscription.unsubscribe();
  }, [watch, currentStep, gwaInputFormat, studentIdType]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Transform form data to match API structure
      if (!currentUser?.citizen_id) {
        setIsSubmitting(false);
        setSubmitError('Your citizen ID is missing. Please log in again or contact support.');
        return;
      }
      
      const applicationData = {
        // Student data
        citizen_id: currentUser.citizen_id,
        // user_id will be set by the backend from auth_user
        student_id_number: data.studentId || null,
        first_name: data.firstName || '',
        last_name: data.lastName || '',
        middle_name: data.middleName || null,
        extension_name: data.extensionName || null,
        sex: data.sex || 'Male',
        civil_status: data.civilStatus || 'Single',
        nationality: data.nationality || 'Filipino',
        birth_place: data.birthPlace || null,
        birth_date: data.dateOfBirth || null,
        is_pwd: Boolean(data.isPwd),
        pwd_specification: data.pwdSpecification || null,
        religion: data.religion === 'OTHERS, PLEASE SPECIFY' ? data.religionOther : data.religion || null,
        height_cm: data.heightCm ? parseFloat(data.heightCm) : undefined,
        weight_kg: data.weightKg ? parseFloat(data.weightKg) : undefined,
        contact_number: data.contactNumber || null,
        email_address: data.emailAddress || null,
        is_employed: data.isStudentEmployed === 'yes',
        occupation: data.studentOccupation || null,
        is_job_seeking: false, // Default value
        is_currently_enrolled: true, // Default value
        is_graduating: false, // Default value
        is_solo_parent: data.isSoloParent === 'yes',
        is_indigenous_group: data.isIndigenousGroup === 'yes',
        is_registered_voter: data.isRegisteredVoter === 'yes',
        voter_nationality: data.voterNationality || null,
        has_paymaya_account: data.paymentMethod === 'PayMaya',
        preferred_mobile_number: data.preferredMobileNumber || null,

        // Addresses
        addresses: [
          {
            type: 'present' as const,
            address_line_1: data.presentAddress || '',
            address_line_2: undefined,
            barangay: data.barangay || undefined,
            district: data.district || undefined,
            city: data.city || 'Caloocan City',
            province: 'Metro Manila',
            region: 'NCR',
            zip_code: data.zipCode || undefined,
          }
        ],

        // Family members
        family_members: [
          {
            relationship: 'father' as const,
            first_name: data.fatherFirstName || '',
            last_name: data.fatherLastName || '',
            middle_name: data.fatherMiddleName || undefined,
            extension_name: data.fatherExtensionName || undefined,
            contact_number: data.fatherContactNumber || undefined,
            occupation: data.fatherOccupation || undefined,
            monthly_income: data.fatherMonthlyIncome ? parseIncomeToNumber(data.fatherMonthlyIncome) : undefined,
            is_alive: data.isFatherAvailable === 'yes',
            is_employed: Boolean(data.fatherMonthlyIncome || data.fatherOccupation),
            is_ofw: false,
            is_pwd: false,
            pwd_specification: undefined,
          },
          {
            relationship: 'mother' as const,
            first_name: data.motherFirstName || '',
            last_name: data.motherLastName || '',
            middle_name: data.motherMiddleName || undefined,
            extension_name: data.motherExtensionName || undefined,
            contact_number: data.motherContactNumber || undefined,
            occupation: data.motherOccupation || undefined,
            monthly_income: data.motherMonthlyIncome ? parseIncomeToNumber(data.motherMonthlyIncome) : undefined,
            is_alive: data.isMotherAvailable === 'yes',
            is_employed: Boolean(data.motherMonthlyIncome || data.motherOccupation),
            is_ofw: false,
            is_pwd: false,
            pwd_specification: undefined,
          }
        ],

        // Emergency contacts
        emergency_contacts: data.emergencyContactName ? [
          {
            full_name: data.emergencyContactName || '',
            contact_number: data.emergencyContactNumber || '',
            relationship: data.emergencyContactRelationship || '',
            address: undefined,
            email: undefined,
            notes: undefined,
            is_primary: true,
          }
        ] : [],

        // Financial information
        financial_information: {
          family_monthly_income_range: data.totalFamilyMonthlyIncome || null,
          monthly_income: data.isStudentEmployed === 'yes' && data.studentMonthlyIncome ? parseIncomeToNumber(data.studentMonthlyIncome) : undefined,
          number_of_siblings: parseInt(data.numberOfSiblings) || 0,
          siblings_currently_enrolled: parseInt(data.numberOfSiblingsInSchool) || 0,
          home_ownership_status: data.homeOwnershipStatus || null,
          is_4ps_beneficiary: data.is4PsBeneficiary === 'yes',
        },

        // Application data
        category_id: selectedCategoryId || 1, // Use selected category ID
        subcategory_id: selectedSubcategoryId || 1, // Use selected subcategory ID
        school_id: (() => {
          // Find the school ID based on the selected school name and campus
          if (selectedSchoolId && data.campus && Array.isArray(schools)) {
            const selectedSchool = schools.find(school => 
              school.name === selectedSchoolId && school.campus === data.campus
            );
            return selectedSchool ? selectedSchool.id : 2;
          }
          return 2;
        })(),
        type: 'new' as const,
        financial_need_description: data.financialNeedDescription || 'Financial assistance needed for education',
        requested_amount: selectedSubcategoryId ? 
          (scholarshipCategories
            .find(cat => cat.subcategories?.some(sub => sub.id === selectedSubcategoryId))
            ?.subcategories?.find(sub => sub.id === selectedSubcategoryId)?.amount || 50000) 
          : 50000,
        marginalized_groups: data.marginalizedGroups || [],
        digital_wallets: data.paymentMethod && data.paymentMethod !== 'Cash' ? [data.paymentMethod] : [],
        wallet_account_number: data.accountNumber || undefined,
        how_did_you_know: data.howDidYouKnow || [],
        is_school_at_caloocan: data.isSchoolAtCaloocan === 'YES',

        // Academic record
        academic_record: {
          educational_level: data.educationalLevel || 'TERTIARY/COLLEGE',
          program: data.courseProgram || null,
          major: data.major || null,
          track_specialization: data.courseProgram || null,
          area_of_specialization: data.major || null,
          year_level: data.gradeYearLevel || '1st Year',
          school_year: data.schoolYear || '2024-2025',
          school_term: data.schoolTerm || '1st Semester',
          units_enrolled: data.unitsEnrolled ? parseInt(data.unitsEnrolled) : undefined,
          units_completed: data.unitsCompleted && data.unitsCompleted !== 'N/A' ? parseInt(data.unitsCompleted) : undefined,
          previous_school_address: data.previousSchoolAddress || null,
          general_weighted_average: data.generalWeightedAverage ? (() => {
            const inputValue = parseFloat(data.generalWeightedAverage);
            let gwa;
            
            if (gwaInputFormat === 'percentage') {
              gwa = convertPercentageToGWA(inputValue);
              console.log(`Converting GWA: ${inputValue}% -> ${gwa} GWA`);
            } else {
              gwa = inputValue; // Already in GWA format
              console.log(`Using GWA directly: ${gwa}`);
            }
            
            return gwa;
          })() : undefined,
          previous_school: data.previousSchool || null,
          is_graduating: false,
        },

        // Documents will be handled separately via document upload
        // uploaded_document_ids: Object.values(uploadedDocuments).map(doc => doc.id)
      };

      console.log('Submitting application data:', applicationData);
      console.log('Selected IDs:', { selectedCategoryId, selectedSubcategoryId, selectedSchoolId });
      console.log('Form data:', data);
      
      // Check authentication before submitting
      const token = localStorage.getItem('auth_token');
      console.log('Auth token present:', !!token);
      console.log('Auth token value:', token ? token.substring(0, 20) + '...' : 'No token');
      
      // Save or update the application
      let result;
      try {
        if (isEditMode && existingApplication) {
          // Update existing application - need to update both student and application data
          console.log('Updating existing application:', existingApplication.id);
          
          // Separate student data from application data
          const studentData = {
            first_name: applicationData.first_name,
            last_name: applicationData.last_name,
            middle_name: applicationData.middle_name,
            extension_name: applicationData.extension_name,
            sex: applicationData.sex,
            civil_status: applicationData.civil_status,
            nationality: applicationData.nationality,
            birth_place: applicationData.birth_place,
            birth_date: applicationData.birth_date,
            is_pwd: applicationData.is_pwd,
            pwd_specification: applicationData.pwd_specification,
            religion: applicationData.religion,
            height_cm: applicationData.height_cm,
            weight_kg: applicationData.weight_kg,
            contact_number: applicationData.contact_number,
            email_address: applicationData.email_address,
            is_employed: applicationData.is_employed,
            occupation: applicationData.occupation,
            is_job_seeking: applicationData.is_job_seeking,
            is_currently_enrolled: applicationData.is_currently_enrolled,
            is_graduating: applicationData.is_graduating,
            is_solo_parent: applicationData.is_solo_parent,
            is_indigenous_group: applicationData.is_indigenous_group,
            is_registered_voter: applicationData.is_registered_voter,
            voter_nationality: applicationData.voter_nationality,
            has_paymaya_account: applicationData.has_paymaya_account,
            preferred_mobile_number: applicationData.preferred_mobile_number,
            addresses: applicationData.addresses,
            family_members: applicationData.family_members,
            emergency_contacts: applicationData.emergency_contacts,
            financial_information: applicationData.financial_information,
          };

          const applicationOnlyData = {
            reason_for_renewal: data.reasonForRenewal || null,
            financial_need_description: applicationData.financial_need_description,
            requested_amount: applicationData.requested_amount,
            marginalized_groups: applicationData.marginalized_groups,
            digital_wallets: applicationData.digital_wallets,
            wallet_account_number: applicationData.wallet_account_number,
            how_did_you_know: applicationData.how_did_you_know,
            is_school_at_caloocan: applicationData.is_school_at_caloocan,
            notes: data.notes || null,
          };

          // Update student data first
          if (existingApplication.student?.id) {
            console.log('Updating student data:', existingApplication.student.id);
            await scholarshipApiService.updateStudent(existingApplication.student.id, studentData);
            console.log('Student updated successfully');
          }

          // Then update application data
          result = await scholarshipApiService.updateApplication(existingApplication.id, applicationOnlyData);
          console.log('Application updated successfully:', result);
        } else {
          // Create new application
          result = await scholarshipApiService.submitNewApplication(applicationData);
          console.log('Application saved as draft successfully:', result);
        }
        console.log('Result type:', typeof result);
        console.log('Result keys:', result ? Object.keys(result) : 'result is null/undefined');
        console.log('Student data:', result?.student);
      } catch (apiError) {
        console.error('API draft save error:', apiError);
        console.error('Error details:', {
          message: apiError instanceof Error ? apiError.message : String(apiError),
          stack: apiError instanceof Error ? apiError.stack : undefined,
          name: apiError instanceof Error ? apiError.name : 'Unknown'
        });
        
        // Handle specific database constraint violations
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        if (errorMessage.includes('Duplicate entry') && errorMessage.includes('citizen_id_unique')) {
          throw new Error('A student record with this information already exists. Please contact support if you believe this is an error.');
        } else if (errorMessage.includes('Integrity constraint violation')) {
          throw new Error('There was a data validation error. Please check your information and try again.');
        } else {
          const actionText = isEditMode ? 'update' : 'save draft';
          throw new Error(`Failed to ${actionText}: ${errorMessage}`);
        }
      }
      
      
      setShowSuccessModal(true);
      
      // Clear saved form data after successful submission
      clearFormDataFromStorage();
      
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'save draft'}:`, error);
      const actionText = isEditMode ? 'update' : 'save draft';
      setSubmitError(error instanceof Error ? error.message : `Failed to ${actionText}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking applications OR access denied if user has active applications
  if (isCheckingApplications || accessDenied) {
    if (isCheckingApplications) {
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <h1 className="text-2xl font-bold text-white">New Scholarship Application</h1>
              </div>
              
              {/* Navigation */}
              <div className="px-6 py-3 bg-gray-50 border-b">
                <button
                  onClick={() => navigate('/portal')}
                  className="text-gray-500 hover:text-orange-600 transition-colors text-sm flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Portal
                </button>
              </div>
              
              <div className="p-8">
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Skeleton variant="text" height={24} width={300} className="mx-auto mb-2" />
                    <Skeleton variant="text" height={16} width={200} className="mx-auto" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SkeletonCard />
                    <SkeletonCard />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Show access denied if user has active applications
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Access Restricted</h1>
            </div>
            
            {/* Navigation */}
            <div className="px-6 py-3 bg-gray-50 border-b">
              <button
                onClick={() => navigate('/portal')}
                className="text-gray-500 hover:text-orange-600 transition-colors text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Portal
              </button>
            </div>
            
            <div className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">New Application Not Available</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                You currently have an active scholarship application that is being processed. Please wait for your current application to be reviewed before submitting a new one. If you have a draft application, you can edit it from your dashboard.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/scholarship-dashboard')}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
                >
                  View My Dashboard
                </button>
                <div>
                  <button
                    onClick={() => navigate('/portal')}
                    className="text-gray-600 hover:text-gray-800 underline"
                  >
                    Return to Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {isEditMode ? 'Edit Scholarship Application' : 'New Scholarship Application'}
                </h1>
                <p className="text-orange-100 mt-1">
                  {isEditMode ? 'Update your application information and submit when ready' : 'Complete all sections to submit your application'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
                    clearFormDataFromStorage();
                    reset();
                    setCurrentStep(1);
                    setSelectedCategoryId(null);
                    setSelectedSubcategoryId(null);
                    setSelectedSchoolId(null);
                    setGwaInputFormat('percentage');
                    setStudentIdType('school');
                    clearErrors();
                  }
                }}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-md hover:bg-opacity-30 transition-colors text-sm"
              >
                Clear Form
              </button>
            </div>
          </div>

          {/* Progress Steps - Combined Progress Bar and Breadcrumbs */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Step {currentStep} of 4</span>
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                ></div>
              </div>
            </div>
            <nav className="flex overflow-x-auto" aria-label="Progress Steps">
              <ol className="flex items-center space-x-2">
                <li>
                  {isEditMode ? (
                    <button
                      onClick={() => handleStepNavigation(1)}
                      className={`text-sm whitespace-nowrap transition-colors ${
                        currentStep === 1 
                          ? 'text-orange-600 font-semibold' 
                          : currentStep > 1 
                            ? 'text-green-600 font-medium hover:text-green-700' 
                            : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      1. Personal Information
                    </button>
                  ) : (
                    <span className={`text-sm whitespace-nowrap ${
                      currentStep === 1 
                        ? 'text-orange-600 font-semibold' 
                        : currentStep > 1 
                          ? 'text-green-600 font-medium' 
                          : 'text-gray-400'
                    }`}>
                      1. Personal Information
                    </span>
                  )}
                </li>
                <li>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  {isEditMode ? (
                    <button
                      onClick={() => handleStepNavigation(2)}
                      className={`text-sm whitespace-nowrap transition-colors ${
                        currentStep === 2 
                          ? 'text-orange-600 font-semibold' 
                          : currentStep > 2 
                            ? 'text-green-600 font-medium hover:text-green-700' 
                            : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      2. Family Information
                    </button>
                  ) : (
                    <span className={`text-sm whitespace-nowrap ${
                      currentStep === 2 
                        ? 'text-orange-600 font-semibold' 
                        : currentStep > 2 
                          ? 'text-green-600 font-medium' 
                          : 'text-gray-400'
                    }`}>
                      2. Family Information
                    </span>
                  )}
                </li>
                <li>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  {isEditMode ? (
                    <button
                      onClick={() => handleStepNavigation(3)}
                      className={`text-sm whitespace-nowrap transition-colors ${
                        currentStep === 3 
                          ? 'text-orange-600 font-semibold' 
                          : currentStep > 3 
                            ? 'text-green-600 font-medium hover:text-green-700' 
                            : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      3. Financial Information
                    </button>
                  ) : (
                    <span className={`text-sm whitespace-nowrap ${
                      currentStep === 3 
                        ? 'text-orange-600 font-semibold' 
                        : currentStep > 3 
                          ? 'text-green-600 font-medium' 
                          : 'text-gray-400'
                    }`}>
                      3. Financial Information
                    </span>
                  )}
                </li>
                <li>
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </li>
                <li>
                  {isEditMode ? (
                    <button
                      onClick={() => handleStepNavigation(4)}
                      className={`text-sm whitespace-nowrap transition-colors ${
                        currentStep === 4 
                          ? 'text-orange-600 font-semibold' 
                          : currentStep > 4 
                            ? 'text-green-600 font-medium hover:text-green-700' 
                            : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      4. Academic Information
                    </button>
                  ) : (
                    <span className={`text-sm whitespace-nowrap ${
                      currentStep === 4 
                        ? 'text-orange-600 font-semibold' 
                        : currentStep > 4 
                          ? 'text-green-600 font-medium' 
                          : 'text-gray-400'
                    }`}>
                      4. Academic Information
                    </span>
                  )}
                </li>
              </ol>
            </nav>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{submitError}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">
                    PERSONAL INFORMATION <span className="text-gray-600 text-lg">(Import from CaloocanCitizen ID)</span>
                  </h2>
                  <a href="#" className="text-blue-600 hover:underline text-sm">
                    edit personal information
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <Controller
                      name="lastName"
                      control={control}
                      rules={{ required: 'Last Name is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-600">{String(errors.lastName.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <Controller
                      name="firstName"
                      control={control}
                      rules={{ required: 'First Name is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-red-600">{String(errors.firstName.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <Controller
                      name="middleName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Extension Name</label>
                    <Controller
                      name="extensionName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g., Jr., Sr., III"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {studentIdType === 'school' ? 'Student ID' : 'LRN (Learner Reference Number)'} *
                    </label>
                    
                    {/* ID Type Switch */}
                    <div className="mb-3">
                      <div className="flex space-x-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="studentIdType"
                            value="school"
                            checked={studentIdType === 'school'}
                            onChange={() => setStudentIdType('school')}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">School ID</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="studentIdType"
                            value="lrn"
                            checked={studentIdType === 'lrn'}
                            onChange={() => setStudentIdType('lrn')}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">LRN</span>
                        </label>
                      </div>
                    </div>

                    <Controller
                      name="studentId"
                      control={control}
                      rules={{ 
                        required: `${studentIdType === 'school' ? 'Student ID' : 'LRN'} is required`,
                        minLength: {
                          value: studentIdType === 'lrn' ? 10 : 1,
                          message: studentIdType === 'lrn' ? 'LRN must be at least 10 characters' : 'Student ID is required'
                        }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder={
                            studentIdType === 'school' 
                              ? 'e.g., 2024-00123' 
                              : 'e.g., 123456789012'
                          }
                          maxLength={studentIdType === 'lrn' ? 12 : undefined}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {studentIdType === 'school' 
                        ? 'Enter your school-issued student ID number' 
                        : 'Enter your 12-digit Learner Reference Number (LRN)'}
                    </p>
                    {errors.studentId && <p className="mt-1 text-sm text-red-600">{String(errors.studentId.message)}</p>}
                  </div>

                  {/* Demographics */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
                    <Controller
                      name="sex"
                      control={control}
                      rules={{ required: 'Sex is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Sex</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      )}
                    />
                    {errors.sex && <p className="mt-1 text-sm text-red-600">{String(errors.sex.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Civil Status *</label>
                    <Controller
                      name="civilStatus"
                      control={control}
                      rules={{ required: 'Civil Status is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Status</option>
                          <option value="Single">Single</option>
                          <option value="Married">Married</option>
                          <option value="Divorced">Divorced</option>
                          <option value="Widowed">Widowed</option>
                        </select>
                      )}
                    />
                    {errors.civilStatus && <p className="mt-1 text-sm text-red-600">{String(errors.civilStatus.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <Controller
                      name="dateOfBirth"
                      control={control}
                      rules={{ required: 'Date of Birth is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="date"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{String(errors.dateOfBirth.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Religion *</label>
                    <Controller
                      name="religion"
                      control={control}
                      rules={{ required: 'Religion is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setShowReligionOther(e.target.value === 'OTHERS, PLEASE SPECIFY');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Religion</option>
                          <option value="ROMAN CATHOLIC">Roman Catholic</option>
                          <option value="ISLAM">Islam</option>
                          <option value="CHRISTIAN">Christian</option>
                          <option value="BORN AGAIN">Born Again</option>
                          <option value="IGLESIA NI CRISTO (INC)">Iglesia ni Cristo (INC)</option>
                          <option value="BIBLE BAPTIST">Bible Baptist</option>
                          <option value="7TH DAY ADVENTIST">7th Day Adventist</option>
                          <option value="AGLIPAY">Aglipay</option>
                          <option value="DATING DAAN">Dating Daan</option>
                          <option value="JEHOVA">Jehova</option>
                          <option value="OTHERS, PLEASE SPECIFY">Others, please specify</option>
                        </select>
                      )}
                    />
                    {showReligionOther && (
                      <Controller
                        name="religionOther"
                        control={control}
                        rules={{ required: showReligionOther ? 'Please specify your religion' : false }}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="Please specify your religion"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent mt-2"
                          />
                        )}
                      />
                    )}
                    {errors.religion && <p className="mt-1 text-sm text-red-600">{String(errors.religion.message)}</p>}
                    {errors.religionOther && <p className="mt-1 text-sm text-red-600">{String(errors.religionOther.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
                    <Controller
                      name="nationality"
                      control={control}
                      rules={{ required: 'Nationality is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.nationality && <p className="mt-1 text-sm text-red-600">{String(errors.nationality.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Birth Place *</label>
                    <Controller
                      name="birthPlace"
                      control={control}
                      rules={{ required: 'Birth Place is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.birthPlace && <p className="mt-1 text-sm text-red-600">{String(errors.birthPlace.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    <Controller
                      name="heightCm"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <Controller
                      name="weightKg"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          step="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  {/* PWD Status */}
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Are you a Person with Disability (PWD)? *</label>
                    <div className="flex space-x-4">
                      <Controller
                        name="isPwd"
                        control={control}
                        rules={{ 
                          validate: (value) => {
                            if (value === true || value === false) {
                              return true; // Valid boolean value
                            }
                            return 'Please select PWD status';
                          }
                        }}
                        render={({ field }) => (
                          <>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="isPwd"
                                value="true"
                                checked={field.value === true}
                                onChange={() => {
                                  field.onChange(true);
                                  // Trigger validation immediately
                                  setTimeout(() => trigger('isPwd'), 10);
                                }}
                                className="mr-2"
                              />
                              YES
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="isPwd"
                                value="false"
                                checked={field.value === false}
                                onChange={() => {
                                  field.onChange(false);
                                  // Trigger validation immediately
                                  setTimeout(() => trigger('isPwd'), 10);
                                }}
                                className="mr-2"
                              />
                              NO
                            </label>
                          </>
                        )}
                      />
                    </div>
                    {errors.isPwd && <p className="mt-1 text-sm text-red-600">{String(errors.isPwd.message)}</p>}
                  </div>

                  {isPwd && (
                    <div className="col-span-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">If PWD, Specify *</label>
                      <Controller
                        name="pwdSpecification"
                        control={control}
                        rules={{ 
                          required: isPwd ? 'PWD specification is required' : false 
                        }}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="SPECIFY"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        )}
                      />
                      {errors.pwdSpecification && <p className="mt-1 text-sm text-red-600">{String(errors.pwdSpecification.message)}</p>}
                    </div>
                  )}

                  {/* Address Information */}
                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Present Address *</label>
                    <Controller
                      name="presentAddress"
                      control={control}
                      rules={{ required: 'Present Address is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.presentAddress && <p className="mt-1 text-sm text-red-600">{String(errors.presentAddress.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                    <Controller
                      name="barangay"
                      control={control}
                      rules={{ required: 'Barangay is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.barangay && <p className="mt-1 text-sm text-red-600">{String(errors.barangay.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                    <Controller
                      name="district"
                      control={control}
                      rules={{ required: 'District is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.district && <p className="mt-1 text-sm text-red-600">{String(errors.district.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                    <Controller
                      name="city"
                      control={control}
                      rules={{ required: 'City is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.city && <p className="mt-1 text-sm text-red-600">{String(errors.city.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code *</label>
                    <Controller
                      name="zipCode"
                      control={control}
                      rules={{ 
                        required: 'Zip Code is required',
                        maxLength: {
                          value: 20,
                          message: 'Zip Code must not exceed 20 characters'
                        }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          maxLength={20}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.zipCode && <p className="mt-1 text-sm text-red-600">{String(errors.zipCode.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Active Contact Number *</label>
                    <Controller
                      name="contactNumber"
                      control={control}
                      rules={{ required: 'Contact Number is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="tel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.contactNumber && <p className="mt-1 text-sm text-red-600">{String(errors.contactNumber.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Active Email Address *</label>
                    <Controller
                      name="emailAddress"
                      control={control}
                      rules={{ 
                        required: 'Email Address is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email format'
                        }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.emailAddress && <p className="mt-1 text-sm text-red-600">{String(errors.emailAddress.message)}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Parent/Guardian & Emergency Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">
                    PARENT/GUARDIAN & EMERGENCY CONTACT INFORMATION
                  </h2>
                  <a href="#" className="text-blue-600 hover:underline text-sm">
                    edit personal information
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mother's Information */}
                  <div className="col-span-full">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Mother's Information (Maiden Name)</h3>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Please indicate your mother's status *</label>
                    <Controller
                      name="isMotherAvailable"
                      control={control}
                      rules={{ required: 'Please indicate your mother\'s status' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Status</option>
                          <option value="yes">Living</option>
                          <option value="no">Deceased</option>
                        </select>
                      )}
                    />
                    {errors.isMotherAvailable && <p className="mt-1 text-sm text-red-600">{String(errors.isMotherAvailable.message)}</p>}
                  </div>

                  {isMotherAvailable === 'yes' && (
                    <>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <Controller
                      name="motherFirstName"
                      control={control}
                      rules={{ required: isMotherAvailable === 'yes' ? 'Mother\'s First Name is required' : false }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.motherFirstName && <p className="mt-1 text-sm text-red-600">{String(errors.motherFirstName.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <Controller
                      name="motherLastName"
                      control={control}
                      rules={{ required: isMotherAvailable === 'yes' ? 'Mother\'s Last Name is required' : false }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.motherLastName && <p className="mt-1 text-sm text-red-600">{String(errors.motherLastName.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <Controller
                      name="motherMiddleName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Extension Name</label>
                    <Controller
                      name="motherExtensionName"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g., Jr., Sr."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                    <Controller
                      name="motherContactNumber"
                      control={control}
                      rules={{ required: isMotherAvailable === 'yes' ? 'Mother\'s Contact Number is required' : false }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="tel"
                          placeholder="e.g., 09171234567"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.motherContactNumber && <p className="mt-1 text-sm text-red-600">{String(errors.motherContactNumber.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation *</label>
                    <Controller
                      name="motherOccupation"
                      control={control}
                      rules={{ required: isMotherAvailable === 'yes' ? 'Mother\'s Occupation is required' : false }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g., Teacher, Housewife"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.motherOccupation && <p className="mt-1 text-sm text-red-600">{String(errors.motherOccupation.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income *</label>
                    <Controller
                      name="motherMonthlyIncome"
                      control={control}
                      rules={{ required: isMotherAvailable === 'yes' ? 'Mother\'s Monthly Income is required' : false }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="e.g., 15000 (Enter 0 if not applicable)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.motherMonthlyIncome && <p className="mt-1 text-sm text-red-600">{String(errors.motherMonthlyIncome.message)}</p>}
                  </div>

                    </>
                  )}

                  {/* Father's Information */}
                  <div className="col-span-full mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Father's Information</h3>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Please indicate your father's status *</label>
                    <Controller
                      name="isFatherAvailable"
                      control={control}
                      rules={{ required: 'Please indicate your father\'s status' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Status</option>
                          <option value="yes">Living</option>
                          <option value="no">Deceased</option>
                        </select>
                      )}
                    />
                    {errors.isFatherAvailable && <p className="mt-1 text-sm text-red-600">{String(errors.isFatherAvailable.message)}</p>}
                  </div>

                  {isFatherAvailable === 'yes' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                        <Controller
                          name="fatherFirstName"
                          control={control}
                          rules={{ required: isFatherAvailable === 'yes' ? 'Father\'s First Name is required' : false }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                        />
                        {errors.fatherFirstName && <p className="mt-1 text-sm text-red-600">{String(errors.fatherFirstName.message)}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                        <Controller
                          name="fatherLastName"
                          control={control}
                          rules={{ required: isFatherAvailable === 'yes' ? 'Father\'s Last Name is required' : false }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                        />
                        {errors.fatherLastName && <p className="mt-1 text-sm text-red-600">{String(errors.fatherLastName.message)}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                        <Controller
                          name="fatherMiddleName"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Extension Name</label>
                        <Controller
                          name="fatherExtensionName"
                          control={control}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              placeholder="e.g., Jr., Sr., III"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                        <Controller
                          name="fatherContactNumber"
                          control={control}
                          rules={{ required: isFatherAvailable === 'yes' ? 'Father\'s Contact Number is required' : false }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="tel"
                              placeholder="e.g., 09171234567"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                        />
                        {errors.fatherContactNumber && <p className="mt-1 text-sm text-red-600">{String(errors.fatherContactNumber.message)}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Occupation *</label>
                        <Controller
                          name="fatherOccupation"
                          control={control}
                          rules={{ required: isFatherAvailable === 'yes' ? 'Father\'s Occupation is required' : false }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              placeholder="e.g., Driver, Engineer"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                        />
                        {errors.fatherOccupation && <p className="mt-1 text-sm text-red-600">{String(errors.fatherOccupation.message)}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Income *</label>
                        <Controller
                          name="fatherMonthlyIncome"
                          control={control}
                          rules={{ required: isFatherAvailable === 'yes' ? 'Father\'s Monthly Income is required' : false }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="e.g., 20000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                        />
                        {errors.fatherMonthlyIncome && <p className="mt-1 text-sm text-red-600">{String(errors.fatherMonthlyIncome.message)}</p>}
                      </div>
                    </>
                  )}

                  {/* Emergency Contact */}
                  <div className="col-span-full mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Emergency Contact Information</h3>
                    <p className="text-sm text-gray-600 mb-4">Person to contact in case of emergency (if different from parents)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <Controller
                      name="emergencyContactName"
                      control={control}
                      rules={{ required: 'Emergency Contact Name is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g., Juan Dela Cruz"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.emergencyContactName && <p className="mt-1 text-sm text-red-600">{String(errors.emergencyContactName.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                    <Controller
                      name="emergencyContactNumber"
                      control={control}
                      rules={{ required: 'Emergency Contact Number is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="tel"
                          placeholder="e.g., 09171234567"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.emergencyContactNumber && <p className="mt-1 text-sm text-red-600">{String(errors.emergencyContactNumber.message)}</p>}
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Student *</label>
                    <Controller
                      name="emergencyContactRelationship"
                      control={control}
                      rules={{ required: 'Relationship is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Relationship</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Aunt/Uncle">Aunt/Uncle</option>
                          <option value="Grandparent">Grandparent</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Other Relative">Other Relative</option>
                          <option value="Friend">Friend</option>
                        </select>
                      )}
                    />
                    {errors.emergencyContactRelationship && <p className="mt-1 text-sm text-red-600">{String(errors.emergencyContactRelationship.message)}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Socio-Economic & Financial Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Socio-Economic & Financial Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Employment Section */}
                  <div className="col-span-full">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Student Employment Status</h3>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Are you (the student) currently working or employed? *
                      <span className="text-gray-500 text-xs ml-2">(Part-time or full-time)</span>
                    </label>
                    <Controller
                      name="isStudentEmployed"
                      control={control}
                      rules={{ required: 'Student employment status is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Option</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      )}
                    />
                    {errors.isStudentEmployed && <p className="mt-1 text-sm text-red-600">{String(errors.isStudentEmployed.message)}</p>}
                  </div>

                  {isStudentEmployed === 'yes' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Occupation/Job *</label>
                        <Controller
                          name="studentOccupation"
                          control={control}
                          rules={{ required: isStudentEmployed === 'yes' ? 'Student occupation is required' : false }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="text"
                              placeholder="e.g., Sales Associate, Cashier"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                        />
                        {errors.studentOccupation && <p className="mt-1 text-sm text-red-600">{String(errors.studentOccupation.message)}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Monthly Income *</label>
                        <Controller
                          name="studentMonthlyIncome"
                          control={control}
                          rules={{ required: isStudentEmployed === 'yes' ? 'Student monthly income is required' : false }}
                          render={({ field }) => (
                            <input
                              {...field}
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="e.g., 5000"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                          )}
                        />
                        {errors.studentMonthlyIncome && <p className="mt-1 text-sm text-red-600">{String(errors.studentMonthlyIncome.message)}</p>}
                      </div>
                    </>
                  )}

                  {/* Family Income Section */}
                  <div className="col-span-full mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Family Income</h3>
                    <p className="text-sm text-gray-600 mb-4">Combined income of all family members (parents, guardians, etc.)</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Family Monthly Income Range *</label>
                    <p className="text-xs text-gray-500 mb-2">This will be used if individual family member incomes are not provided above</p>
                    <Controller
                      name="totalFamilyMonthlyIncome"
                      control={control}
                      rules={{ required: 'Total family monthly income is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Income Range</option>
                          <option value="Below 5,000">Below ₱5,000</option>
                          <option value="5,000-10,000">₱5,000 - ₱10,000</option>
                          <option value="10,000-15,000">₱10,000 - ₱15,000</option>
                          <option value="15,000-20,000">₱15,000 - ₱20,000</option>
                          <option value="20,000-30,000">₱20,000 - ₱30,000</option>
                          <option value="30,000-50,000">₱30,000 - ₱50,000</option>
                          <option value="Above 50,000">Above ₱50,000</option>
                        </select>
                      )}
                    />
                    {errors.totalFamilyMonthlyIncome && <p className="mt-1 text-sm text-red-600">{String(errors.totalFamilyMonthlyIncome.message)}</p>}
                  </div>

                  {/* Family Details */}
                  <div className="col-span-full mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Family Information</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Siblings *</label>
                    <Controller
                      name="numberOfSiblings"
                      control={control}
                      rules={{ required: 'Number of Siblings is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="e.g., 3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.numberOfSiblings && <p className="mt-1 text-sm text-red-600">{String(errors.numberOfSiblings.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">How many siblings are currently enrolled in school? *</label>
                    <Controller
                      name="numberOfSiblingsInSchool"
                      control={control}
                      rules={{ required: 'Number of siblings in school is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="e.g., 2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.numberOfSiblingsInSchool && <p className="mt-1 text-sm text-red-600">{String(errors.numberOfSiblingsInSchool.message)}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Home Ownership Status *</label>
                    <Controller
                      name="homeOwnershipStatus"
                      control={control}
                      rules={{ required: 'Home Ownership Status is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Status</option>
                          <option value="owned">Owned</option>
                          <option value="rented">Rented</option>
                          <option value="living_with_relatives">Living with relatives</option>
                          <option value="boarding_house">Boarding house</option>
                          <option value="informal_settlers">Informal Settlers</option>
                          <option value="others">Others</option>
                        </select>
                      )}
                    />
                    {errors.homeOwnershipStatus && <p className="mt-1 text-sm text-red-600">{String(errors.homeOwnershipStatus.message)}</p>}
                  </div>

                  {/* Marginalized Groups & Benefits */}
                  <div className="col-span-full mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Marginalized Groups & Government Benefits</h3>
                    <p className="text-sm text-gray-600 mb-4">Please indicate if you belong to any of the following groups:</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Are you a Solo Parent? *</label>
                    <Controller
                      name="isSoloParent"
                      control={control}
                      rules={{ required: 'Solo Parent status is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Option</option>
                          <option value="yes">YES</option>
                          <option value="no">NO</option>
                        </select>
                      )}
                    />
                    {errors.isSoloParent && <p className="mt-1 text-sm text-red-600">{String(errors.isSoloParent.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Are you a member of an Indigenous Group? *</label>
                    <Controller
                      name="isIndigenousGroup"
                      control={control}
                      rules={{ required: 'Indigenous Group status is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Option</option>
                          <option value="yes">YES</option>
                          <option value="no">NO</option>
                        </select>
                      )}
                    />
                    {errors.isIndigenousGroup && <p className="mt-1 text-sm text-red-600">{String(errors.isIndigenousGroup.message)}</p>}
                  </div>

                  {isIndigenousGroup === 'yes' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specify Indigenous Group Name *</label>
                      <Controller
                        name="indigenousGroupName"
                        control={control}
                        rules={{ required: isIndigenousGroup === 'yes' ? 'Indigenous group name is required' : false }}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="e.g., Aeta, Igorot, etc."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        )}
                      />
                      {errors.indigenousGroupName && <p className="mt-1 text-sm text-red-600">{String(errors.indigenousGroupName.message)}</p>}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Are you a 4Ps Beneficiary? *</label>
                    <Controller
                      name="is4PsBeneficiary"
                      control={control}
                      rules={{ required: '4Ps beneficiary status is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Option</option>
                          <option value="yes">YES</option>
                          <option value="no">NO</option>
                        </select>
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-1">Pantawid Pamilyang Pilipino Program</p>
                    {errors.is4PsBeneficiary && <p className="mt-1 text-sm text-red-600">{String(errors.is4PsBeneficiary.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Are you a registered voter in Quezon City? *</label>
                    <Controller
                      name="isRegisteredVoter"
                      control={control}
                      rules={{ required: 'Registered Voter status is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Option</option>
                          <option value="yes">YES</option>
                          <option value="no">NO</option>
                        </select>
                      )}
                    />
                    {errors.isRegisteredVoter && <p className="mt-1 text-sm text-red-600">{String(errors.isRegisteredVoter.message)}</p>}
                  </div>

                  {/* Financial Need & Disbursement */}
                  <div className="col-span-full mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Financial Need & Scholarship Amount</h3>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Describe your financial need *</label>
                    <Controller
                      name="financialNeedDescription"
                      control={control}
                      rules={{ 
                        required: 'Financial need description is required',
                        minLength: {
                          value: 20,
                          message: 'Please provide at least 20 characters'
                        },
                        maxLength: {
                          value: 500,
                          message: 'Description must not exceed 500 characters'
                        }
                      }}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          rows={4}
                          placeholder="Please explain why you need financial assistance for your education. Include details about your family's financial situation, challenges, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {watch('financialNeedDescription')?.length || 0} / 500 characters (minimum 20)
                    </p>
                    {errors.financialNeedDescription && <p className="mt-1 text-sm text-red-600">{String(errors.financialNeedDescription.message)}</p>}
                  </div>


                  {/* Payment/Disbursement Method */}
                  <div className="col-span-full mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Scholarship Disbursement Method</h3>
                    <p className="text-sm text-gray-600 mb-4">How would you like to receive the scholarship funds?</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                    <Controller
                      name="paymentMethod"
                      control={control}
                      rules={{ required: 'Payment method is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Payment Method</option>
                          <option value="GCash">GCash</option>
                          <option value="PayMaya">PayMaya</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash (Over-the-counter)</option>
                        </select>
                      )}
                    />
                    {errors.paymentMethod && <p className="mt-1 text-sm text-red-600">{String(errors.paymentMethod.message)}</p>}
                  </div>

                  {paymentMethod && paymentMethod !== 'Cash' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number / Mobile Number *</label>
                      <Controller
                        name="accountNumber"
                        control={control}
                        rules={{ 
                          required: paymentMethod !== 'Cash' ? 'Account number is required' : false,
                          minLength: {
                            value: 10,
                            message: 'Account number must be at least 10 digits'
                          }
                        }}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder={paymentMethod === 'Bank Transfer' ? 'Enter bank account number' : 'Enter mobile number (09xxxxxxxxx)'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        )}
                      />
                      {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{String(errors.accountNumber.message)}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Scholarship Information */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Scholarship and Enrollment Information</h2>
                
                {isLoadingData && (
                  <div className="space-y-6">
                    <Skeleton variant="text" height={24} width={250} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton variant="text" height={14} width={100} />
                          <Skeleton variant="rectangular" height={40} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!isLoadingData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scholarship Information Section */}
                    <div className="col-span-full">
                      <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Scholarship Information</h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Category *</label>
                    <Controller
                      name="scholarshipCategory"
                      control={control}
                      rules={{ required: 'Scholarship Category is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const categoryId = parseInt(e.target.value);
                            setSelectedCategoryId(categoryId);
                            // Reset subcategory when category changes
                            setSelectedSubcategoryId(null);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Scholarship Category</option>
                          {Array.isArray(scholarshipCategories) && scholarshipCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.scholarshipCategory && <p className="mt-1 text-sm text-red-600">{String(errors.scholarshipCategory.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship Subcategory *</label>
                    <Controller
                      name="scholarshipSubCategory"
                      control={control}
                      rules={{ required: 'Scholarship Subcategory is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const subcategoryId = parseInt(e.target.value);
                            setSelectedSubcategoryId(subcategoryId);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          disabled={!selectedCategoryId}
                        >
                          <option value="">Select Subcategory</option>
                          {selectedCategoryId && Array.isArray(scholarshipCategories) && scholarshipCategories
                            .find(cat => cat.id === selectedCategoryId)
                            ?.subcategories?.map((subcategory) => (
                              <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </option>
                            ))}
                        </select>
                      )}
                    />
                    {errors.scholarshipSubCategory && <p className="mt-1 text-sm text-red-600">{String(errors.scholarshipSubCategory.message)}</p>}
                  </div>

                  {/* Display Scholarship Amount */}
                  {selectedSubcategoryId && (
                    <div className="col-span-full">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Scholarship Details</h4>
                        <p className="text-sm text-blue-700">
                          <strong>Amount:</strong> ₱{scholarshipCategories
                            .find(cat => cat.subcategories?.some(sub => sub.id === selectedSubcategoryId))
                            ?.subcategories?.find(sub => sub.id === selectedSubcategoryId)?.amount?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          This is the predetermined amount for the selected scholarship subcategory.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about this scholarship program? *</label>
                    <Controller
                      name="howDidYouKnow"
                      control={control}
                      rules={{ 
                        required: 'Please select at least one option',
                        validate: (value) => {
                          if (Array.isArray(value) && value.length === 0) {
                            return 'Please select at least one option';
                          }
                          return true;
                        }
                      }}
                      render={({ field }) => (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {['Social Media', 'School Announcement', 'Friend/Family', 'Barangay Official', 'Website', 'Other'].map((source) => (
                            <label key={source} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={source}
                                checked={field.value?.includes(source) || false}
                                onChange={(e) => {
                                  const currentValue = field.value || [];
                                  if (e.target.checked) {
                                    field.onChange([...currentValue, source]);
                                  } else {
                                    field.onChange(currentValue.filter((v: string) => v !== source));
                                  }
                                }}
                                className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                              />
                              <span className="text-sm text-gray-700">{source}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    />
                    {errors.howDidYouKnow && <p className="mt-1 text-sm text-red-600">{String(errors.howDidYouKnow.message)}</p>}
                  </div>

                  {/* Current School Information */}
                  <div className="col-span-full mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Current School Information</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Educational Level *</label>
                    <Controller
                      name="educationalLevel"
                      control={control}
                      rules={{ required: 'Educational Level is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="TERTIARY/COLLEGE">TERTIARY/COLLEGE</option>
                          <option value="SENIOR HIGH SCHOOL">SENIOR HIGH SCHOOL</option>
                          <option value="VOCATIONAL">VOCATIONAL</option>
                        </select>
                      )}
                    />
                    {errors.educationalLevel && <p className="mt-1 text-sm text-red-600">{String(errors.educationalLevel.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Is Current School at Caloocan? *</label>
                    <Controller
                      name="isSchoolAtCaloocan"
                      control={control}
                      rules={{ required: 'School location is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="YES">YES</option>
                          <option value="NO">NO</option>
                        </select>
                      )}
                    />
                    {errors.isSchoolAtCaloocan && <p className="mt-1 text-sm text-red-600">{String(errors.isSchoolAtCaloocan.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name of School *</label>
                    <Controller
                      name="schoolName"
                      control={control}
                      rules={{ required: 'School Name is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const schoolName = e.target.value;
                            setSelectedSchoolId(schoolName); // Store school name
                            
                            // Clear campus field when school changes
                            setValue('campus', '');
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select School</option>
                          {Array.isArray(schools) && 
                            schools
                              .reduce((unique: School[], school) => {
                                if (!unique.find(s => s.name === school.name)) {
                                  unique.push(school);
                                }
                                return unique;
                              }, [])
                              .map((school) => (
                                <option key={school.id} value={school.name}>
                                  {school.name}
                                </option>
                              ))
                          }
                        </select>
                      )}
                    />
                    {errors.schoolName && <p className="mt-1 text-sm text-red-600">{String(errors.schoolName.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campus *</label>
                    <Controller
                      name="campus"
                      control={control}
                      rules={{ required: 'Campus is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Campus</option>
                          {selectedSchoolId && Array.isArray(schools) && 
                            schools
                              .filter(school => school.name === selectedSchoolId)
                              .map((school, index) => (
                                <option key={`${school.id}-${index}`} value={school.campus}>
                                  {school.campus}
                                </option>
                              ))
                          }
                        </select>
                      )}
                    />
                    {errors.campus && <p className="mt-1 text-sm text-red-600">{String(errors.campus.message)}</p>}
                  </div>



                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Units Currently Enrolled *</label>
                    <Controller
                      name="unitsEnrolled"
                      control={control}
                      rules={{ required: 'Units Enrolled is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Write N/A if Senior High School Student"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.unitsEnrolled && <p className="mt-1 text-sm text-red-600">{String(errors.unitsEnrolled.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Grade/Year Level *</label>
                    <Controller
                      name="gradeYearLevel"
                      control={control}
                      rules={{ required: 'Grade/Year Level is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Grade/Year Level</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="5th Year">5th Year</option>
                          <option value="Grade 11">Grade 11</option>
                          <option value="Grade 12">Grade 12</option>
                        </select>
                      )}
                    />
                    {errors.gradeYearLevel && <p className="mt-1 text-sm text-red-600">{String(errors.gradeYearLevel.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {educationalLevel === 'SENIOR HIGH SCHOOL' ? 'Track/Strand' : educationalLevel === 'VOCATIONAL' ? 'Course/Program' : 'Degree Program'} *
                    </label>
                    <Controller
                      name="courseProgram"
                      control={control}
                      rules={{ required: `${educationalLevel === 'SENIOR HIGH SCHOOL' ? 'Track/Strand' : 'Degree Program'} is required` }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder={
                            educationalLevel === 'SENIOR HIGH SCHOOL' 
                              ? 'e.g., STEM, ABM, HUMSS, etc.' 
                              : educationalLevel === 'VOCATIONAL'
                              ? 'e.g., Automotive Servicing, Cookery, etc.'
                              : 'e.g., BS Computer Science, AB Psychology, etc.'
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {educationalLevel === 'SENIOR HIGH SCHOOL' 
                        ? 'Enter your SHS track/strand' 
                        : educationalLevel === 'VOCATIONAL'
                        ? 'Enter your vocational course'
                        : 'Enter your college degree program'}
                    </p>
                    {errors.courseProgram && <p className="mt-1 text-sm text-red-600">{String(errors.courseProgram.message)}</p>}
                  </div>

                  {educationalLevel === 'TERTIARY/COLLEGE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Major/Specialization</label>
                      <Controller
                        name="major"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="e.g., Software Engineering, Clinical Psychology (Leave blank if not applicable)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                        )}
                      />
                      <p className="text-xs text-gray-500 mt-1">Optional: Enter your major or area of specialization if applicable</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Term/Semester *</label>
                    <Controller
                      name="schoolTerm"
                      control={control}
                      rules={{ required: 'School Term/Semester is required' }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          <option value="">Select Term</option>
                          <option value="1st Semester">1st Semester</option>
                          <option value="2nd Semester">2nd Semester</option>
                          <option value="Summer">Summer</option>
                        </select>
                      )}
                    />
                    {errors.schoolTerm && <p className="mt-1 text-sm text-red-600">{String(errors.schoolTerm.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Year *</label>
                    <Controller
                      name="schoolYear"
                      control={control}
                      rules={{ required: 'School Year is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g., 2023-2024"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.schoolYear && <p className="mt-1 text-sm text-red-600">{String(errors.schoolYear.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Units Completed *</label>
                    <Controller
                      name="unitsCompleted"
                      control={control}
                      rules={{ 
                        required: 'Units Completed is required',
                        validate: (value) => {
                          if (!value || value.trim() === '') {
                            return 'Units Completed is required';
                          }
                          if (value !== 'N/A' && isNaN(parseInt(value))) {
                            return 'Please enter a valid number or N/A';
                          }
                          return true;
                        }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Write N/A if Senior High School Student"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.unitsCompleted && <p className="mt-1 text-sm text-red-600">{String(errors.unitsCompleted.message)}</p>}
                  </div>

                  {/* Previous School Information Section */}
                  <div className="col-span-full mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Previous School Information</h3>
                    <p className="text-sm text-gray-600 mb-4">For transferees or if different from current school</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous School Name *</label>
                    <Controller
                      name="previousSchool"
                      control={control}
                      rules={{ required: 'Previous School Name is required' }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="e.g., ABC High School (Write N/A if not applicable)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter your previous school name, or N/A if not applicable</p>
                    {errors.previousSchool && <p className="mt-1 text-sm text-red-600">{String(errors.previousSchool.message)}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous School Address</label>
                    <Controller
                      name="previousSchoolAddress"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Optional: City/Municipality where previous school is located"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                  </div>

                  {/* Academic Performance Section */}
                  <div className="col-span-full mt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">Academic Performance</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">General Weighted Average *</label>
                    
                    {/* Input Format Selection */}
                    <div className="mb-2">
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gwaFormat"
                            value="percentage"
                            checked={gwaInputFormat === 'percentage'}
                            onChange={() => setGwaInputFormat('percentage')}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Percentage (0-100)</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="gwaFormat"
                            value="gwa"
                            checked={gwaInputFormat === 'gwa'}
                            onChange={() => setGwaInputFormat('gwa')}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">GWA (1.00-5.00)</span>
                        </label>
                      </div>
                    </div>

                    <Controller
                      name="generalWeightedAverage"
                      control={control}
                      rules={{ 
                        required: 'General Weighted Average is required',
                        validate: (value) => {
                          if (!value) return true; // Let required rule handle empty values
                          
                          const numValue = parseFloat(value);
                          if (isNaN(numValue)) return 'Please enter a valid number';
                          
                          if (gwaInputFormat === 'percentage') {
                            if (numValue < 0 || numValue > 100) {
                              return 'Percentage must be between 0 and 100';
                            }
                          } else {
                            if (numValue < 1.00 || numValue > 5.00) {
                              return 'GWA must be between 1.00 and 5.00';
                            }
                          }
                          
                          return true;
                        }
                      }}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          step={gwaInputFormat === 'percentage' ? '0.01' : '0.25'}
                          min={gwaInputFormat === 'percentage' ? '0' : '1.00'}
                          max={gwaInputFormat === 'percentage' ? '100' : '5.00'}
                          placeholder={gwaInputFormat === 'percentage' ? 'e.g., 96' : 'e.g., 1.25'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      )}
                    />
                    {errors.generalWeightedAverage && <p className="mt-1 text-sm text-red-600">{String(errors.generalWeightedAverage.message)}</p>}
                    
                    {/* Conversion Info */}
                    {gwaInputFormat === 'percentage' && (
                      <p className="mt-1 text-xs text-gray-500">
                        Will be converted to GWA scale (1.00-5.00, where 1.00 is highest)
                      </p>
                    )}
                  </div>
                </div>
                )}
              </div>
            )}


            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Next button clicked, current step:', currentStep, 'isEditMode:', isEditMode);
                    const isValid = await validateCurrentStep(currentStep);
                    console.log('Validation result:', isValid);
                    if (isValid) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      console.log('Validation failed, staying on step:', currentStep);
                    }
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 text-white rounded-md flex items-center ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  {isSubmitting && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmitting ? 'Saving…' : 'Save Draft'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Draft Saved Successfully!</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Your application has been saved as a draft. Please upload the required documents and submit when ready.
                </p>
                
                {/* Document Upload Reminder */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">📄 Important: Upload Required Documents</h4>
                      <p className="mt-1 text-sm text-blue-700">
                        To complete your application, you need to upload the required documents through your dashboard. 
                        Your application will not be processed until all documents are uploaded.
                      </p>
                      <div className="mt-2 text-xs text-blue-600">
                        <p><strong>Required documents:</strong></p>
                        <ul className="mt-1 ml-4 list-disc text-left space-y-1">
                          <li>Birth Certificate (PSA/NSO authenticated copy)</li>
                          <li>Transcript of Records (Latest)</li>
                          <li>Certificate of Good Moral Character</li>
                          <li>Income Certificate</li>
                          <li>Barangay Certificate</li>
                          <li>Valid ID (Government-issued)</li>
                          <li>Proof of Residency</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                      </div>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/scholarship-dashboard');
                  }}
                  className="px-4 py-2 bg-orange-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
