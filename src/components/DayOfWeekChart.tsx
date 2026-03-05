'use client'

import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

interface DayOfWeekData {
  [key: string]: { Laura: number; Amber: number }
}

interface DayOfWeekChartProps {
  data: DayOfWeekData
}

export default function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const dowOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dowOrder.map((d) => d.slice(0, 3)),
        datasets: [
          {
            label: 'Laura',
            data: dowOrder.map((d) => data[d].laura),
            backgroundColor: '#2563eb',
            borderRadius: 4,
          },
          {
            label: 'Amber',
            data: dowOrder.map((d) => data[d].amber),
            backgroundColor: '#d97706',
            borderRadius: 4,
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
