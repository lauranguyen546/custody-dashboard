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
      return `${names[parseInt(m)]} ${y.slice(2)}`
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
            data: monthLabels.map((k) => data[k].lauraActual),
            backgroundColor: '#2563eb',
            borderRadius: 2,
          },
          {
            label: 'Both present',
            data: monthLabels.map((k) => data[k].bothActual),
            backgroundColor: '#94a3b8',
            borderRadius: 2,
          },
          {
            label: 'Amber (sole)',
            data: monthLabels.map((k) => data[k].amberActual),
            backgroundColor: '#d97706',
            borderRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { stacked: true, grid: { display: false } },
          y: {
            stacked: true,
            beginAtZero: true,
            title: { display: true, text: 'Days' },
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
