'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Evidence, EvidenceFilters, EvidenceCategory, EvidenceSeverity } from '@/types/evidence';
import { EvidenceService } from '@/lib/evidence/supabase';
import TimelineCalendar from '@/components/evidence/TimelineCalendar';
import EvidenceCard from '@/components/evidence/EvidenceCard';
import ExportModal from '@/components/evidence/ExportModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Grid3X3, 
  List, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Calendar as CalendarIcon,
  LayoutDashboard
} from 'lucide-react';

const categories: { value: EvidenceCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'late_pickup', label: 'Late Pickup' },
  { value: 'no_show', label: 'No Show' },
  { value: 'expense', label: 'Expense' },
  { value: 'communication', label: 'Communication' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' }
];

const severities: { value: EvidenceSeverity | 'all'; label: string }[] = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

export default function EvidencePage() {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [filteredEvidence, setFilteredEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<EvidenceFilters>({
    category: 'all',
    severity: 'all',
    verifiedOnly: false
  });
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvidence();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [evidence, filters, searchQuery, selectedDate]);

  const loadEvidence = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await EvidenceService.getEvidence();
      setEvidence(data);
    } catch (err) {
      console.error('Error loading evidence:', err);
      setError('Failed to load evidence. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...evidence];

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(e => e.category === filters.category);
    }

    // Apply severity filter
    if (filters.severity && filters.severity !== 'all') {
      filtered = filtered.filter(e => e.severity === filters.severity);
    }

    // Apply verified filter
    if (filters.verifiedOnly) {
      filtered = filtered.filter(e => e.verified_by_user);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.description?.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        e.file_url.toLowerCase().includes(query)
      );
    }

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(e => {
        if (!e.date_captured) return false;
        return e.date_captured.startsWith(selectedDate);
      });
    }

    setFilteredEvidence(filtered);
  };

  const handleExport = async (options: any) => {
    const response = await fetch('/api/evidence/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidence-bundle-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const stats = {
    total: evidence.length,
    verified: evidence.filter(e => e.verified_by_user).length,
    critical: evidence.filter(e => e.severity === 'critical').length,
    high: evidence.filter(e => e.severity === 'high').length
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
                Custody Documentation
              </div>
              <h1 className="text-2xl font-bold">Evidence Portal</h1>
              <p className="text-slate-300 text-sm mt-1">
                Manage and export evidence for custody proceedings
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <Link
                href="/evidence/upload"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Evidence
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard 
            label="Total Evidence"
            value={stats.total}
            icon={<LayoutDashboard className="w-5 h-5" />}
            color="blue"
          />
          <StatCard 
            label="Verified"
            value={stats.verified}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatCard 
            label="Critical"
            value={stats.critical}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="red"
          />
          <StatCard 
            label="High Priority"
            value={stats.high}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="orange"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <TimelineCalendar 
              evidence={evidence}
              onDateSelect={setSelectedDate}
              selectedDate={selectedDate}
            />
          </div>

          {/* Evidence List */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search evidence..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(f => ({ ...f, category: e.target.value as any }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                {/* Severity Filter */}
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(f => ({ ...f, severity: e.target.value as any }))}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {severities.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                {/* View Mode Toggle */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Clear Date Filter */}
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(undefined)}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Clear date: {new Date(selectedDate).toLocaleDateString()}
                  </button>
                )}
              </div>
            </div>

            {/* Evidence Grid/List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700">{error}</p>
                <button
                  onClick={loadEvidence}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            ) : filteredEvidence.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No evidence found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || filters.category !== 'all' || filters.severity !== 'all' || selectedDate
                    ? 'Try adjusting your filters'
                    : 'Start by uploading some evidence'
                  }
                </p>
                {!searchQuery && filters.category === 'all' && filters.severity === 'all' && !selectedDate && (
                  <Link
                    href="/evidence/upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Upload Evidence
                  </Link>
                )}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 gap-4' : 'space-y-3'}>
                {filteredEvidence.map((item, index) => (
                  <EvidenceCard
                    key={item.id}
                    evidence={item}
                    exhibitNumber={String.fromCharCode(65 + index)}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
      />
    </main>
  );
}

function StatCard({ label, value, icon, color }: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600'
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs opacity-75">{label}</p>
        </div>
        <div className="opacity-50">{icon}</div>
      </div>
    </div>
  );
}
