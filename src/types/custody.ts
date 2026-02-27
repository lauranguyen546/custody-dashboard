export interface RoutineCareData {
  [key: string]: { Laura: number; Amber: number }
}

export interface MonthlyData {
  [key: string]: {
    total: number
    lauraActual: number
    amberActual: number
    bothActual: number
    forfeited: number
    amberScheduled: number
    engaged: number
    notEngaged: number
    amberHours: number
    calDays: number
  }
}

export interface DayOfWeekData {
  [key: string]: { Laura: number; Amber: number }
}

export interface ExpenseData {
  labels: string[]
  laura: number[]
  amber: number[]
}

export interface KPIMetrics {
  lauraPrimary: { value: number; days: number; totalDays: number }
  amberPrimary: { value: number; days: number; totalDays: number }
  forfeited: { value: number; days: number; scheduledDays: number }
  amberHours: { total: number; equivalentDays: number }
  routineCare: { lauraPct: number; amberPct: number }
}

export interface CustodyData {
  meta: {
    dateRange: string
    totalDays: number
    generatedAt: string
  }
  kpi: KPIMetrics & {
    scheduled?: { laura: number; amber: number; both: number }
  }
  routineCareData: RoutineCareData
  monthlyData: MonthlyData
  dayOfWeekData: DayOfWeekData
  expenses: ExpenseData
}
