'use client';

import React, { useState, useEffect } from 'react';
import { UploadProgress } from '@/types/evidence';
import { File, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';

interface PDFGeneratorProps {
  uploads: UploadProgress[];
  onClearCompleted?: () => void;
}

export default function PDFGenerator({ uploads, onClearCompleted }: PDFGeneratorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const activeUploads = uploads.filter(u => u.status === 'uploading' || u.status === 'analyzing');
  const completedUploads = uploads.filter(u => u.status === 'completed');
  const failedUploads = uploads.filter(u => u.status === 'error');

  const hasActivity = uploads.length > 0;

  if (!hasActivity) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {activeUploads.length > 0 ? (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          ) : failedUploads.length > 0 ? (
            <AlertCircle className="w-5 h-5 text-red-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              {activeUploads.length > 0 
                ? `Processing ${activeUploads.length} file${activeUploads.length !== 1 ? 's' : ''}...`
                : failedUploads.length > 0
                  ? `Completed with ${failedUploads.length} error${failedUploads.length !== 1 ? 's' : ''}`
                  : `All uploads complete (${completedUploads.length} file${completedUploads.length !== 1 ? 's' : ''})`
              }
            </h3>
            <p className="text-xs text-gray-500">
              {uploads.length} total • {completedUploads.length} successful • {failedUploads.length} failed
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {completedUploads.length > 0 && onClearCompleted && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearCompleted();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              Clear completed
            </button>
          )}
          <span className="text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {/* Upload List */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto">
          {uploads.map((upload, index) => (
            <UploadItem key={`${upload.fileName}-${index}`} upload={upload} />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadItem({ upload }: { upload: UploadProgress }) {
  const getStatusIcon = () => {
    switch (upload.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'analyzing':
        return <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />;
      case 'uploading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (upload.status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'analyzing':
        return 'bg-purple-50 border-purple-200';
      case 'uploading':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = () => {
    switch (upload.status) {
      case 'completed':
        return 'Complete';
      case 'error':
        return 'Failed';
      case 'analyzing':
        return 'Analyzing...';
      case 'uploading':
        return `${upload.progress}%`;
      default:
        return 'Pending';
    }
  };

  return (
    <div className={`
      flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0
      ${getStatusColor()}
    `}>
      {getStatusIcon()}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">
          {upload.fileName}
        </p>
        
        {upload.status === 'uploading' && (
          <div className="mt-1">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          </div>
        )}
        
        {upload.error && (
          <p className="text-xs text-red-600 mt-1">{upload.error}</p>
        )}
      </div>
      
      <span className={`
        text-xs font-medium px-2 py-1 rounded
        ${upload.status === 'completed' ? 'text-green-700 bg-green-100'
          : upload.status === 'error' ? 'text-red-700 bg-red-100'
          : upload.status === 'analyzing' ? 'text-purple-700 bg-purple-100'
          : 'text-blue-700 bg-blue-100'
        }
      `}>
        {getStatusText()}
      </span>
    </div>
  );
}
