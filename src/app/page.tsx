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
  const { meta, kpi, routineCareData, monthlyData, dayOfWeekData, expenses } = data

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

        {/* Engagement Quality Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-100">
            Amber&apos;s contact with EN — month-by-month breakdown{' '}
            <span className="text-sm text-gray-500 font-normal">(July 2025 onward)</span>
          </h2>
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 mb-4 text-sm">
            <strong>Key findings:</strong> &quot;Contact days&quot; includes texts and calls —
            overstating actual involvement. Hours tell the real story: July 2025 (first full month
            post-separation), Amber logged <strong>3.5 hrs — 0.47% of available time</strong>,
            despite contact flagged on 13 of 31 days. Feb 2026, the highest contact-day month (56%),
            still totaled only <strong>17.6 hrs (2.62%)</strong>. Amber had{' '}
            <strong>6 overnights total</strong> — May & Oct 2025 only;{' '}
            <strong>zero since October 2025</strong>.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-amber-100">
                  <th className="text-left p-3 font-semibold">Month</th>
                  <th className="text-center p-3 font-semibold bg-amber-50">Hours with EN</th>
                  <th className="text-center p-3 font-semibold bg-amber-50">% of Available Hours</th>
                  <th className="text-center p-3 font-semibold">Days with<br/>Any Contact</th>
                  <th className="text-center p-3 font-semibold">Total<br/>Logged Days</th>
                  <th className="text-center p-3 font-semibold">% of Days<br/>(any contact)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(engagementData).map(([key, data]) => {
                  const [y, m] = key.split('-')
                  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                  const label = `${names[parseInt(m)]} 20${y.slice(2)}`
                  const availHours = data.calDays * 24
                  const pctHours = availHours > 0 ? ((data.amberHours / availHours) * 100).toFixed(2) : '0.00'
                  const totalDays = data.engaged + data.notEngaged
                  const pctDays = totalDays > 0 ? ((data.engaged / totalDays) * 100).toFixed(1) : '0.0'
                  const isLow = parseFloat(pctHours) < 2

                  return (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="p-3 font-medium">{label}</td>
                      <td className={`p-3 text-center font-semibold ${data.amberHours > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                        {data.amberHours > 0 ? `${data.amberHours.toFixed(1)} hrs` : '—'}
                      </td>
                      <td className={`p-3 text-center font-bold ${isLow ? 'text-red-600' : 'text-green-600'}`}>
                        {pctHours}%
                      </td>
                      <td className="p-3 text-center">{data.engaged}</td>
                      <td className="p-3 text-center">{totalDays}</td>
                      <td className="p-3 text-center">{pctDays}%</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="p-3">Total (Jul 2025 – present)</td>
                  <td className="p-3 text-center bg-amber-50">
                    {Object.values(engagementData).reduce((sum, d) => sum + d.amberHours, 0).toFixed(1)} hrs
                  </td>
                  <td className="p-3 text-center bg-amber-50">
                    {(() => {
                      const totalHours = Object.values(engagementData).reduce((sum, d) => sum + d.amberHours, 0)
                      const totalAvail = Object.values(engagementData).reduce((sum, d) => sum + (d.calDays * 24), 0)
                      return totalAvail > 0 ? ((totalHours / totalAvail) * 100).toFixed(2) : '0.00'
                    })()}%
                  </td>
                  <td className="p-3 text-center">
                    {Object.values(engagementData).reduce((sum, d) => sum + d.engaged, 0)}
                  </td>
                  <td className="p-3 text-center">
                    {Object.values(engagementData).reduce((sum, d) => sum + d.engaged + d.notEngaged, 0)}
                  </td>
                  <td className="p-3 text-center">
                    {(() => {
                      const totalEngaged = Object.values(engagementData).reduce((sum, d) => sum + d.engaged, 0)
                      const totalDays = Object.values(engagementData).reduce((sum, d) => sum + d.engaged + d.notEngaged, 0)
                      return totalDays > 0 ? ((totalEngaged / totalDays) * 100).toFixed(1) : '0.0'
                    })()}%
                  </td>
                </tr>
              </tfoot>
            </table>
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

        {/* Expenses Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="bg-slate-800 text-white rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold">
              Ellis Expense Contributions | Dec 2024 – Feb 2026 | All 68 logged items
            </h2>
          </div>

          {/* Expense KPI Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${expenses.lauraTotal.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Laura&apos;s total contributions</div>
              <div className="text-xs text-gray-500">100% of all 68 logged items</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                ${expenses.amberTotal.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Amber&apos;s total contributions</div>
              <div className="text-xs text-gray-500">0% — no items paid in 14 months</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                ${expenses.total.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Unreimbursed balance owed</div>
              <div className="text-xs text-gray-500">All 68 items — none paid back</div>
            </div>
          </div>

          {/* Category Breakdown & Chart */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-3">
                By Category
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left p-2 font-semibold">Category</th>
                    <th className="text-right p-2 font-semibold">Amount</th>
                    <th className="text-right p-2 font-semibold">%</th>
                    <th className="text-center p-2 font-semibold text-red-600">Amber Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.categories.map((cat, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="p-2">{cat.name}</td>
                      <td className="p-2 text-right font-semibold">
                        ${cat.amount.toLocaleString()}
                      </td>
                      <td className="p-2 text-right">{cat.pct}%</td>
                      <td className="p-2 text-center text-red-600 font-bold">$0.00</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="p-2">TOTAL</td>
                    <td className="p-2 text-right">${expenses.total.toLocaleString()}</td>
                    <td className="p-2 text-right">100%</td>
                    <td className="p-2 text-center text-red-600">$0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-3">
                Monthly Expenses — Laura vs. Amber
              </h3>
              <div className="h-48">
                {/* Simple bar representation */}
                <div className="space-y-2">
                  {expenses.monthly.labels.slice(-6).map((label, idx) => {
                    const laura = expenses.monthly.laura[expenses.monthly.labels.indexOf(label)]
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs w-12">{label}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full"
                            style={{ width: `${Math.min((laura / 2500) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs w-16 text-right font-semibold">
                          ${laura.toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Key Findings */}
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 mb-6 text-sm">
            <strong>Key findings:</strong> Over 14 months of documented expenses, Laura has paid{' '}
            <strong>100% (${expenses.total.toLocaleString()})</strong> of all logged costs for
            Ellis — covering school programs, enrichment activities, clothing, sports equipment, and
            medical care. Amber has contributed <strong>$0.00</strong> across all 68 expense items.
            The full balance of <strong>${expenses.total.toLocaleString()}</strong> remains
            unreimbursed. The single largest category is school and educational programming at
            $10,139.50 (91.8%).
          </div>

          {/* Monthly Totals Table */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 mb-3">
              Monthly Expense Totals (Laura paid 100% of every month)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left p-2 font-semibold">Month</th>
                    <th className="text-right p-2 font-semibold text-blue-600">Laura Paid</th>
                    <th className="text-center p-2 font-semibold"># Items</th>
                    <th className="text-center p-2 font-semibold text-red-600">Amber Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.monthly.labels.map((label, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="p-2 font-medium">{label}</td>
                      <td className="p-2 text-right font-semibold text-blue-600">
                        ${expenses.monthly.laura[idx].toLocaleString()}
                      </td>
                      <td className="p-2 text-center text-gray-500">
                        {expenses.monthly.items[idx]}
                      </td>
                      <td className="p-2 text-center text-red-600 font-bold">
                        $0.00
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="p-2">Total (14 months)</td>
                    <td className="p-2 text-right text-blue-600">
                      ${expenses.total.toLocaleString()}
                    </td>
                    <td className="p-2 text-center">68</td>
                    <td className="p-2 text-center text-red-600">$0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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
