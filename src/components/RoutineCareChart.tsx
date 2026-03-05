'use client'

import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

interface RoutineCareData {
  [key: string]: { laura: number; amber: number }
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

    // Convert to percentages
    const lauraData = labels.map(k => {
      const total = data[k].laura + data[k].amber
      return total > 0 ? Math.round((data[k].laura / total) * 100) : 0
    })
    const amberData = labels.map(k => {
      const total = data[k].laura + data[k].amber
      return total > 0 ? Math.round((data[k].amber / total) * 100) : 0
    })

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
              label: (item) => {
                const label = item.dataset.label ?? ''
                const pct = item.parsed.y
                const category = item.label
                const total = data[category].laura + data[category].amber
                const raw = item.datasetIndex === 0 ? data[category].laura : data[category].amber
                return `${label}: ${pct}% (${raw} of ${total} events)`
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            max: 100,
            title: { display: true, text: '% of care events' },
            ticks: {
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
