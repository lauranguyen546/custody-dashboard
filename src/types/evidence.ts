export type EvidenceCategory = 
  | 'late_pickup' 
  | 'no_show' 
  | 'expense' 
  | 'communication' 
  | 'medical' 
  | 'other';

export type EvidenceSeverity = 'low' | 'medium' | 'high' | 'critical';
export type FileType = 'image' | 'pdf';

export interface ExifData {
  dateTime?: string;
  dateTimeOriginal?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  make?: string;
  model?: string;
  orientation?: number;
  [key: string]: any;
}

export interface AIAnalysisResult {
  detected_objects?: Array<{
    name: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  ocr_text?: string;
  confidence_scores?: {
    objectDetection: number;
    ocr: number;
    overall: number;
  };
  suggestedCategory?: EvidenceCategory;
  suggestedSeverity?: EvidenceSeverity;
  analysisNotes?: string[];
}

export interface Evidence {
  id: string;
  created_at: string;
  updated_at: string;
  date_captured: string | null;
  date_uploaded: string;
  category: EvidenceCategory;
  description: string | null;
  file_url: string;
  file_type: FileType;
  exif_data: ExifData;
  ai_analysis: AIAnalysisResult;
  custody_period_id: string | null;
  severity: EvidenceSeverity;
  verified_by_user: boolean;
  uploaded_by: string | null;
  
  // Joined data
  custody_period?: CustodyPeriod;
}

export interface CustodyPeriod {
  id: string;
  created_at: string;
  updated_at: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  parent_scheduled: string;
  notes: string | null;
}

export interface EvidenceFilters {
  category?: EvidenceCategory | 'all';
  severity?: EvidenceSeverity | 'all';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  verifiedOnly?: boolean;
}

export interface EvidenceExportOptions {
  startDate: string;
  endDate: string;
  categories: EvidenceCategory[];
  severities: EvidenceSeverity[];
  includeUnverified: boolean;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  error?: string;
  evidenceId?: string;
}

export interface BatchUploadResult {
  successful: Evidence[];
  failed: Array<{ fileName: string; error: string }>;
  totalProcessed: number;
}
