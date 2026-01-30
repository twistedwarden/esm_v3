import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Star,
  CheckCircle,
  AlertCircle,
  User,
  GraduationCap,
  PhilippinePeso,
  Heart,
  FileText
} from 'lucide-react';
import { scholarshipApiService } from '../../../../services/scholarshipApiService';
import { useToastContext } from '../../../../components/providers/ToastProvider';

function InterviewEvaluationModal({ isOpen, onClose, interview, onEvaluationSubmitted }) {
  const { success, error } = useToastContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationData, setEvaluationData] = useState({
    academic_motivation_score: '',
    leadership_involvement_score: '',
    financial_need_score: '',
    character_values_score: '',
    overall_recommendation: '',
    remarks: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setEvaluationData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!evaluationData.academic_motivation_score || evaluationData.academic_motivation_score < 1 || evaluationData.academic_motivation_score > 5) {
      newErrors.academic_motivation_score = 'Please enter a score between 1 and 5';
    }

    if (!evaluationData.leadership_involvement_score || evaluationData.leadership_involvement_score < 1 || evaluationData.leadership_involvement_score > 5) {
      newErrors.leadership_involvement_score = 'Please enter a score between 1 and 5';
    }

    if (!evaluationData.financial_need_score || evaluationData.financial_need_score < 1 || evaluationData.financial_need_score > 5) {
      newErrors.financial_need_score = 'Please enter a score between 1 and 5';
    }

    if (!evaluationData.character_values_score || evaluationData.character_values_score < 1 || evaluationData.character_values_score > 5) {
      newErrors.character_values_score = 'Please enter a score between 1 and 5';
    }

    if (!evaluationData.overall_recommendation) {
      newErrors.overall_recommendation = 'Please select an overall recommendation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      await scholarshipApiService.submitInterviewEvaluation(interview.id, {
        academic_motivation_score: parseInt(evaluationData.academic_motivation_score),
        leadership_involvement_score: parseInt(evaluationData.leadership_involvement_score),
        financial_need_score: parseInt(evaluationData.financial_need_score),
        character_values_score: parseInt(evaluationData.character_values_score),
        overall_recommendation: evaluationData.overall_recommendation,
        remarks: evaluationData.remarks
      });

      success('Interview evaluation submitted successfully!');
      onEvaluationSubmitted();
      onClose();

    } catch (err) {
      console.error('Error submitting evaluation:', err);
      error(err.message || 'Failed to submit evaluation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderScoreInput = (field, label, icon, description) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <div className="flex items-center space-x-2">
          {icon}
          <span>{label}</span>
        </div>
      </label>
      <div className="flex items-center space-x-4">
        <input
          type="number"
          min="1"
          max="5"
          value={evaluationData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`w-20 px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors[field] ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
            }`}
          placeholder="1-5"
        />
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => handleInputChange(field, score)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${evaluationData[field] >= score
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500'
                }`}
            >
              <Star className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {errors[field] && (
        <p className="text-xs text-red-500">{errors[field]}</p>
      )}
    </div>
  );

  // Show modal when open and interview is available
  if (!isOpen || !interview) {
    return null;
  }

  const student = interview.application?.student;
  const application = interview.application;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Interview Evaluation
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Information */}
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4 border border-gray-200 dark:border-slate-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Student Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {student?.first_name} {student?.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Application Number:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {application?.application_number}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Scholarship Category:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {application?.category?.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Interview Date:</span>
                  <span className="ml-2 text-gray-900 dark:text-white font-medium">
                    {new Date(interview.interview_date).toLocaleDateString()} at {interview.interview_time}
                  </span>
                </div>
              </div>
            </div>

            {/* Evaluation Form */}
            <div className="space-y-6">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Evaluation Criteria
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderScoreInput(
                  'academic_motivation_score',
                  'Academic Motivation',
                  <GraduationCap className="w-4 h-4" />,
                  'Student\'s enthusiasm and commitment to academic excellence'
                )}

                {renderScoreInput(
                  'leadership_involvement_score',
                  'Leadership & Involvement',
                  <Star className="w-4 h-4" />,
                  'Participation in school activities and leadership roles'
                )}

                {renderScoreInput(
                  'financial_need_score',
                  'Financial Need',
                  <PhilippinePeso className="w-4 h-4" />,
                  'Genuine financial need and family circumstances'
                )}

                {renderScoreInput(
                  'character_values_score',
                  'Character & Values',
                  <Heart className="w-4 h-4" />,
                  'Integrity, responsibility, and moral character'
                )}
              </div>

              {/* Overall Recommendation */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overall Recommendation
                </label>
                <select
                  value={evaluationData.overall_recommendation}
                  onChange={(e) => handleInputChange('overall_recommendation', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${errors.overall_recommendation ? 'border-red-500' : 'border-gray-300 dark:border-slate-600'
                    }`}
                >
                  <option value="">Select recommendation</option>
                  <option value="recommended">Recommended</option>
                  <option value="needs_followup">For Consideration</option>
                  <option value="not_recommended">Not Recommended</option>
                </select>
                {errors.overall_recommendation && (
                  <p className="text-xs text-red-500">{errors.overall_recommendation}</p>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Additional Remarks
                </label>
                <textarea
                  value={evaluationData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  rows={4}
                  placeholder="Add any additional comments or observations about the interview..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center space-x-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Submit Evaluation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default InterviewEvaluationModal;
