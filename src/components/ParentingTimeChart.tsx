'use client'

import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

interface MonthlyData {
  [key: string]: {
    total: number
    lauraActual: number
    amberActual: number
    bothActual: number
  }
}

interface ParentingTimeChartProps {
  data: MonthlyData
}

export default function ParentingTimeChart({ data }: ParentingTimeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const monthLabels = Object.keys(data).sort()
    const monthDisplay = monthLabels.map((k) => {
      const [y, m] = k.split('-')
      const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${names[parseInt(m)]} '${y.slice(2)}`
    })

    // Convert to percentages — derive last value to guarantee bars always sum to 100
    const lauraPct = monthLabels.map((k) => {
      const t = data[k].total
      return t > 0 ? Math.round((data[k].lauraActual / t) * 100) : 0
    })
    const bothPct = monthLabels.map((k) => {
      const t = data[k].total
      return t > 0 ? Math.round((data[k].bothActual / t) * 100) : 0
    })
    // Amber is derived so the three always sum to exactly 100
    const amberPct = monthLabels.map((k, i) => {
      const t = data[k].total
      if (t === 0) return 0
      return Math.max(0, 100 - lauraPct[i] - bothPct[i])
    })

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthDisplay,
        datasets: [
          {
            label: 'Laura (sole)',
            data: lauraPct,
            backgroundColor: '#2563eb',
            borderRadius: 0,
          },
          {
            label: 'Both present',
            data: bothPct,
            backgroundColor: '#94a3b8',
            borderRadius: 0,
          },
          {
            label: 'Amber (sole)',
            data: amberPct,
            backgroundColor: '#d97706',
            borderRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (item) => {
                const idx = item.dataIndex
                const k = monthLabels[idx]
                const pct = item.parsed.y
                const raw = item.datasetIndex === 0
                  ? data[k].lauraActual
                  : item.datasetIndex === 1
                  ? data[k].bothActual
                  : data[k].amberActual
                return `${item.dataset.label}: ${pct}% (${raw} days)`
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: { size: 11 },
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            max: 100,
            title: { display: true, text: '% of days' },
            ticks: {
              stepSize: 20,
              callback: (val) => `${val}%`,
            },
          },
        },
      },
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data])

  return <canvas ref={canvasRef} />
}
