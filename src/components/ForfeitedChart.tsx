'use client'

import { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'

interface MonthlyData {
  [key: string]: {
    forfeited: number
    amberScheduled: number
    total: number
  }
}

interface ForfeitedChartProps {
  data: MonthlyData
}

export default function ForfeitedChart({ data }: ForfeitedChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const forfeitMonths = Object.keys(data).filter(
      (k) => data[k].amberScheduled > 0
    )
    const monthDisplay = forfeitMonths.map((k) => {
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
            label: 'Forfeited days',
            data: forfeitMonths.map((k) => data[k].forfeited),
            backgroundColor: '#dc2626',
            borderRadius: 4,
            order: 2,
          },
          {
            label: 'Amber scheduled days',
            data: forfeitMonths.map((k) => data[k].amberScheduled),
            type: 'line',
            borderColor: '#6b7280',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: '#6b7280',
            tension: 0.3,
            order: 1,
          },
          {
            label: 'Forfeited %',
            data: forfeitMonths.map((k) => {
              const d = data[k]
              return d.amberScheduled > 0
                ? parseFloat(((d.forfeited / d.amberScheduled) * 100).toFixed(0))
                : 0
            }),
            type: 'line',
            borderColor: '#7c3aed',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 3],
            pointRadius: 5,
            pointBackgroundColor: '#7c3aed',
            tension: 0.3,
            yAxisID: 'y1',
            order: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Days' },
          },
          y1: {
            position: 'right',
            beginAtZero: true,
            max: 100,
            title: { display: true, text: 'Forfeited %' },
            grid: { drawOnChartArea: false },
            ticks: { callback: (v) => v + '%' },
          },
        },
      },
      plugins: [
        {
          id: 'forfeitPctLabels',
          afterDatasetsDraw: (chart) => {
            const ds = chart.data.datasets[2]
            const meta = chart.getDatasetMeta(2)
            const ctx = chart.ctx
            ctx.save()
            ctx.textAlign = 'center'
            meta.data.forEach((point, i) => {
              const text = ds.data[i] + '%'
              ctx.font = 'bold 12px Inter, sans-serif'
              const w = ctx.measureText(text).width + 8
              ctx.fillStyle = 'rgba(255,255,255,0.9)'
              ctx.beginPath()
              ctx.roundRect(point.x - w / 2, point.y - 22, w, 18, 4)
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
