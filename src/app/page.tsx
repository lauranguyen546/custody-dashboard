import { Metadata } from 'next'
import KPISection from '@/components/KPISection'
import RoutineCareChart from '@/components/RoutineCareChart'
import ParentingTimeChart from '@/components/ParentingTimeChart'
import ForfeitedChart from '@/components/ForfeitedChart'
import DayOfWeekChart from '@/components/DayOfWeekChart'
import EngagementChart from '@/components/EngagementChart'
import data from '../../data/custody-data.json'
import { MonthlyData } from '@/types/custody'

export const metadata: Metadata = {
  title: 'Custody Stability & Parenting Patterns – EN',
  description: 'Summary of parenting time, routine care, and forfeited periods for custody documentation.',
}

export default function DashboardPage() {
  const { meta, kpi, routineCareData, monthlyData, dayOfWeekData } = data

  // Calculate engagement data (July 2025 onward)
  const engagementData: MonthlyData = Object.entries(monthlyData)
    .filter(([key]) => key >= '2025-07')
    .reduce((acc, [key, value]) => {
      acc[key] = value
      return acc
    }, {} as MonthlyData)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-slate-400 mb-2">
            Custody Documentation
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Custody Stability & Parenting Patterns – EN
          </h1>
          <p className="text-slate-300 mb-4">
            Summary of parenting time, routine care, and forfeited periods
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <span>Data range: {meta.dateRange}</span>
            <span>Total days logged: {meta.totalDays}</span>
            <span>
              Generated: {new Date(meta.generatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <KPISection metrics={kpi} dateRange={meta.dateRange} />

        {/* Chart Grid 1 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-100">
              Routine care events by parent
            </h2>
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {kpi.routineCare.lauraPct}%
                </div>
                <div className="text-xs text-gray-500">Laura</div>
              </div>
              <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {kpi.routineCare.amberPct}%
                </div>
                <div className="text-xs text-gray-500">Amber</div>
              </div>
            </div>
            <div className="h-80">
              <RoutineCareChart data={routineCareData} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-100">
              Parenting time outcomes by month
            </h2>
            <div className="h-80">
              <ParentingTimeChart data={monthlyData} />
            </div>
          </div>
        </div>

        {/* Chart Grid 2 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-100">
              Amber&apos;s forfeited parenting periods by month
            </h2>
            <div className="h-80">
              <ForfeitedChart data={monthlyData} />
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">
              Forfeited = scheduled Amber day where Laura was actual caregiver.
              Forfeited % = forfeited ÷ Amber&apos;s scheduled days that month.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-100">
              Routine care events by day of week
            </h2>
            <div className="h-80">
              <DayOfWeekChart data={dayOfWeekData} />
            </div>
          </div>
        </div>

        {/* Engagement Chart - Full Width */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-100">
            Amber&apos;s actual time with EN — share of available hours per month
          </h2>
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 mb-4 text-sm">
            <strong>Note for court:</strong> The{' '}
            <span className="text-amber-700 font-semibold">orange line</span>{' '}
            shows Amber&apos;s recorded hours with EN as a percentage of total
            available hours — the most accurate measure of parenting presence.
            The{' '}
            <span className="text-gray-500 font-semibold">grey dashed line</span>{' '}
            shows &quot;days with any contact&quot; — even a single text counts,
            significantly overstating actual involvement.
          </div>
          <div className="h-80">
            <EngagementChart data={engagementData} />
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-100">
            Stability summary – parenting periods
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-semibold text-gray-600">Parent</th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Total scheduled
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Days as actual primary
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Primary %
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Forfeited days
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Forfeited %
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Routine care events
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-600">
                    Routine care %
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-3 font-semibold text-blue-600">Laura</td>
                  <td className="p-3">
                    595{' '}
                    <span className="text-gray-400 text-xs">
                      (Both: 200 + Laura: 395)
                    </span>
                  </td>
                  <td className="p-3">{kpi.lauraPrimary.days}</td>
                  <td className="p-3 text-green-600 font-semibold">
                    {kpi.lauraPrimary.value}%
                  </td>
                  <td className="p-3">0</td>
                  <td className="p-3 text-green-600 font-semibold">0%</td>
                  <td className="p-3">2,236</td>
                  <td className="p-3 text-green-600 font-semibold">
                    {kpi.routineCare.lauraPct}%
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-amber-600">Amber</td>
                  <td className="p-3">
                    226{' '}
                    <span className="text-gray-400 text-xs">
                      (Both: 200 + Amber: 26)
                    </span>
                  </td>
                  <td className="p-3">{kpi.amberPrimary.days}</td>
                  <td className="p-3 text-red-600 font-semibold">
                    {kpi.amberPrimary.value}%
                  </td>
                  <td className="p-3">{kpi.forfeited.days}</td>
                  <td className="p-3 text-red-600 font-semibold">
                    {kpi.forfeited.value}%
                  </td>
                  <td className="p-3">46</td>
                  <td className="p-3 text-red-600 font-semibold">
                    {kpi.routineCare.amberPct}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            <strong>Both</strong> = Amber had scheduled time; Ellis returned to
            Laura each night. <strong>Actual primary</strong> = sole overnight
            caregiver. Routine care: morning, school drop-off/pick-up, homework,
            dinner, bedtime, transport.
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-200">
          Custody Stability & Parenting Patterns – EN | Data source: Co-Parent
          Custody Log | Prepared for informational purposes
        </footer>
      </div>
    </main>
  )
}
