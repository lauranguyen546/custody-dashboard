'use client';

import React from 'react';
import { Evidence, EvidenceCategory, EvidenceSeverity } from '@/types/evidence';
import { Calendar, Tag, AlertTriangle, CheckCircle, FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface EvidenceCardProps {
  evidence: Evidence;
  exhibitNumber?: string;
  onClick?: () => void;
  compact?: boolean;
}

export default function EvidenceCard({ 
  evidence, 
  exhibitNumber,
  onClick,
  compact = false 
}: EvidenceCardProps) {
  const isImage = evidence.file_type === 'image';
  
  const formattedDate = evidence.date_captured 
    ? new Date(evidence.date_captured).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Unknown date';

  const categoryLabel = evidence.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
      >
        <div className={`
          w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${isImage ? 'bg-blue-50' : 'bg-red-50'}
        `}>
          {isImage ? (
            <ImageIcon className="w-5 h-5 text-blue-500" />
          ) : (
            <FileText className="w-5 h-5 text-red-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {evidence.description || 'Untitled evidence'}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{formattedDate}</span>
            <span>•</span>
            <CategoryBadge category={evidence.category} size="sm" />
          </div>
        </div>
        
        <SeverityIndicator severity={evidence.severity} size="sm" />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Preview Area */}
      <div className="relative aspect-video bg-gray-100 flex items-center justify-center group">
        {isImage ? (
          <>
            <img 
              src={evidence.file_url} 
              alt={evidence.description || 'Evidence'}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ExternalLink className="w-8 h-8 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <FileText className="w-12 h-12" />
            <span className="text-sm">PDF Document</span>
          </div>
        )}
        
        {/* Exhibit Badge */}
        {exhibitNumber && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
            {exhibitNumber}
          </div>
        )}
        
        {/* Verified Badge */}
        {evidence.verified_by_user && (
          <div className="absolute top-3 right-3 bg-green-500 text-white p-1 rounded-full">
            <CheckCircle className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Category & Severity */}
        <div className="flex items-center justify-between mb-2">
          <CategoryBadge category={evidence.category} />
          <SeverityIndicator severity={evidence.severity} />
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
          {evidence.description || 'No description provided'}
        </p>
        
        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
          
          {evidence.ai_analysis?.detected_objects && evidence.ai_analysis.detected_objects.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              <span>{evidence.ai_analysis.detected_objects.length} objects</span>
            </div>
          )}
        </div>
        
        {/* AI Analysis Preview */}
        {evidence.ai_analysis?.suggestedCategory && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              AI suggested: <span className="font-medium text-purple-600">
                {evidence.ai_analysis.suggestedCategory.replace(/_/g, ' ')}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryBadge({ category, size = 'md' }: { category: EvidenceCategory; size?: 'sm' | 'md' }) {
  const colors: Record<EvidenceCategory, string> = {
    late_pickup: 'bg-orange-100 text-orange-800 border-orange-200',
    no_show: 'bg-red-100 text-red-800 border-red-200',
    expense: 'bg-green-100 text-green-800 border-green-200',
    communication: 'bg-blue-100 text-blue-800 border-blue-200',
    medical: 'bg-purple-100 text-purple-800 border-purple-200',
    other: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const label = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-1.5 py-0.5' 
    : 'text-xs px-2.5 py-1';

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border
      ${colors[category]}
      ${sizeClasses}
    `}>
      {label}
    </span>
  );
}

function SeverityIndicator({ severity, size = 'md' }: { severity: EvidenceSeverity; size?: 'sm' | 'md' }) {
  const colors: Record<EvidenceSeverity, { bg: string; icon: string }> = {
    low: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    medium: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
    high: { bg: 'bg-orange-100', icon: 'text-orange-600' },
    critical: { bg: 'bg-red-100', icon: 'text-red-600' }
  };

  const sizeClasses = size === 'sm'
    ? 'w-6 h-6'
    : 'w-8 h-8';

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div 
      className={`
        ${colors[severity].bg} ${sizeClasses} 
        rounded-full flex items-center justify-center
      `}
      title={`Severity: ${severity}`}
    >
      <AlertTriangle className={`${colors[severity].icon} ${iconSize}`} />
    </div>
  );
}
