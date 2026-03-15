import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  FileText, Upload, CheckCircle, User, GraduationCap,
  PhilippinePeso, ArrowRight, ArrowLeft, Loader2, AlertCircle, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { useAuthStore } from '../../store/v1authStore';
import { scholarshipApiService } from '../../services/scholarshipApiService';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { getScholarshipServiceUrl } from '../../config/api';

// Schema Validation
const renewalSchema = yup.object({
  // Step 1: Personal Information (Mostly Read-only/Pre-filled)
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  middleName: yup.string().optional(),
  extensionName: yup.string().optional().nullable(),
  emailAddress: yup.string().email('Invalid email').required('Email address is required'),
  contactNumber: yup.string().required('Contact number is required'),

  // Step 2: Academic & Application Updates (Editable)
  schoolYear: yup.string().required('School year is required'),
  schoolTerm: yup.string().required('School term is required'),
  currentEducationalLevel: yup.string().optional().default('Tertiary/College'),
  course: yup.string().required('Course/Program is required'),
  yearLevel: yup.string().required('Year level is required'),
  unitsEnrolled: yup.string().required('Units enrolled is required'),
  gwa: yup.string().required('GWA is required'),
  isGraduating: yup.string().required('Graduating status is required'),

  // Financial/Other Changes
  paymentMethod: yup.string().required('Payment method is required'),
  bankName: yup.string().when('paymentMethod', {
    is: (val: string | undefined) => val === 'Bank Transfer',
    then: (schema) => schema.required('Bank name is required'),
    otherwise: (schema) => schema.optional()
  }),
  walletAccountNumber: yup.string().when('paymentMethod', {
    is: (val: string | undefined) => val && val !== 'Cash',
    then: (schema) => schema.required('Account/Mobile number is required'),
    otherwise: (schema) => schema.optional()
  }),

  // Step 3: Documents
  // files managed via state, validated manually before submit
});

// Explicit interface to avoid type inference issues with yup .when() clauses
interface RenewalFormData {
  firstName: string;
  lastName: string;
  middleName?: string;
  extensionName?: string | null;
  emailAddress: string;
  contactNumber: string;
  schoolYear: string;
  schoolTerm: string;
  currentEducationalLevel: string;
  course: string;
  yearLevel: string;
  unitsEnrolled: string;
  gwa: string;
  isGraduating: string;
  paymentMethod: string;
  bankName?: string;
  walletAccountNumber?: string;
}

