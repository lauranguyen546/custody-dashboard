import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { EvidenceService } from '@/lib/evidence/supabase';
import { EvidenceExportOptions } from '@/types/evidence';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';


export async function POST(request: NextRequest) {
  try {
    const options: EvidenceExportOptions = await request.json();

    // Fetch evidence based on filters
    const evidence = await EvidenceService.getEvidence({
      category: options.categories.length === 1 ? options.categories[0] : 'all',
      startDate: options.startDate,
      endDate: options.endDate,
    });

    // Filter by categories and severities
    const filteredEvidence = evidence.filter(e => {
      const categoryMatch = options.categories.length === 0 || options.categories.includes(e.category);
      const severityMatch = options.severities.length === 0 || options.severities.includes(e.severity);
      const verifiedMatch = options.includeUnverified || e.verified_by_user;
      return categoryMatch && severityMatch && verifiedMatch;
    });

    if (filteredEvidence.length === 0) {
      return NextResponse.json(
        { error: 'No evidence found matching the specified criteria' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generatePDFBundle(filteredEvidence, options);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="evidence-bundle-${new Date().toISOString().split('T')[0]}.pdf"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF bundle', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function generatePDFBundle(evidence: any[], options: EvidenceExportOptions): Promise<Buffer> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Cover Page
  generateCoverPage(doc, evidence, options);
  
  // Table of Contents
  doc.addPage();
  generateTableOfContents(doc, evidence);
  
  // Evidence Items
  for (let i = 0; i < evidence.length; i++) {
    doc.addPage();
    generateEvidencePage(doc, evidence[i], i + 1, pageWidth, pageHeight);
  }
  
  // Convert to buffer
  const pdfArrayBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfArrayBuffer);
}

function generateCoverPage(doc: jsPDF, evidence: any[], options: EvidenceExportOptions) {
  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2;
  
  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Evidence Bundle', centerX, 60, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Custody Documentation', centerX, 80, { align: 'center' });
  
  // Date range
  doc.setFontSize(12);
  doc.text(
    `Date Range: ${new Date(options.startDate).toLocaleDateString()} - ${new Date(options.endDate).toLocaleDateString()}`,
    centerX,
    110,
    { align: 'center' }
  );
  
  // Summary Stats
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', centerX, 140, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  const stats = [
    `Total Exhibits: ${evidence.length}`,
    `Date Range: ${options.startDate} to ${options.endDate}`,
    `Categories: ${options.categories.join(', ') || 'All'}`,
    `Generated: ${new Date().toLocaleDateString()}`
  ];
  
  let yPos = 160;
  stats.forEach(stat => {
    doc.text(stat, centerX, yPos, { align: 'center' });
    yPos += 10;
  });
  
  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  evidence.forEach(e => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });
  
  doc.setFont('helvetica', 'bold');
  doc.text('Breakdown by Category', centerX, 210, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  yPos = 230;
  Object.entries(categoryCounts).forEach(([category, count]) => {
    const formattedCategory = category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    doc.text(`${formattedCategory}: ${count}`, centerX, yPos, { align: 'center' });
    yPos += 10;
  });
}

function generateTableOfContents(doc: jsPDF, evidence: any[]) {
  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2;
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Table of Contents', centerX, 40, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 60;
  const lineHeight = 8;
  
  evidence.forEach((item, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 40;
    }
    
    const exhibitLabel = `Exhibit ${String.fromCharCode(65 + index)}`; // A, B, C...
    const date = item.date_captured 
      ? new Date(item.date_captured).toLocaleDateString()
      : 'Unknown date';
    const category = item.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    
    doc.text(`${exhibitLabel}: ${category} - ${date}`, 30, yPos);
    doc.text(`${index + 3}`, pageWidth - 30, yPos, { align: 'right' }); // Page number
    
    yPos += lineHeight;
  });
}

function generateEvidencePage(doc: jsPDF, evidence: any, exhibitNumber: number, pageWidth: number, pageHeight: number) {
  // Exhibit Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Exhibit ${String.fromCharCode(64 + exhibitNumber)}`, 20, 30);
  
  // Metadata section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 50;
  const labelX = 20;
  const valueX = 80;
  
  // Category
  doc.setFont('helvetica', 'bold');
  doc.text('Category:', labelX, yPos);
  doc.setFont('helvetica', 'normal');
  const category = evidence.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  doc.text(category, valueX, yPos);
  yPos += 10;
  
  // Severity
  doc.setFont('helvetica', 'bold');
  doc.text('Severity:', labelX, yPos);
  doc.setFont('helvetica', 'normal');
  const severity = evidence.severity.replace(/\b\w/g, (l: string) => l.toUpperCase());
  doc.text(severity, valueX, yPos);
  yPos += 10;
  
  // Date Captured
  doc.setFont('helvetica', 'bold');
  doc.text('Date Captured:', labelX, yPos);
  doc.setFont('helvetica', 'normal');
  const dateCaptured = evidence.date_captured 
    ? new Date(evidence.date_captured).toLocaleString()
    : 'Not available';
  doc.text(dateCaptured, valueX, yPos);
  yPos += 10;
  
  // Date Uploaded
  doc.setFont('helvetica', 'bold');
  doc.text('Date Uploaded:', labelX, yPos);
  doc.setFont('helvetica', 'normal');
  const dateUploaded = new Date(evidence.date_uploaded).toLocaleString();
  doc.text(dateUploaded, valueX, yPos);
  yPos += 10;
  
  // Verified status
  doc.setFont('helvetica', 'bold');
  doc.text('Verified:', labelX, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(evidence.verified_by_user ? 'Yes' : 'No', valueX, yPos);
  yPos += 15;
  
  // Description
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', labelX, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  
  if (evidence.description) {
    const splitDescription = doc.splitTextToSize(evidence.description, pageWidth - 40);
    doc.text(splitDescription, labelX, yPos);
    yPos += splitDescription.length * 6 + 10;
  } else {
    doc.text('No description provided', labelX, yPos);
    yPos += 15;
  }
  
  // AI Analysis section (if available)
  if (evidence.ai_analysis && Object.keys(evidence.ai_analysis).length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('AI Analysis:', labelX, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    
    const ai = evidence.ai_analysis;
    
    if (ai.detected_objects && ai.detected_objects.length > 0) {
      const objects = ai.detected_objects.map((o: any) => `${o.name} (${Math.round(o.confidence * 100)}%)`).join(', ');
      const splitObjects = doc.splitTextToSize(`Detected: ${objects}`, pageWidth - 40);
      doc.text(splitObjects, labelX, yPos);
      yPos += splitObjects.length * 6 + 5;
    }
    
    if (ai.ocr_text) {
      const splitOcr = doc.splitTextToSize(`OCR Text: ${ai.ocr_text.substring(0, 200)}...`, pageWidth - 40);
      doc.text(splitOcr, labelX, yPos);
      yPos += splitOcr.length * 6 + 5;
    }
    
    yPos += 10;
  }
  
  // Placeholder for image (in a real implementation, you'd fetch and embed the image)
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(245, 245, 245);
  const imgY = Math.max(yPos, 120);
  const imgHeight = pageHeight - imgY - 30;
  doc.rect(20, imgY, pageWidth - 40, imgHeight, 'FD');
  
  doc.setFontSize(12);
  doc.setTextColor(150, 150, 150);
  doc.text('[Image: ' + evidence.file_url + ']', pageWidth / 2, imgY + imgHeight / 2, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`File: ${evidence.file_url}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}
