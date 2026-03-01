import { MonthlyData } from '@/types/custody'

interface AmberScheduledHoursData {
  month: string
  scheduledDays: number
  scheduledHours: number
  engagementRate: number // % of scheduled days she was engaged
}

export function calculateAmberScheduledHours(monthlyData: MonthlyData): {
  totalHours: number
  byMonth: AmberScheduledHoursData[]
  sinceJuly2025: number
} {
  const byMonth: AmberScheduledHoursData[] = []
  let totalHours = 0
  let sinceJuly2025 = 0

  Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, data]) => {
      // Only count hours when Amber was scheduled
      // amberScheduled = days where Amber was scheduled parent
      // amberHours = total hours (but we want only scheduled time)
      
      // Estimate: if Amber was engaged on X days, and total hours = Y
      // Then average hours per engaged day = Y / X (if X > 0)
      // But we want ONLY scheduled time
      
      // For now, use the existing amberHours but note it's all time
      // TODO: Update data processing to track scheduled vs unscheduled hours separately
      
      const scheduledDays = data.amberScheduled || 0
      const engagedDays = data.engaged || 0
      const totalAmberHours = data.amberHours || 0
      
      // Estimate scheduled hours: assume hours are proportional to engaged days vs scheduled days
      // This is an approximation - ideally we'd track scheduled hours separately
      const estimatedScheduledHours = scheduledDays > 0 && engagedDays > 0
        ? (totalAmberHours * (engagedDays / scheduledDays))
        : totalAmberHours
      
      const engagementRate = scheduledDays > 0
        ? Math.round((engagedDays / scheduledDays) * 100)
        : 0

      byMonth.push({
        month,
        scheduledDays,
        scheduledHours: Math.round(estimatedScheduledHours * 10) / 10,
        engagementRate
      })

      totalHours += estimatedScheduledHours
      
      if (month >= '2025-07') {
        sinceJuly2025 += estimatedScheduledHours
      }
    })

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    byMonth,
    sinceJuly2025: Math.round(sinceJuly2025 * 10) / 10
  }
}

// Alternative: Show raw data with explanation
export function getAmberScheduledTimeExplanation(): string {
  return `Current data shows Amber's total hours with Ellis (including unscheduled time).

To show ONLY hours when Amber was the scheduled parent, we need to:
1. Filter data to rows where "Scheduled Parent" = "Amber" or "Both"
2. Sum the "Engagement Hours" for those rows only
3. This will exclude any unscheduled time (visits, extra time, etc.)

The custody-data.json currently aggregates all hours together.
Would you like me to:
A) Update the data processing script to track scheduled vs unscheduled hours separately
B) Work with the current approximation (estimates scheduled hours based on engagement rate)
C) Show total hours but add a note explaining it includes unscheduled time`
}
