import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FileText, Upload, CheckCircle, User, GraduationCap, PhilippinePeso, ArrowRight, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { useAuthStore } from '../../store/v1authStore';
import { scholarshipApiService } from '../../services/scholarshipApiService';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';

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
  currentEducationalLevel: yup.string().required('Educational level is required'),
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);

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
      extensionName: ''
    }
  });

  // Watch fields for conditional rendering
  const paymentMethod = watch('paymentMethod');
  const [hasOpenPeriod, setHasOpenPeriod] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchPreviousApplication = async () => {
      try {
        setIsLoadingData(true);

        // Parallel fetch
        const [applications, periods] = await Promise.all([
          scholarshipApiService.getUserApplications(),
          scholarshipApiService.getAcademicPeriods()
        ]);

        // Check for open period and get it
        const openPeriod = periods.find(p => p.status === 'open' && p.is_current);
        const open = !!openPeriod;
        setHasOpenPeriod(open);

        if (!open) {
          setIsEligible(false);
          return;
        }

        // Auto-populate School Year and Semester from the active academic period
        if (openPeriod) {
          console.log('Auto-populating renewal academic period:', openPeriod);
          setValue('schoolYear', openPeriod.academic_year);

          let term = '';
          if (openPeriod.period_type === 'Semester') {
            if (openPeriod.period_number === 1) term = '1st Semester';
            else if (openPeriod.period_number === 2) term = '2nd Semester';
            else if (openPeriod.period_number === 3) term = 'Summer';
          } else {
            // Fallback
            if (openPeriod.period_number === 1) term = `1st ${openPeriod.period_type}`;
            else if (openPeriod.period_number === 2) term = `2nd ${openPeriod.period_type}`;
            else if (openPeriod.period_number === 3) term = `3rd ${openPeriod.period_type}`;
          }

          if (term) setValue('schoolTerm', term);
        }

        // Check if user has any completed applications
        const completedStatuses = ['approved', 'grants_disbursed'];
        const completedApps = applications.filter(app =>
          completedStatuses.includes(app.status?.toLowerCase())
        );

        if (completedApps.length === 0) {
          // User is not eligible for renewal
          setIsEligible(false);
          setError('You are not eligible for renewal. Please submit a new application first.');
          // Redirect after 3 seconds
          setTimeout(() => {
            navigate('/portal');
          }, 3000);
          return;
        }

        setIsEligible(true);

        // Find the latest completed application to pre-fill
        const latestApp = completedApps[0];

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
          // Try to get course from academic records if available
          if (latestApp.student?.academic_records?.[0]?.program) {
            setValue('course', latestApp.student.academic_records[0].program);
          }

          // Pre-fill Wallet/Payment if available
          if (latestApp.wallet_account_number) {
            setValue('walletAccountNumber', latestApp.wallet_account_number);
            // Heuristic to guess payment method
            const walletNum = latestApp.wallet_account_number;
            if (walletNum.startsWith('09')) {
              // Likely GCash or PayMaya
              setValue('paymentMethod', latestApp.digital_wallets?.[0] || 'GCash');
            } else {
              // Likely Bank Transfer if not starting with 09
              setValue('paymentMethod', 'Bank Transfer');
            }
          }
        } else {
          // Fallback to current user data if no app found
          // @ts-ignore
          setValue('firstName', currentUser?.first_name || '');
          // @ts-ignore
          setValue('lastName', currentUser?.last_name || '');
          setValue('emailAddress', currentUser?.email || '');
        }
      } catch (err) {
        console.error('Error fetching previous application:', err);
        setError('Failed to load previous application data. You may need to fill in all fields manually.');
        setIsEligible(false);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (currentUser) {
      fetchPreviousApplication();
    }
  }, [currentUser, setValue, navigate]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesArray = Array.from(event.target.files);
      setUploadedFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const onSubmit = async (data: RenewalFormData) => {
    setIsSubmitting(true);
    setError(null);

    if (uploadedFiles.length === 0) {
      setError('Please upload the required renewal documents (e.g., Grades, Certificate of Registration).');
      setIsSubmitting(false);
      return;
    }

    try {
      // Construct payload
      const payload = {
        ...data,
        type: 'renewal',
        previous_application_id: previousApplication?.id,
        // In real implementation, you would upload files first and send their IDs/URLs
        // For now we just log them
      };

      console.log('Submitting Renewal:', payload);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmitSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Failed to submit renewal application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Access check for academic period
  if (hasOpenPeriod === false) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <div className="p-3 bg-yellow-100 rounded-full inline-block mb-4">
            {/* Clock is imported above in original file */}
            <div className="w-12 h-12 text-yellow-600 flex items-center justify-center font-bold text-2xl">!</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Applications Closed</h1>
          <p className="text-gray-600 mb-6">
            Scholarship renewal applications are currently closed. Please wait for the next academic period to open.
          </p>
          <Button onClick={() => navigate('/portal')} className="w-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Show ineligibility message if user is not eligible for renewal (and period logic didn't catch it)
  if (isEligible === false) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Eligible for Renewal</h1>
          <p className="text-gray-600 mb-6">
            You need to have a completed scholarship application from a previous semester before you can renew. Please submit a new application first.
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

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Renewal Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Your scholarship renewal application has been successfully submitted. We will review your academic records and updated documents.
          </p>
          <Button onClick={() => navigate('/portal')} className="w-full">
            Return to Portal
          </Button>
        </div>
      </div>
    );
  }

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

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 mx-6 mt-6 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* STEP 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
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
            )}

            {/* STEP 2: Academic Updates */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Academic Updates</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Year *</label>
                    <select {...register('schoolYear')} className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500">
                      <option value="">Select School Year</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
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
            )}

            {/* STEP 3: Documents */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
                  <FileText className="h-6 w-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800">Required Documents</h2>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-2">Important for Renewal:</h4>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    <li>Upload your <strong>Certificate of Registration/Enrollment</strong> for the new term.</li>
                    <li>Upload your <strong>Certificate of Grades/TOR</strong> from the previous term.</li>
                    <li>Ensure documents are clear and readable.</li>
                  </ul>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-900 font-medium">Click to upload or drag and drop</p>
                  <p className="text-gray-500 text-sm mt-1">PDF, JPG, PNG (Max 5MB)</p>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                          onClick={() => handleRemoveFile(file.name)}
                          type="button"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white min-w-[150px]">
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
