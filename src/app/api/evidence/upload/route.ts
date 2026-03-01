import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { EvidenceService } from '@/lib/evidence/supabase';
import { analyzeEvidence } from '@/lib/evidence/google-vision';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const severity = formData.get('severity') as string;
    const custodyPeriodId = formData.get('custodyPeriodId') as string;
    const verified = formData.get('verified') === 'true';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and PDF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `evidence/${fileName}`;

    // Upload file to Supabase Storage
    const fileUrl = await EvidenceService.uploadFile(file, filePath);

    // Analyze image if it's an image file
    let exifData = {};
    let aiAnalysis = {};
    let capturedDate = null;

    if (file.type.startsWith('image/')) {
      try {
        const analysis = await analyzeEvidence(file);
        exifData = analysis.exif;
        aiAnalysis = analysis.ai;
        
        // Use EXIF date if available
        capturedDate = analysis.exif.dateTimeOriginal || analysis.exif.dateTime || null;
      } catch (analysisError) {
        console.error('Analysis error:', analysisError);
        // Continue without analysis data
      }
    }

    // Create evidence record
    const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
    
    const evidence = await EvidenceService.createEvidence({
      date_captured: capturedDate,
      category: category || (aiAnalysis as any).suggestedCategory || 'other',
      description: description || '',
      file_url: fileUrl,
      file_type: fileType,
      exif_data: exifData,
      ai_analysis: aiAnalysis,
      custody_period_id: custodyPeriodId || null,
      severity: severity || (aiAnalysis as any).suggestedSeverity || 'low',
      verified_by_user: verified
    });

    return NextResponse.json({
      success: true,
      evidence
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload evidence', details: (error as Error).message },
      { status: 500 }
    );
  }
}
