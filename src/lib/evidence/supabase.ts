import { createClient } from '@supabase/supabase-js';
import { Evidence, EvidenceFilters, CustodyPeriod } from '@/types/evidence';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export class EvidenceService {
  static async getEvidence(filters?: EvidenceFilters): Promise<Evidence[]> {
    let query = supabase
      .from('evidence')
      .select(`
        *,
        custody_period:custody_periods(*)
      `)
      .order('date_captured', { ascending: false });

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.severity && filters.severity !== 'all') {
      query = query.eq('severity', filters.severity);
    }

    if (filters?.startDate) {
      query = query.gte('date_captured', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date_captured', filters.endDate);
    }

    if (filters?.verifiedOnly) {
      query = query.eq('verified_by_user', true);
    }

    if (filters?.searchQuery) {
      query = query.ilike('description', `%${filters.searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching evidence:', error);
      throw error;
    }

    return data || [];
  }

  static async getEvidenceById(id: string): Promise<Evidence | null> {
    const { data, error } = await supabase
      .from('evidence')
      .select(`
        *,
        custody_period:custody_periods(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching evidence:', error);
      return null;
    }

    return data;
  }

  static async createEvidence(evidence: Partial<Evidence>): Promise<Evidence> {
    const { data, error } = await supabase
      .from('evidence')
      .insert(evidence)
      .select()
      .single();

    if (error) {
      console.error('Error creating evidence:', error);
      throw error;
    }

    return data;
  }

  static async updateEvidence(id: string, updates: Partial<Evidence>): Promise<Evidence> {
    const { data, error } = await supabase
      .from('evidence')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating evidence:', error);
      throw error;
    }

    return data;
  }

  static async deleteEvidence(id: string): Promise<void> {
    const { error } = await supabase
      .from('evidence')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting evidence:', error);
      throw error;
    }
  }

  static async getCustodyPeriods(): Promise<CustodyPeriod[]> {
    const { data, error } = await supabase
      .from('custody_periods')
      .select('*')
      .order('scheduled_start', { ascending: false });

    if (error) {
      console.error('Error fetching custody periods:', error);
      throw error;
    }

    return data || [];
  }

  static async getCustodyPeriodByDate(date: string): Promise<CustodyPeriod | null> {
    const { data, error } = await supabase
      .from('custody_periods')
      .select('*')
      .lte('scheduled_start', date)
      .gte('scheduled_end', date)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  static async uploadFile(file: File, path: string): Promise<string> {
    const { error } = await supabase
      .storage
      .from('evidence-files')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('evidence-files')
      .getPublicUrl(path);

    return publicUrl;
  }

  static async deleteFile(path: string): Promise<void> {
    const { error } = await supabase
      .storage
      .from('evidence-files')
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  static subscribeToEvidence(callback: (payload: any) => void) {
    return supabase
      .channel('evidence_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evidence' }, callback)
      .subscribe();
  }
}
