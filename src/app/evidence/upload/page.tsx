'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EvidenceCategory, EvidenceSeverity, UploadProgress } from '@/types/evidence';
import { EvidenceService } from '@/lib/evidence/supabase';
import { CustodyPeriod } from '@/types/evidence';
import UploadDropzone from '@/components/evidence/UploadDropzone';
import EXIFDisplay from '@/components/evidence/EXIFDisplay';
import AIAnalysisResults from '@/components/evidence/AIAnalysisResults';
import PDFGenerator from '@/components/evidence/PDFGenerator';
import { 
  ArrowLeft, 
  Upload, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Tag,
  AlertOctagon,
  Shield,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';

const categories: { value: EvidenceCategory; label: string }[] = [
  { value: 'late_pickup', label: 'Late Pickup' },
  { value: 'no_show', label: 'No Show' },
  { value: 'expense', label: 'Expense' },
  { value: 'communication', label: 'Communication' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' }
];

const severities: { value: EvidenceSeverity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

interface FileAnalysis {
  file: File;
  exif: any;
  ai: any;
  isAnalyzing: boolean;
}

export default function UploadPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileAnalyses, setFileAnalyses] = useState<Map<string, FileAnalysis>>(new Map());
  const [custodyPeriods, setCustodyPeriods] = useState<CustodyPeriod[]>([]);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  
  // Form state
  const [globalDescription, setGlobalDescription] = useState('');
  const [globalCategory, setGlobalCategory] = useState<EvidenceCategory>('other');
  const [globalSeverity, setGlobalSeverity] = useState<EvidenceSeverity>('low');
  const [globalCustodyPeriodId, setGlobalCustodyPeriodId] = useState('');
  const [verifiedByUser, setVerifiedByUser] = useState(false);

  useEffect(() => {
    loadCustodyPeriods();
  }, []);

  useEffect(() => {
    // Analyze files as they're added
    selectedFiles.forEach(file => {
      if (!fileAnalyses.has(file.name)) {
        analyzeFile(file);
      }
    });
  }, [selectedFiles]);

  const loadCustodyPeriods = async () => {
    try {
      const periods = await EvidenceService.getCustodyPeriods();
      setCustodyPeriods(periods);
    } catch (error) {
      console.error('Error loading custody periods:', error);
    }
  };

  const analyzeFile = async (file: File) => {
    // Set initial state
    setFileAnalyses(prev => new Map(prev.set(file.name, {
      file,
      exif: null,
      ai: null,
      isAnalyzing: true
    })));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/evidence/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Analysis failed');

      const { analysis } = await response.json();

      setFileAnalyses(prev => new Map(prev.set(file.name, {
        file,
        exif: analysis.exif,
        ai: analysis.ai,
        isAnalyzing: false
      })));
    } catch (error) {
      console.error('Error analyzing file:', error);
      setFileAnalyses(prev => new Map(prev.set(file.name, {
        file,
        exif: {},
        ai: {},
        isAnalyzing: false
      })));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const newUploads: UploadProgress[] = selectedFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));
    setUploads(newUploads);

    const results: UploadProgress[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const analysis = fileAnalyses.get(file.name);

      try {
        // Update status to analyzing
        setUploads(prev => prev.map((u, idx) => 
          idx === i ? { ...u, status: 'analyzing' } : u
        ));

        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', globalDescription);
        formData.append('category', globalCategory);
        formData.append('severity', globalSeverity);
        formData.append('custodyPeriodId', globalCustodyPeriodId);
        formData.append('verified', verifiedByUser.toString());

        const response = await fetch('/api/evidence/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const { evidence } = await response.json();

        results.push({
          fileName: file.name,
          progress: 100,
          status: 'completed',
          evidenceId: evidence.id
        });

        setUploads(prev => prev.map((u, idx) => 
          idx === i ? { ...u, progress: 100, status: 'completed', evidenceId: evidence.id } : u
        ));

      } catch (error) {
        results.push({
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: (error as Error).message
        });

        setUploads(prev => prev.map((u, idx) => 
          idx === i ? { ...u, status: 'error', error: (error as Error).message } : u
        ));
      }
    }

    setIsUploading(false);

    // Navigate to evidence list if all successful
    const allSuccessful = results.every(r => r.status === 'completed');
    if (allSuccessful) {
      setTimeout(() => router.push('/evidence'), 1500);
    }
  };

  const toggleFileExpanded = (fileName: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileName)) {
        next.delete(fileName);
      } else {
        next.add(fileName);
      }
      return next;
    });
  };

  const clearCompleted = () => {
    setUploads([]);
  };

  const allAnalyzed = selectedFiles.every(file => {
    const analysis = fileAnalyses.get(file.name);
    return analysis && !analysis.isAnalyzing;
  });

  const someAnalyzing = selectedFiles.some(file => {
    const analysis = fileAnalyses.get(file.name);
    return analysis?.isAnalyzing;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Link 
              href="/evidence"
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Upload Evidence</h1>
              <p className="text-slate-300 text-sm mt-1">
                Upload and analyze photos and documents
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Upload Progress */}
        {uploads.length > 0 && (
          <div className="mb-8">
            <PDFGenerator uploads={uploads} onClearCompleted={clearCompleted} />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Upload */}
          <div>
            <UploadDropzone
              onFilesSelected={setSelectedFiles}
              selectedFiles={selectedFiles}
              disabled={isUploading}
            />

            {/* File Analysis Preview */}
            {selectedFiles.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-sm font-medium text-gray-700">
                  File Analysis ({selectedFiles.length})
                </h3>
                
                {selectedFiles.map(file => {
                  const analysis = fileAnalyses.get(file.name);
                  const isExpanded = expandedFiles.has(file.name);
                  
                  return (
                    <div key={file.name} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFileExpanded(file.name)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                            {file.name}
                          </span>
                          {analysis?.isAnalyzing && (
                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      
                      {isExpanded && analysis && (
                        <div className="p-4 pt-0 space-y-4 border-t border-gray-100">
                          <EXIFDisplay 
                            exifData={analysis.exif} 
                            isLoading={analysis.isAnalyzing} 
                          />
                          <AIAnalysisResults 
                            analysis={analysis.ai} 
                            isLoading={analysis.isAnalyzing} 
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column - Form */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Evidence Details</h3>
              
              <div className="space-y-5">
                {/* Description */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4" />
                    Description
                  </label>
                  <textarea
                    value={globalDescription}
                    onChange={(e) => setGlobalDescription(e.target.value)}
                    placeholder="Describe the evidence (applies to all files)"
                    rows={3}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4" />
                    Category
                  </label>
                  <select
                    value={globalCategory}
                    onChange={(e) => setGlobalCategory(e.target.value as EvidenceCategory)}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <AlertOctagon className="w-4 h-4" />
                    Severity
                  </label>
                  <select
                    value={globalSeverity}
                    onChange={(e) => setGlobalSeverity(e.target.value as EvidenceSeverity)}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {severities.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Custody Period */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Custody Period
                  </label>
                  <select
                    value={globalCustodyPeriodId}
                    onChange={(e) => setGlobalCustodyPeriodId(e.target.value)}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option value="">None / Not specified</option>
                    {custodyPeriods.map(period => (
                      <option key={period.id} value={period.id}>
                        {new Date(period.scheduled_start).toLocaleDateString()} - {period.parent_scheduled}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Verification */}
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedByUser}
                    onChange={(e) => setVerifiedByUser(e.target.checked)}
                    disabled={isUploading}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">I verify this evidence is accurate</span>
                  </div>
                </label>

                {/* Submit Button */}
                <button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || isUploading || someAnalyzing}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading...
                    </>
                  ) : someAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>

                {!allAnalyzed && selectedFiles.length > 0 && (
                  <p className="text-xs text-amber-600 text-center">
                    Waiting for AI analysis to complete...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