export const RenewalForm: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousApplication, setPreviousApplication] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, File>>({});
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [isSemester2Open, setIsSemester2Open] = useState<boolean | null>(null);
  const [submittedApplicationNumber, setSubmittedApplicationNumber] = useState<string | null>(null);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [renewalDocTypes, setRenewalDocTypes] = useState<any[]>([]);
  const [isDocTypesLoaded, setIsDocTypesLoaded] = useState(false);
  const [userClickedSubmit, setUserClickedSubmit] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RenewalFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(renewalSchema) as any,
    mode: 'onChange',
    defaultValues: {
      isGraduating: 'No',
      paymentMethod: '',
      bankName: '',
      walletAccountNumber: '',
      middleName: '',
      extensionName: '',
      currentEducationalLevel: 'Tertiary/College'
    }
  });

  // Watch fields for conditional rendering
  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    const fetchPreviousApplication = async () => {
      try {
        setIsLoadingData(true);

        // Parallel fetch
        console.log('[RenewalForm] Starting data fetch...');
        const [applications, periods, docTypes] = await Promise.all([
          scholarshipApiService.getUserApplications(),
          scholarshipApiService.getAcademicPeriods(),
          scholarshipApiService.adminGetDocumentTypes().catch((err) => {
            console.error('[RenewalForm] Failed to fetch document types:', err);
            return [];
          })
        ]);

        console.log('[RenewalForm] Fetched data:', {
          applicationsCount: applications.length,
          periodsCount: periods.length,
          docTypesCount: docTypes.length,
          allDocTypes: docTypes,
          firstDocType: docTypes[0],
          docTypeCategories: docTypes.map((dt: any) => ({ id: dt.id, name: dt.name, category: dt.category }))
        });

        // Find all renewal document types from the API
        // Try both 'renewal' and case variations
        const renewalTypes = docTypes.filter((dt: any) => {
          const category = dt.category?.toLowerCase();
          console.log('[RenewalForm] Checking doc type:', { 
            id: dt.id, 
            name: dt.name, 
            category: dt.category,
            categoryLower: category,
            matches: category === 'renewal'
          });
          return category === 'renewal';
        });
        console.log('[RenewalForm] Filtered renewal document types:', {
          renewalTypesCount: renewalTypes.length,
          renewalTypes: renewalTypes
        });
        setRenewalDocTypes(renewalTypes);
        setIsDocTypesLoaded(true);

        // Check for open period specifically at semester 2
        const openPeriod = periods.find(p => p.status === 'open' && p.is_current);
        const isSem2 = openPeriod ? (openPeriod.period_number === 2) : false;

        // Extract unique academic years and sort them descending
        const uniqueYears = Array.from(new Set(periods.map(p => p.academic_year)))
          .filter(Boolean)
          .sort()
          .reverse();
        setAcademicYears(uniqueYears);

        setIsSemester2Open(isSem2);

        if (!openPeriod) {
          setIsEligible(false);
          setError('No active academic period is currently open.');
          return;
        }

        if (!isSem2) {
          // Period is open but not semester 2 — renewal not yet available
          setIsEligible(false);
          return;
        }

        // Auto-populate School Year and Semester from the active academic period
        if (openPeriod) {
          setValue('schoolYear', openPeriod.academic_year);

          let term = '';
          if (openPeriod.period_type === 'Semester') {
            if (openPeriod.period_number === 1) term = '1st Semester';
            else if (openPeriod.period_number === 2) term = '2nd Semester';
            else if (openPeriod.period_number === 3) term = 'Summer';
          } else {
            if (openPeriod.period_number === 1) term = `1st ${openPeriod.period_type}`;
            else if (openPeriod.period_number === 2) term = `2nd ${openPeriod.period_type}`;
            else if (openPeriod.period_number === 3) term = `3rd ${openPeriod.period_type}`;
          }
          if (term) setValue('schoolTerm', term);
        }

        // Eligible statuses: student was a scholar in Semester 1 or has an existing application
        const eligibleStatuses = [
          'approved', 'grants_processing', 'grants_disbursed',
          'endorsed_to_ssc', 'submitted', 'documents_reviewed',
          'interview_completed', 'interview_scheduled'
        ];
        const eligibleApps = applications.filter(app =>
          eligibleStatuses.includes(app.status?.toLowerCase())
        );

        console.log('[RenewalForm] Eligibility check:', {
          totalApplications: applications.length,
          eligibleApplications: eligibleApps.length,
          applicationStatuses: applications.map(app => app.status)
        });

        if (eligibleApps.length === 0) {
          console.warn('[RenewalForm] User not eligible for renewal');
          setIsEligible(false);
          setError('You are not eligible for renewal. You must have an existing scholarship application from Semester 1.');
          setTimeout(() => navigate('/portal'), 3000);
          return;
        }

        console.log('[RenewalForm] User is eligible for renewal');
        setIsEligible(true);

        // Find the latest eligible application to pre-fill
        const latestApp = eligibleApps[0];

        if (latestApp) {
          setPreviousApplication(latestApp);

          // Pre-fill Personal Info
          setValue('firstName', latestApp.student?.first_name || currentUser?.first_name || '');
          setValue('lastName', latestApp.student?.last_name || currentUser?.last_name || '');
          setValue('middleName', latestApp.student?.middle_name || '');
          setValue('extensionName', latestApp.student?.extension_name || '');
          setValue('emailAddress', latestApp.student?.email_address || currentUser?.email || '');
          setValue('contactNumber', latestApp.student?.contact_number || '');

          // Pre-fill some Academic Info that might stay same
          setValue('currentEducationalLevel', 'Tertiary/College');
          if (latestApp.student?.academic_records?.[0]?.program) {
            setValue('course', latestApp.student.academic_records[0].program);
          }

          // Pre-fill Wallet/Payment if available
          if (latestApp.wallet_account_number) {
            setValue('walletAccountNumber', latestApp.wallet_account_number);
            const walletNum = latestApp.wallet_account_number;
            if (walletNum.startsWith('09')) {
              setValue('paymentMethod', latestApp.digital_wallets?.[0] || 'GCash');
            } else {
              setValue('paymentMethod', 'Bank Transfer');
            }
          }
        } else {
          // @ts-ignore
          setValue('firstName', currentUser?.first_name || '');
          // @ts-ignore
          setValue('lastName', currentUser?.last_name || '');
          setValue('emailAddress', currentUser?.email || '');
        }
      } catch (err) {
        console.error('[RenewalForm] Error fetching previous application:', err);
        setError('Failed to load previous application data. Please try again.');
        setIsEligible(false);
      } finally {
        console.log('[RenewalForm] Data loading complete');
        setIsLoadingData(false);
      }
    };

    if (currentUser) {
      fetchPreviousApplication();
    }
  }, [currentUser, setValue, navigate]);

  const handleFileForDocType = (docTypeId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploadedFiles(prev => ({ ...prev, [docTypeId]: event.target.files![0] }));
    }
  };

  const handleRemoveFileForDocType = (docTypeId: number) => {
    setUploadedFiles(prev => {
      const next = { ...prev };
      delete next[docTypeId];
      return next;
    });
  };

  /**
   * Upload a single file document via the forms/upload-document endpoint.
   * Returns the created document record or null on failure.
   */
  const uploadDocumentFile = async (file: File, applicationId: number, studentId: number, docTypeId: number): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('application_id', String(applicationId));
      formData.append('student_id', String(studentId));
      formData.append('document_type_id', String(docTypeId));

      const response = await fetch(
        getScholarshipServiceUrl('/api/forms/upload-document'),
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.warn('Document upload warning:', errData);
        // Don't fail entire submission for individual doc upload errors
        return false;
      }

      return true;
    } catch (err) {
      console.warn('Document upload error (non-fatal):', err);
      return false;
    }
  };

  const onSubmit = async (data: RenewalFormData) => {
    console.log('[RenewalForm] Form submission started', { 
      currentStep, 
      userClickedSubmit,
      timestamp: new Date().toISOString() 
    });
    
    // Prevent submission if not on step 3 OR if user didn't explicitly click submit
    if (currentStep !== 3) {
      console.warn('[RenewalForm] Attempted submission from step', currentStep, '- BLOCKED');
      return;
    }
    
    if (!userClickedSubmit) {
      console.warn('[RenewalForm] Submission attempted without user clicking submit button - BLOCKED');
      return;
    }
    
    console.log('[RenewalForm] Submission validation passed - proceeding');
    setIsSubmitting(true);
    setError(null);
    setUserClickedSubmit(false); // Reset flag

    // Validate files - only require uploads if renewal document types are configured
    const fileEntries = Object.entries(uploadedFiles);
    console.log('[RenewalForm] Uploaded files:', { count: fileEntries.length, files: uploadedFiles });
    
    if (renewalDocTypes.length > 0 && fileEntries.length === 0) {
      console.warn('[RenewalForm] No documents uploaded but document types are available');
      setError('Please upload at least one renewal document (e.g., Grades, Certificate of Registration).');
      setIsSubmitting(false);
      return;
    }
    
    if (renewalDocTypes.length === 0) {
      console.log('[RenewalForm] No renewal document types configured - proceeding without new document uploads');
    }

    try {
      // Build the academic record from form data
      const academicRecord = {
        educational_level: 'TERTIARY/COLLEGE',
        program: data.course,
        year_level: data.yearLevel,
        school_year: data.schoolYear,
        school_term: data.schoolTerm,
        units_enrolled: parseInt(data.unitsEnrolled) || 0,
        general_weighted_average: parseFloat(data.gwa) || 0,
        is_graduating: data.isGraduating === 'Yes',
      };

      // Build payment info
      const digitalWallets: string[] = [];
      if (data.paymentMethod && data.paymentMethod !== 'Cash' && data.paymentMethod !== 'Bank Transfer') {
        digitalWallets.push(data.paymentMethod);
      }

      const payload = {
        // Student contact info updates (will be sent via form data)
        financial_need_description: 'Renewal application — continuing scholarship program.',
        reason_for_renewal: `Applying for renewal for ${data.schoolTerm} ${data.schoolYear}. GWA: ${data.gwa}.`,

        // Academic record for new semester
        academic_record: academicRecord,

        // Payment info
        payment_method: data.paymentMethod,
        bank_name: data.bankName || null,
        wallet_account_number: data.walletAccountNumber || null,
        digital_wallets: digitalWallets,
      };

      console.log('Submitting Renewal Application:', payload);

      // Call the actual API — backend handles eligibility, semester check, copy docs, endorse to SSC
      const result = await scholarshipApiService.submitRenewalApplication(payload);

      console.log('Renewal submission result:', result);

      // Upload new documents for the new application
      if (result?.id && previousApplication?.student?.id) {
        const uploadPromises = fileEntries.map(([docTypeId, file]) =>
          uploadDocumentFile(file, result.id as number, previousApplication.student.id, Number(docTypeId))
        );
        await Promise.all(uploadPromises);
      }

      setSubmittedApplicationNumber(result?.application_number || null);
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error('Renewal submission error:', err);
      const message = err?.message || 'Failed to submit renewal application. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your information...</p>
        </div>
      </div>
    );
  }

  // ── Not semester 2 ──────────────────────────────────────────────────────────
  if (isSemester2Open === false) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <div className="p-3 bg-yellow-100 rounded-full inline-block mb-4">
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Renewal Not Yet Available</h1>
          <p className="text-gray-600 mb-6">
            Scholarship renewal applications are only available when <strong>Semester 2</strong> is open.
            Please wait for the administrator to open the second semester application period.
          </p>
          <Button onClick={() => navigate('/portal')} className="w-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ── Not eligible ─────────────────────────────────────────────────────────────
  if (isEligible === false) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Eligible for Renewal</h1>
          <p className="text-gray-600 mb-6">
            {error || 'You need to have a scholarship application from a previous semester before you can apply for renewal.'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Redirecting you back to the portal...
          </p>
          <Button onClick={() => navigate('/portal')} className="w-full">
            Return to Portal Now
          </Button>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Renewal Submitted!</h1>
          {submittedApplicationNumber && (
            <p className="text-sm text-gray-500 mb-2">
              Application #: <strong>{submittedApplicationNumber}</strong>
            </p>
          )}
          <p className="text-gray-600 mb-4">
            Your scholarship renewal application has been successfully submitted and <strong>endorsed to SSC</strong> for review.
            Your previous documents have been carried over automatically.
          </p>
          <p className="text-sm text-green-700 bg-green-50 rounded p-2 mb-6">
            Status: <strong>Endorsed to SSC</strong> — No interview required for renewal.
          </p>
          <Button onClick={() => navigate('/portal')} className="w-full">
            Return to Portal
          </Button>
        </div>
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link to="/portal" className="hover:text-green-600">Portal</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Renewal Application</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Scholarship Renewal</h1>
          <p className="text-gray-600 mt-2">Update your academic information for the new term.</p>

          {previousApplication && (
            <div className="mt-3 inline-flex items-center text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200">
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Renewing from application #{previousApplication.application_number}
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0"></div>
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`relative z-10 flex flex-col items-center ${step <= currentStep ? 'text-green-600' : 'text-gray-400'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 bg-white
                  ${step <= currentStep ? 'border-green-600 text-green-600' : 'border-gray-300 text-gray-400'}
                  ${step === currentStep ? 'ring-4 ring-green-50' : ''}
                `}>
                  {step}
                </div>
                <span className="text-xs font-medium mt-2 bg-gray-50 px-2">
                  {step === 1 ? 'Personal Info' : step === 2 ? 'Academic Updates' : 'Documents'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form 
          onSubmit={handleSubmit(onSubmit, (validationErrors) => { 
            console.error('Form validation errors:', validationErrors); 
            setError('Please complete all required fields before submitting.'); 
          })} 
          onKeyDown={(e) => {
            // Prevent Enter key from submitting the form unless on step 3 and submit button is focused
            if (e.key === 'Enter' && currentStep !== 3) {
              e.preventDefault();
              console.log('[RenewalForm] Enter key blocked - not on final step');
            }
          }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 mx-6 mt-6 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* STEP 1: Personal Information */}
              <div className="space-y-6" style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
                  <User className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Review Personal Information</h2>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-6">
                  <p>Some information has been pre-filled from your previous application. Please verify it is correct. Most fields are read-only to ensure consistency.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label="First Name"
                    registration={register('firstName')}
                    error={errors.firstName?.message}
                    disabled
                    className="bg-gray-50"
                  />
                  <InputField
                    label="Last Name"
                    registration={register('lastName')}
                    error={errors.lastName?.message}
                    disabled
                    className="bg-gray-50"
                  />
                  <InputField
                    label="Middle Name"
                    registration={register('middleName')}
                    error={errors.middleName?.message}
                    disabled
                    className="bg-gray-50"
                  />
                  <InputField
                    label="Name Extension"
                    registration={register('extensionName')}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Contact Information (Editable)</h3>
                  </div>
                  <InputField
                    label="Email Address"
                    registration={register('emailAddress')}
                    error={errors.emailAddress?.message}
                  />
                  <InputField
                    label="Mobile Number"
                    registration={register('contactNumber')}
                    error={errors.contactNumber?.message}
                  />
                </div>
              </div>

            {/* STEP 2: Academic Updates */}
              <div className="space-y-6" style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Academic Updates</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Year *</label>
                    <select {...register('schoolYear')} className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500">
                      <option value="">Select School Year</option>
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    {errors.schoolYear && <p className="text-red-500 text-xs mt-1">{errors.schoolYear.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Term/Semester *</label>
                    <select {...register('schoolTerm')} className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500">
                      <option value="">Select Term</option>
                      <option value="1st Semester">1st Semester</option>
                      <option value="2nd Semester">2nd Semester</option>
                      <option value="Trimester">Trimester</option>
                      <option value="Summer">Summer</option>
                    </select>
                    {errors.schoolTerm && <p className="text-red-500 text-xs mt-1">{errors.schoolTerm.message}</p>}
                  </div>

                  <InputField
                    label="Course/Program"
                    registration={register('course')}
                    error={errors.course?.message}
                    placeholder="e.g. BS Information Technology"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Level *</label>
                    <select {...register('yearLevel')} className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500">
                      <option value="">Select Year Level</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="5th Year">5th Year</option>
                    </select>
                    {errors.yearLevel && <p className="text-red-500 text-xs mt-1">{errors.yearLevel.message}</p>}
                  </div>

                  <InputField
                    label="General Weighted Average (GWA)"
                    registration={register('gwa')}
                    error={errors.gwa?.message}
                    placeholder="e.g. 1.50"
                  />

                  <InputField
                    label="Units Enrolled"
                    registration={register('unitsEnrolled')}
                    error={errors.unitsEnrolled?.message}
                    placeholder="e.g. 21"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Are you Graduating this term? *</label>
                    <select {...register('isGraduating')} className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500">
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                    {errors.isGraduating && <p className="text-red-500 text-xs mt-1">{errors.isGraduating.message}</p>}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <PhilippinePeso className="h-5 w-5 mr-2 text-green-600" />
                    Disbursement Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                      <select
                        {...register('paymentMethod')}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select Payment Method</option>
                        <option value="GCash">GCash</option>
                        <option value="PayMaya">PayMaya</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Cash">Cash (Over-the-counter)</option>
                      </select>
                      {errors.paymentMethod && <p className="text-red-500 text-xs mt-1">{errors.paymentMethod.message}</p>}
                    </div>

                    {paymentMethod === 'Bank Transfer' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                        <select
                          {...register('bankName')}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">Select Bank</option>
                          <option value="BDO">BDO</option>
                          <option value="BPI">BPI</option>
                          <option value="Metrobank">Metrobank</option>
                          <option value="Landbank">Landbank</option>
                          <option value="PNB">PNB</option>
                          <option value="RCBC">RCBC</option>
                          <option value="Unionbank">Unionbank</option>
                          <option value="Chinabank">Chinabank</option>
                          <option value="Others">Others</option>
                        </select>
                        {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName.message}</p>}
                      </div>
                    )}

                    {paymentMethod && paymentMethod !== 'Cash' && (
                      <InputField
                        label={paymentMethod === 'Bank Transfer' ? 'Bank Account Number' : 'Mobile Number'}
                        registration={register('walletAccountNumber')}
                        error={errors.walletAccountNumber?.message}
                        placeholder={paymentMethod === 'Bank Transfer' ? 'e.g. 1234567890' : 'e.g. 09171234567'}
                      />
                    )}
                  </div>
                </div>
              </div>

            {/* STEP 3: Documents */}
              <div className="space-y-6" style={{ display: currentStep === 3 ? 'block' : 'none' }}>
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
                  <FileText className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Required Documents</h2>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Previous Documents Carried Over</h4>
                  <p className="text-sm text-blue-700">
                    Your documents from application #{previousApplication?.application_number} will be automatically linked to your renewal. Please upload any <strong>new or updated</strong> documents below.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">Required for Renewal:</h4>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    <li>Upload your <strong>Certificate of Registration/Enrollment</strong> for the new term.</li>
                    <li>Upload your <strong>Certificate of Grades/TOR</strong> from the previous term.</li>
                    <li>Ensure documents are clear and readable.</li>
                  </ul>
                </div>

                {renewalDocTypes.length > 0 ? (
                  <div className="space-y-4">
                    {renewalDocTypes.map((docType) => (
                      <div key={docType.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-800">{docType.name}</h4>
                            {docType.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{docType.description}</p>
                            )}
                          </div>
                          {uploadedFiles[docType.id] && (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          )}
                        </div>

                        {uploadedFiles[docType.id] ? (
                          <div className="flex items-center justify-between bg-green-50 p-3 rounded-md border border-green-200">
                            <div className="flex items-center">
                              <FileText className="h-5 w-5 text-green-600 mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">{uploadedFiles[docType.id].name}</p>
                                <p className="text-xs text-gray-500">{(uploadedFiles[docType.id].size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                              onClick={() => handleRemoveFileForDocType(docType.id)}
                              type="button"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                            <input
                              type="file"
                              onChange={(e) => handleFileForDocType(docType.id, e)}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG (Max 5MB)</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : isDocTypesLoaded ? (
                  <div className="border-2 border-dashed border-yellow-300 rounded-lg p-8 text-center bg-yellow-50">
                    <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Renewal Document Types Found</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      The system administrator needs to configure renewal document types before you can submit documents.
                    </p>
                    <p className="text-xs text-gray-500">
                      You can still proceed with the renewal, but you won't be able to upload new documents at this time.
                      Your previous documents will be carried over automatically.
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                    <p className="text-gray-500 text-sm">Loading document types...</p>
                  </div>
                )}
              </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Previous
              </Button>
            ) : (
              <div></div> // Spacer
            )}

            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep} className="bg-green-600 hover:bg-green-700 text-white">
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => {
                  console.log('[RenewalForm] Submit button clicked');
                  setUserClickedSubmit(true);
                }}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]"
                id="renewal-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Renewal'
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
