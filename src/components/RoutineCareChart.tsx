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

    // Convert to percentages — derive amber to guarantee bars always sum to 100
    const lauraData = labels.map(k => {
      const total = data[k].laura + data[k].amber
      return total > 0 ? Math.round((data[k].laura / total) * 100) : 0
    })
    const amberData = labels.map((k, i) => {
      const total = data[k].laura + data[k].amber
      return total > 0 ? Math.max(0, 100 - lauraData[i]) : 0
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
            borderRadius: 0,
          },
          {
            label: 'Amber',
            data: amberData,
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
            ticks: {
              font: { size: 11 },
              padding: 4,
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            max: 110,
            title: { display: true, text: '% of care events' },
            ticks: {
              stepSize: 20,
              callback: (val) => Number(val) > 100 ? '' : `${val}%`,
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
