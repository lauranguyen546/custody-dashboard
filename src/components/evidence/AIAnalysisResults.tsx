'use client';

import React from 'react';
import { AIAnalysisResult, EvidenceCategory, EvidenceSeverity } from '@/types/evidence';
import { Brain, Eye, FileText, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';

interface AIAnalysisResultsProps {
  analysis: AIAnalysisResult;
  isLoading?: boolean;
}

export default function AIAnalysisResults({ analysis, isLoading = false }: AIAnalysisResultsProps) {
  if (isLoading) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-purple-600">
          <div className="animate-spin w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full" />
          <span className="text-sm">Analyzing with Google Vision AI...</span>
        </div>
      </div>
    );
  }

  if (!analysis || Object.keys(analysis).length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500">No AI analysis available</p>
      </div>
    );
  }

  const hasObjects = analysis.detected_objects && analysis.detected_objects.length > 0;
  const hasOcr = analysis.ocr_text && analysis.ocr_text.length > 0;
  const hasSuggestions = analysis.suggestedCategory || analysis.suggestedSeverity;

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-600" />
        <h4 className="text-sm font-semibold text-purple-900">AI Analysis Results</h4>
        {analysis.confidence_scores && (
          <span className="ml-auto text-xs text-purple-600">
            Confidence: {Math.round((analysis.confidence_scores.overall || 0) * 100)}%
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Detected Objects */}
        {hasObjects && (
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Detected Objects</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.detected_objects!.map((obj, index) => (
                <span
                  key={index}
                  className={`
                    inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                    ${getObjectConfidenceColor(obj.confidence)}
                  `}
                >
                  {obj.name}
                  <span className="opacity-75">{Math.round(obj.confidence * 100)}%</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* OCR Text */}
        {hasOcr && (
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">Detected Text (OCR)</span>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto font-mono text-xs">
              {analysis.ocr_text}
            </p>
          </div>
        )}

        {/* AI Suggestions */}
        {hasSuggestions && (
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-purple-700">AI Suggestions</span>
            </div>
            <div className="space-y-2">
              {analysis.suggestedCategory && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Category:</span>
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${getCategoryColor(analysis.suggestedCategory)}
                  `}>
                    {formatCategory(analysis.suggestedCategory)}
                  </span>
                </div>
              )}
              {analysis.suggestedSeverity && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Severity:</span>
                  <span className={`
                    inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${getSeverityColor(analysis.suggestedSeverity)}
                  `}>
                    {formatSeverity(analysis.suggestedSeverity)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analysis Notes */}
        {analysis.analysisNotes && analysis.analysisNotes.length > 0 && (
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-purple-700">Analysis Notes</span>
            </div>
            <ul className="space-y-1">
              {analysis.analysisNotes.map((note, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* No significant findings */}
        {!hasObjects && !hasOcr && (
          <p className="text-sm text-gray-500 text-center py-2">
            No significant objects or text detected in this image.
          </p>
        )}
      </div>
    </div>
  );
}

function getObjectConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-100 text-green-800';
  if (confidence >= 0.6) return 'bg-blue-100 text-blue-800';
  if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
}

function getCategoryColor(category: EvidenceCategory): string {
  const colors: Record<EvidenceCategory, string> = {
    late_pickup: 'bg-orange-100 text-orange-800',
    no_show: 'bg-red-100 text-red-800',
    expense: 'bg-green-100 text-green-800',
    communication: 'bg-blue-100 text-blue-800',
    medical: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800'
  };
  return colors[category] || colors.other;
}

function getSeverityColor(severity: EvidenceSeverity): string {
  const colors: Record<EvidenceSeverity, string> = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };
  return colors[severity];
}

function formatCategory(category: EvidenceCategory): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatSeverity(severity: EvidenceSeverity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}
