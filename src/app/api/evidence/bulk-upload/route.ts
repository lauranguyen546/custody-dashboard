import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { EvidenceService } from '@/lib/evidence/supabase';
import { analyzeEvidence } from '@/lib/evidence/google-vision';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  const results = {
    successful: [] as any[],
    failed: [] as Array<{ fileName: string; error: string }>,
    totalProcessed: 0
  };

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const defaultDescription = formData.get('description') as string;
    const defaultCategory = formData.get('category') as string;
    const defaultSeverity = formData.get('severity') as string;
    const defaultCustodyPeriodId = formData.get('custodyPeriodId') as string;
    const verified = formData.get('verified') === 'true';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024;

    // Process files sequentially to avoid overwhelming the API
    for (const file of files) {
      try {
        // Validate file
        if (!allowedTypes.includes(file.type)) {
          results.failed.push({
            fileName: file.name,
            error: 'Invalid file type'
          });
          continue;
        }

        if (file.size > maxSize) {
          results.failed.push({
            fileName: file.name,
            error: 'File too large (max 10MB)'
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `evidence/${fileName}`;

        // Upload file
        const fileUrl = await EvidenceService.uploadFile(file, filePath);

        // Analyze image if applicable
        let exifData = {};
        let aiAnalysis = {};
        let capturedDate = null;

        if (file.type.startsWith('image/')) {
          try {
            const analysis = await analyzeEvidence(file);
            exifData = analysis.exif;
            aiAnalysis = analysis.ai;
            capturedDate = analysis.exif.dateTimeOriginal || analysis.exif.dateTime || null;
          } catch (analysisError) {
            console.error(`Analysis error for ${file.name}:`, analysisError);
          }
        }

        // Create evidence record
        const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
        
        const evidence = await EvidenceService.createEvidence({
          date_captured: capturedDate,
          category: defaultCategory || (aiAnalysis as any).suggestedCategory || 'other',
          description: defaultDescription || '',
          file_url: fileUrl,
          file_type: fileType,
          exif_data: exifData,
          ai_analysis: aiAnalysis,
          custody_period_id: defaultCustodyPeriodId || null,
          severity: defaultSeverity || (aiAnalysis as any).suggestedSeverity || 'low',
          verified_by_user: verified
        });

        results.successful.push(evidence);

      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        results.failed.push({
          fileName: file.name,
          error: (error as Error).message
        });
      }
    }

    results.totalProcessed = results.successful.length + results.failed.length;

    return NextResponse.json({
      success: results.failed.length === 0,
      results
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk upload', details: (error as Error).message },
      { status: 500 }
    );
  }
}
