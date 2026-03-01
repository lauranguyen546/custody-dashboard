import { ExifData, AIAnalysisResult, EvidenceCategory, EvidenceSeverity } from '@/types/evidence';
import ExifReader from 'exifreader';

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const GOOGLE_VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

export interface AnalysisResult {
  exif: ExifData;
  ai: AIAnalysisResult;
}

export async function extractExifData(file: File): Promise<ExifData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = await ExifReader.load(arrayBuffer);
    
    const exif: ExifData = {};
    
    if (tags['DateTime']) {
      exif.dateTime = parseExifDate(tags['DateTime'].description);
    }
    
    if (tags['DateTimeOriginal']) {
      exif.dateTimeOriginal = parseExifDate(tags['DateTimeOriginal'].description);
    }
    
    if (tags['GPSLatitude'] && tags['GPSLongitude']) {
      exif.gpsLatitude = convertToDecimal(
        tags['GPSLatitude'].value as any[],
        tags['GPSLatitudeRef']?.description
      );
      exif.gpsLongitude = convertToDecimal(
        tags['GPSLongitude'].value as any[],
        tags['GPSLongitudeRef']?.description
      );
    }
    
    if (tags['GPSAltitude']) {
      exif.gpsAltitude = parseFloat(tags['GPSAltitude'].description);
    }
    
    if (tags['Make']) {
      exif.make = tags['Make'].description;
    }
    
    if (tags['Model']) {
      exif.model = tags['Model'].description;
    }
    
    if (tags['Orientation']) {
      exif.orientation = tags['Orientation'].value;
    }
    
    return exif;
  } catch (error) {
    console.error('Error extracting EXIF:', error);
    return {};
  }
}

function parseExifDate(dateStr: string): string {
  // EXIF date format: "2024:01:15 14:30:00"
  const cleaned = dateStr.replace(/:/g, '-').replace(' ', 'T');
  return new Date(cleaned).toISOString();
}

function convertToDecimal(coordinates: any[], ref?: string): number {
  const degrees = coordinates[0].numerator / coordinates[0].denominator;
  const minutes = coordinates[1].numerator / coordinates[1].denominator;
  const seconds = coordinates[2].numerator / coordinates[2].denominator;
  
  let decimal = degrees + minutes / 60 + seconds / 3600;
  
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }
  
  return decimal;
}

export async function analyzeImageWithVision(file: File): Promise<AIAnalysisResult> {
  if (!GOOGLE_VISION_API_KEY) {
    throw new Error('Google Vision API key not configured');
  }

  try {
    const base64Image = await fileToBase64(file);
    
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image.split(',')[1]
          },
          features: [
            { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
            { type: 'TEXT_DETECTION', maxResults: 50 },
            { type: 'LABEL_DETECTION', maxResults: 20 }
          ]
        }
      ]
    };

    const response = await fetch(`${GOOGLE_VISION_URL}?key=${GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.statusText}`);
    }

    const data = await response.json();
    return processVisionResults(data.responses[0]);
  } catch (error) {
    console.error('Error analyzing image:', error);
    return {
      detected_objects: [],
      ocr_text: '',
      confidence_scores: {
        objectDetection: 0,
        ocr: 0,
        overall: 0
      }
    };
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function processVisionResults(response: any): AIAnalysisResult {
  const result: AIAnalysisResult = {
    detected_objects: [],
    ocr_text: '',
    confidence_scores: {
      objectDetection: 0,
      ocr: 0,
      overall: 0
    }
  };

  // Process object detection
  if (response.localizedObjectAnnotations) {
    result.detected_objects = response.localizedObjectAnnotations.map((obj: any) => ({
      name: obj.name.toLowerCase(),
      confidence: obj.score,
      boundingBox: obj.boundingPoly?.normalizedVertices?.[0] || undefined
    }));
    
    result.confidence_scores!.objectDetection = 
      (result.detected_objects && result.detected_objects.length > 0)
        ? result.detected_objects.reduce((sum, obj) => sum + obj.confidence, 0) / result.detected_objects.length
        : 0;
  }

  // Process OCR
  if (response.textAnnotations && response.textAnnotations.length > 0) {
    result.ocr_text = response.textAnnotations[0].description;
    result.confidence_scores!.ocr = response.textAnnotations[0].confidence || 0.8;
  }

  // Calculate overall confidence
  result.confidence_scores!.overall = 
    (result.confidence_scores!.objectDetection + result.confidence_scores!.ocr) / 2;

  // Generate suggestions based on analysis
  const suggestions = generateSuggestions(result);
  result.suggestedCategory = suggestions.category;
  result.suggestedSeverity = suggestions.severity;
  result.analysisNotes = suggestions.notes;

  return result;
}

function generateSuggestions(analysis: AIAnalysisResult): {
  category: EvidenceCategory;
  severity: EvidenceSeverity;
  notes: string[];
} {
  const notes: string[] = [];
  const objects = analysis.detected_objects?.map(o => o.name) || [];
  const text = analysis.ocr_text?.toLowerCase() || '';
  
  // Check for timestamp in OCR text
  const timestampPattern = /\d{1,2}:\d{2}/;
  const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
  
  if (timestampPattern.test(text)) {
    notes.push('Timestamp detected in image');
  }
  if (datePattern.test(text)) {
    notes.push('Date detected in image');
  }

  // Object-based categorization
  if (objects.includes('car') || objects.includes('vehicle') || objects.includes('automobile')) {
    notes.push('Vehicle detected in image');
    
    if (text.includes('late') || text.includes('delayed')) {
      return { 
        category: 'late_pickup', 
        severity: 'medium',
        notes: [...notes, 'Possible late pickup scenario']
      };
    }
  }

  if (objects.includes('person') || objects.includes('people')) {
    notes.push('Person detected in image');
  }

  if (objects.includes('garage') || objects.includes('door') || text.includes('garage')) {
    notes.push('Garage/door area detected');
  }

  // Text-based categorization
  if (text.includes('medical') || text.includes('doctor') || text.includes('hospital')) {
    return { 
      category: 'medical', 
      severity: 'high',
      notes: [...notes, 'Medical-related content detected']
    };
  }

  if (text.includes('expense') || text.includes('receipt') || text.includes('$') || text.includes('payment')) {
    return { 
      category: 'expense', 
      severity: 'medium',
      notes: [...notes, 'Financial content detected']
    };
  }

  if (text.includes('message') || text.includes('text') || text.includes('call')) {
    return { 
      category: 'communication', 
      severity: 'low',
      notes: [...notes, 'Communication content detected']
    };
  }

  // Default categorization based on time/context
  if (objects.includes('car') && !objects.includes('person')) {
    return { 
      category: 'no_show', 
      severity: 'high',
      notes: [...notes, 'Vehicle present but no person detected - possible no-show']
    };
  }

  return { 
    category: 'other', 
    severity: 'low',
    notes: [...notes, 'General documentation']
  };
}

export async function analyzeEvidence(file: File): Promise<AnalysisResult> {
  const [exif, ai] = await Promise.all([
    extractExifData(file),
    analyzeImageWithVision(file)
  ]);

  return { exif, ai };
}
