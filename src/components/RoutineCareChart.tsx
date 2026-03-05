'use client'

import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

interface RoutineCareData {
  [key: string]: { Laura: number; Amber: number }
}

interface RoutineCareChartProps {
  data: RoutineCareData
}

export default function RoutineCareChart({ data }: RoutineCareChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Filter to only items with significant data (>5 events)
    const labels = Object.keys(data).filter(
      k => data[k].laura + data[k].amber > 5
    )

    const lauraData = labels.map(k => data[k].laura)
    const amberData = labels.map(k => data[k].amber)

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Laura',
            data: lauraData,
            backgroundColor: '#2563eb',
            borderRadius: 4,
          },
          {
            label: 'Amber',
            data: amberData,
            backgroundColor: '#d97706',
            borderRadius: 4,
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
              afterBody: (items) => {
                const label = items[0].label
                const d = data[label]
                const total = d.laura + d.amber
                if (total === 0) return ''
                const item = items[0]
                if (!item || !item.parsed || typeof item.parsed.y !== 'number') return ''
                const pct = ((item.parsed.y / total) * 100).toFixed(1)
                return `${pct}% of care events`
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Care events' },
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
