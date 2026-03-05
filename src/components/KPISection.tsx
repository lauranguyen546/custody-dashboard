interface KPIMetrics {
  lauraPrimary: { value: number; days: number; totalDays: number }
  amberPrimary: { value: number; days: number; totalDays: number }
  forfeited: { value: number; days: number; scheduledDays: number }
  amberHours: { total: number; equivalentDays: number }
  routineCare: { lauraPct: number; amberPct: number }
}

interface KPISectionProps {
  metrics: KPIMetrics
  dateRange: string
  avgUtilization?: number
}

export default function KPISection({ metrics, dateRange, avgUtilization }: KPISectionProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
        <div className="text-3xl font-bold text-blue-600">
          {metrics.lauraPrimary.value}%
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
          Days Laura as primary
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {metrics.lauraPrimary.days} of {metrics.lauraPrimary.totalDays} logged days
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
        <div className="text-3xl font-bold text-amber-600">
          {metrics.amberPrimary.value}%
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
          Days Amber as primary
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {metrics.amberPrimary.days} of {metrics.amberPrimary.totalDays} logged days
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
        <div className="text-3xl font-bold text-red-600">
          {metrics.forfeited.value}%
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
          Amber forfeited parenting time
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {metrics.forfeited.days} of {metrics.forfeited.scheduledDays} scheduled days
        </div>
      </div>

      <div className="bg-white border border-red-200 rounded-xl p-4 text-center shadow-sm">
        <div className="text-3xl font-bold text-red-600">
          {avgUtilization !== undefined ? `${avgUtilization.toFixed(0)}%` : `${metrics.amberHours.equivalentDays}d`}
        </div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
          Avg. parenting time used
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {avgUtilization !== undefined
            ? 'of scheduled hrs, Sept 2025–present'
            : `${metrics.amberHours.total.toFixed(1)} hrs over ${dateRange}`}
        </div>
      </div>
    </div>
  )
}
