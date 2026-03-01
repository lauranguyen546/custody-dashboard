-- Evidence Portal Database Schema
-- Migration: 001_create_evidence_tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create evidence category enum
CREATE TYPE evidence_category AS ENUM (
  'late_pickup',
  'no_show',
  'expense',
  'communication',
  'medical',
  'other'
);

-- Create severity enum
CREATE TYPE evidence_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Create custody_periods table
CREATE TABLE custody_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  parent_scheduled VARCHAR(50) NOT NULL, -- 'Laura', 'Amber', 'Both'
  
  notes TEXT
);

-- Create evidence table
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  date_captured TIMESTAMP WITH TIME ZONE,
  date_uploaded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Classification
  category evidence_category DEFAULT 'other',
  description TEXT,
  
  -- File storage
  file_url TEXT NOT NULL,
  file_type VARCHAR(10) CHECK (file_type IN ('image', 'pdf')),
  
  -- EXIF and AI analysis data
  exif_data JSONB DEFAULT '{}'::jsonb,
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- Relationships
  custody_period_id UUID REFERENCES custody_periods(id) ON DELETE SET NULL,
  
  -- Severity and verification
  severity evidence_severity DEFAULT 'low',
  verified_by_user BOOLEAN DEFAULT FALSE,
  
  -- User tracking
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX idx_evidence_category ON evidence(category);
CREATE INDEX idx_evidence_severity ON evidence(severity);
CREATE INDEX idx_evidence_date_captured ON evidence(date_captured);
CREATE INDEX idx_evidence_custody_period ON evidence(custody_period_id);
CREATE INDEX idx_evidence_uploaded_by ON evidence(uploaded_by);

-- Create GIN indexes for JSONB columns (for efficient querying)
CREATE INDEX idx_evidence_exif_data ON evidence USING GIN (exif_data);
CREATE INDEX idx_evidence_ai_analysis ON evidence USING GIN (ai_analysis);

-- Create index on custody_periods for date range queries
CREATE INDEX idx_custody_periods_dates ON custody_periods(scheduled_start, scheduled_end);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_evidence_updated_at
  BEFORE UPDATE ON evidence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custody_periods_updated_at
  BEFORE UPDATE ON custody_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_periods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to view evidence"
  ON evidence FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert evidence"
  ON evidence FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their own evidence"
  ON evidence FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Allow authenticated users to delete their own evidence"
  ON evidence FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Allow authenticated users to view custody periods"
  ON custody_periods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage custody periods"
  ON custody_periods FOR ALL
  TO authenticated
  USING (true);

-- Create storage bucket for evidence files (run this in Supabase dashboard or via API)
-- Note: This is a reference for bucket configuration
/*
Storage bucket: evidence-files
Public: false
Allowed mime types: image/jpeg, image/png, image/jpg, application/pdf
File size limit: 10MB
*/
