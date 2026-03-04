'use client'

import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

interface EngagementData {
  [key: string]: {
    amberHours: number
    calDays: number
    total: number
    amberScheduled?: number
    forfeited?: number
  }
}

interface EngagementChartProps {
  data: EngagementData
}

export default function EngagementChart({ data }: EngagementChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const engMonths = Object.keys(data).filter((k) => k >= '2025-07')
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const engDisplay = engMonths.map((k) => {
      const [y, m] = k.split('-')
      return `${monthNames[parseInt(m)]} '${y.slice(2)}`
    })

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: engDisplay,
        datasets: [
          {
            label: '% of available hours (actual time with EN)',
            data: engMonths.map((k) => {
              const d = data[k]
              const avail = d.calDays * 24
              return avail > 0 ? parseFloat(((d.amberHours / avail) * 100).toFixed(2)) : 0
            }),
            borderColor: '#d97706',
            backgroundColor: 'rgba(217,119,6,0.12)',
            fill: true,
            borderWidth: 2.5,
            pointRadius: 6,
            pointBackgroundColor: '#d97706',
            pointHoverRadius: 8,
            tension: 0.3,
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
                const k = engMonths[items[0]?.dataIndex]
                if (!k) return []
                const d = data[k]
                return [`Total hours with EN: ${d.amberHours} hrs`]
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: '% of month' },
            ticks: { callback: (v) => v + '%' },
          },
        },
      },
      plugins: [
        {
          id: 'hoursLabels',
          afterDatasetsDraw: (chart) => {
            const ctx = chart.ctx
            ctx.save()
            const ds = chart.data.datasets[0]
            const meta = chart.getDatasetMeta(0)
            ctx.textAlign = 'center'
            meta.data.forEach((point, i) => {
              const val = ds.data[i] as number
              if (val <= 0) return
              const text = val + '%'
              ctx.font = 'bold 11px Inter, sans-serif'
              const w = ctx.measureText(text).width + 10
              ctx.fillStyle = 'rgba(255,255,255,0.93)'
              ctx.beginPath()
              ctx.roundRect(point.x - w / 2, point.y - 24, w, 17, 4)
              ctx.fill()
              ctx.fillStyle = '#b45309'
              ctx.fillText(text, point.x, point.y - 11)
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
