import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ScholarshipDirectoryModal } from '../components/ScholarshipDirectoryModal';
import { scholarshipApiService, ScholarshipCategory } from '../services/scholarshipApiService';
import { useAuthStore } from '../store/v1authStore';
import { Skeleton } from '../components/ui/Skeleton';
import { HumanVerification } from '../components/HumanVerification';

// Add custom CSS for world-class animations
const customStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  /* Text Gradient Animation (brand colors) */
  .animated-text {
    /* Rotate through primary (#4CAF50) and secondary (#4A90E2) hues */
    background: linear-gradient(45deg, #2E7D32, #4CAF50, #4A90E2, #305C90);
    background-size: 300% 300%;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: gradient-shift 4s ease-in-out infinite;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
  
  @keyframes gradient-shift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  
  /* Smooth Transitions */
  .smooth-transition {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
  }
  
  .animate-fade-in {
    animation: fade-in 1s ease-out forwards;
  }
  
  .delay-300 {
    animation-delay: 300ms;
  }
  
  .shadow-3xl {
    box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

export const Portal: React.FC = () => {
  const navigate = useNavigate();
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [hasActiveApplication, setHasActiveApplication] = useState(false);
  const [categories, setCategories] = useState<ScholarshipCategory[]>([]);
  const [isCheckingApplications, setIsCheckingApplications] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [showHumanVerification, setShowHumanVerification] = useState(false);
  const currentUser = useAuthStore(s => s.currentUser);

  // Redirect SSC users to admin dashboard
  useEffect(() => {
    if (currentUser) {
      const roleStr = String(currentUser.role);
      if (roleStr === 'admin' || roleStr === 'staff' || roleStr.startsWith('ssc')) {
        navigate('/admin', { replace: true });
        return;
      }
    }
  }, [currentUser, navigate]);

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
        // Pending/Active statuses: draft, submitted, documents_reviewed, interview_scheduled, interview_completed, endorsed_to_ssc, approved, grants_processing, grants_disbursed, on_hold
        // Only rejected and cancelled applications allow new applications
        const activeStatuses = ['draft', 'submitted', 'documents_reviewed', 'interview_scheduled', 'interview_completed', 'endorsed_to_ssc', 'approved', 'grants_processing', 'grants_disbursed', 'on_hold', 'for_compliance', 'compliance_documents_submitted'];
        const hasActive = applications.some(app => activeStatuses.includes(app.status?.toLowerCase()));

        setHasActiveApplication(hasActive);
        console.log('User applications:', applications);
        console.log('Has active application:', hasActive);
      } catch (error) {
        console.error('Error checking existing applications:', error);
        // If there's an error, allow access (fail open)
        setHasActiveApplication(false);
      } finally {
        setIsCheckingApplications(false);
      }
    };

    checkExistingApplications();
  }, [currentUser]);

  // Fetch scholarship categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await scholarshipApiService.getScholarshipCategories();
        console.log('Fetched scholarship categories:', data);
        setCategories(data);
      } catch (error) {
        console.error('Error fetching scholarship categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Show modal after component mounts (after login)
  useEffect(() => {
    console.log('Portal component mounted, checking for directory modal...');
    const hasSeenDirectory = localStorage.getItem('hasSeenDirectory');
    console.log('hasSeenDirectory:', hasSeenDirectory);

    // For now, always show the modal for testing
    // You can change this back to check localStorage later
    setShowDirectoryModal(true);

    // Original logic (commented out for testing):
    // if (!hasSeenDirectory) {
    //   setShowDirectoryModal(true);
    // }
  }, []);

  const handleCloseModal = () => {
    setShowDirectoryModal(false);
    localStorage.setItem('hasSeenDirectory', 'true');
  };

  const handleNewApplicationClick = () => {
    if (hasActiveApplication) {
      setShowToast(true);
      // Auto-hide toast after 5 seconds
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  console.log('Portal render - showDirectoryModal:', showDirectoryModal);

  return (
    <div>
      {/* Scholarship Directory Modal */}
      <ScholarshipDirectoryModal
        isOpen={showDirectoryModal}
        onClose={handleCloseModal}
      />

      {/* Hero Section - World-Class Design */}
      <section
        className="relative h-96 flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(/ll.svg)',
          backgroundSize: 'contain',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Clean minimal design - no animations or effects */}
      </section>

      {/* Action Buttons Section - Optimized for viewport */}
      <section className="py-12 bg-gradient-to-br from-background via-white to-primary-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary-200 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary-200 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-accent-200 rounded-full blur-3xl opacity-10"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            {/* Enhanced heading with animated gradient and better contrast */}
            <div className="space-y-3 -mt-4">
              <h3 className="text-3xl lg:text-5xl font-bold animated-text drop-shadow-lg uppercase">
                Ready to Begin Your Journey?
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto smooth-transition hover:text-gray-800">
                Take the first step towards your educational dreams with our comprehensive scholarship program
              </p>
            </div>

            {/* Responsive card-style buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 justify-center items-center max-w-6xl mx-auto">
              <div className="bg-gray-100 rounded-xl p-3 sm:p-4 shadow-lg">
                <Link to="/scholarship-dashboard" className="block w-full">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 text-sm sm:text-base lg:text-lg font-semibold w-full h-10 sm:h-11 lg:h-12 flex items-center justify-center whitespace-nowrap uppercase tracking-wide"
                  >
                    Scholar Dashboard
                  </Button>
                </Link>
              </div>

              <div className="bg-gray-100 rounded-xl p-3 sm:p-4 shadow-lg">
                {isCheckingApplications ? (
                  <div className="w-full h-10 sm:h-11 lg:h-12">
                    <Skeleton variant="rectangular" height="100%" />
                  </div>
                ) : hasActiveApplication ? (
                  <Button
                    size="lg"
                    onClick={handleNewApplicationClick}
                    className="bg-gray-400 text-white border-0 shadow-md hover:bg-gray-500 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold w-full h-12 sm:h-14 lg:h-16 flex items-center justify-center whitespace-nowrap uppercase tracking-wide transition-colors"
                  >
                    New Application
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={() => setShowHumanVerification(true)}
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 text-sm sm:text-base lg:text-lg font-semibold w-full h-10 sm:h-11 lg:h-12 flex items-center justify-center whitespace-nowrap uppercase tracking-wide"
                  >
                    New Application
                  </Button>
                )}
              </div>

              <div className="bg-gray-100 rounded-xl p-3 sm:p-4 shadow-lg">
                <Link to="/renewal" className="block w-full">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 text-sm sm:text-base lg:text-lg font-semibold w-full h-10 sm:h-11 lg:h-12 flex items-center justify-center whitespace-nowrap uppercase tracking-wide"
                  >
                    Renewal Application
                  </Button>
                </Link>
              </div>

              <div className="bg-gray-100 rounded-xl p-3 sm:p-4 shadow-lg">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 px-4 sm:px-5 lg:px-6 py-2.5 sm:py-3 text-sm sm:text-base lg:text-lg font-semibold w-full h-10 sm:h-11 lg:h-12 flex items-center justify-center whitespace-nowrap uppercase tracking-wide"
                >
                  Tertiary Portal
                </Button>
              </div>
            </div>



            {/* Application Process Steps */}
            <div className="mt-8 mb-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">🚀 How It Works</h3>
                <p className="text-gray-600">Your simple 6-step journey to scholarship</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-7xl mx-auto">
                {[
                  { title: "Fill Application", icon: "📝", desc: "Complete form", step: 1 },
                  { title: "Submit Docs", icon: "📂", desc: "Upload requirements", step: 2 },
                  { title: "Initial Review", icon: "🔍", desc: "Doc validation", step: 3 },
                  { title: "Interview", icon: "🗣️", desc: "Staff assessment", step: 4 },
                  { title: "Final Approval", icon: "✅", desc: "SSC Endorsement", step: 5 },
                  { title: "Receive Grant", icon: "🎉", desc: "Disbursement", step: 6 }
                ].map((item, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-md border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                    <div className="absolute top-0 right-0 p-2 opacity-10 font-bold text-5xl group-hover:scale-110 transition-transform">{item.step}</div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="text-2xl mb-2 bg-green-50 w-10 h-10 rounded-full flex items-center justify-center text-green-600 font-bold">
                        {item.step}
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm mb-1 leading-tight">{item.title}</h4>
                      <p className="text-gray-500 text-xs">{item.desc}</p>
                    </div>
                    {/* Connector line for desktop (except last item) */}
                    {index < 5 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-200 transform -translate-y-1/2 z-0"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Document Preparation Checklist */}
            <div className="mt-8 mb-8">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 sm:p-6 shadow-md border border-orange-200">
                <div className="text-center mb-4">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-1">📋 Prepare These Documents</h3>
                  <p className="text-sm text-gray-600">Get these ready before starting your application</p>
                </div>

                <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Birth Certificate (PSA)',
                    'Transcript of Records',
                    'Certificate of Enrollment',
                    'Certificate of Good Moral',
                    'Income Certificate',
                    'Barangay Certificate',
                    'Valid Government ID'
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                      <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xs font-bold">{index + 1}</span>
                      </div>
                      <p className="text-gray-800 text-sm font-medium">{doc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-600 italic">
                    💡 Have clear scans ready before you apply
                  </p>
                </div>
              </div>
            </div>

            {/* Scholarship Programs Section */}
            <div className="mt-16 mb-8">
              <div className="text-center mb-10">
                <h3 className="text-2xl lg:text-4xl font-bold text-gray-800 mb-4 drop-shadow-sm">Available Scholarship Programs</h3>
                <div className="h-1 w-24 bg-green-500 mx-auto rounded-full"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col h-full group">
                      <div className="p-1 bg-gradient-to-r from-green-500 to-green-600"></div>
                      <div className="p-6 flex-grow">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold text-gray-800 line-clamp-2 group-hover:text-green-600 transition-colors" title={category.name}>{category.name}</h4>
                          <span className={`px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase rounded-full border border-green-100`}>
                            {category.type?.replace('_', ' ') || 'SCHOLARSHIP'}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-6 line-clamp-3 h-14">
                          {category.description || 'No description available for this scholarship program.'}
                        </p>

                        {category.subcategories && category.subcategories.length > 0 && (
                          <div className="mt-auto">
                            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Available Categories</h5>
                            <div className="space-y-2">
                              {category.subcategories.slice(0, 3).map(sub => (
                                <div key={sub.id} className="flex items-center text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border border-gray-100 hover:bg-green-50 hover:border-green-100 transition-colors">
                                  <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span className="truncate">{sub.name}</span>
                                </div>
                              ))}
                              {category.subcategories.length > 3 && (
                                <p className="text-xs text-center text-gray-500 italic mt-1">
                                  +{category.subcategories.length - 3} more categories
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <Button
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transform hover:-translate-y-0.5 transition-all duration-200 font-bold tracking-wide"
                          onClick={() => {
                            if (!hasActiveApplication) {
                              navigate('/new-application');
                            } else {
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 5000);
                            }
                          }}
                        >
                          APPLY NOW
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  // Loading skeletons or empty state
                  [1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 h-96">
                      <Skeleton variant="rectangular" height="100%" />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Human Verification Modal */}
      <HumanVerification
        isOpen={showHumanVerification}
        onClose={() => setShowHumanVerification(false)}
        onVerified={() => {
          setShowHumanVerification(false);
          navigate('/new-application');
        }}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg border border-red-600 max-w-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">New Application Restricted</h4>
                <p className="text-sm mt-1">
                  You have a pending or active scholarship application. Please complete or wait for the current application to be processed before submitting a new one.
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="flex-shrink-0 text-white hover:text-red-200 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};