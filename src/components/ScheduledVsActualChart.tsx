'use client'

import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

interface MonthlyData {
  [key: string]: {
    amberHours: number
    amberScheduledHours: number
    calDays: number
  }
}

interface ScheduledVsActualChartProps {
  data: MonthlyData
}

export default function ScheduledVsActualChart({ data }: ScheduledVsActualChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const months = Object.keys(data)
      .filter((k) => k >= '2025-07' && data[k].amberScheduledHours > 0)
      .sort()

    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const labels = months.map((k) => {
      const [y, m] = k.split('-')
      return `${monthNames[parseInt(m)]} '${y.slice(2)}`
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
            label: 'Scheduled hours (court order)',
            data: months.map((k) => data[k].amberScheduledHours),
            backgroundColor: 'rgba(148,163,184,0.35)',
            borderColor: '#94a3b8',
            borderWidth: 1.5,
            borderRadius: 4,
            order: 2,
          },
          {
            label: 'Actual hours with Ellis',
            data: months.map((k) => data[k].amberHours),
            backgroundColor: 'rgba(217,119,6,0.75)',
            borderColor: '#d97706',
            borderWidth: 1.5,
            borderRadius: 4,
            order: 2,
          },
          {
            label: '% of scheduled time used',
            data: months.map((k) => {
              const d = data[k]
              return d.amberScheduledHours > 0
                ? parseFloat(((d.amberHours / d.amberScheduledHours) * 100).toFixed(1))
                : 0
            }),
            type: 'line',
            borderColor: '#7c3aed',
            backgroundColor: 'transparent',
            fill: false,
            borderWidth: 2,
            borderDash: [5, 4],
            pointRadius: 5,
            pointBackgroundColor: '#7c3aed',
            pointHoverRadius: 7,
            tension: 0.3,
            yAxisID: 'y1',
            order: 1,
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
                const k = months[items[0]?.dataIndex]
                if (!k) return []
                const d = data[k]
                const pct = d.amberScheduledHours > 0
                  ? ((d.amberHours / d.amberScheduledHours) * 100).toFixed(1)
                  : '0.0'
                return [
                  `Unused: ${(d.amberScheduledHours - d.amberHours).toFixed(1)} hrs`,
                  `Utilization: ${pct}%`,
                ]
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Hours' },
            grid: { color: 'rgba(0,0,0,0.06)' },
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            max: 100,
            title: { display: true, text: '% used' },
            grid: { drawOnChartArea: false },
            ticks: { callback: (v) => v + '%' },
          },
        },
      },
      plugins: [
        {
          id: 'pctLabels',
          afterDatasetsDraw: (chart) => {
            const ds = chart.data.datasets[2]
            const meta = chart.getDatasetMeta(2)
            const ctx = chart.ctx
            ctx.save()
            ctx.textAlign = 'center'
            meta.data.forEach((point, i) => {
              const val = ds.data[i] as number
              if (val <= 0) return
              const text = val + '%'
              ctx.font = 'bold 11px Inter, sans-serif'
              const w = ctx.measureText(text).width + 8
              ctx.fillStyle = 'rgba(255,255,255,0.92)'
              ctx.beginPath()
              ctx.roundRect(point.x - w / 2, point.y - 22, w, 17, 4)
              ctx.fill()
              ctx.fillStyle = '#7c3aed'
              ctx.fillText(text, point.x, point.y - 8)
            })
            ctx.restore()
          },
        },
      ],
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data])

  return <canvas ref={canvasRef} />
}
