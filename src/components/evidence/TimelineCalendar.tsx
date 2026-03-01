'use client';

import React, { useState, useEffect } from 'react';
import { Evidence } from '@/types/evidence';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Maximize2 } from 'lucide-react';

interface TimelineCalendarProps {
  evidence: Evidence[];
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
}

interface DayData {
  date: string;
  count: number;
  evidence: Evidence[];
}

export default function TimelineCalendar({ 
  evidence, 
  onDateSelect,
  selectedDate 
}: TimelineCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Map<string, DayData>>(new Map());

  useEffect(() => {
    // Build calendar data from evidence
    const data = new Map<string, DayData>();
    
    evidence.forEach(item => {
      if (item.date_captured) {
        const date = new Date(item.date_captured).toISOString().split('T')[0];
        const existing = data.get(date);
        if (existing) {
          existing.count++;
          existing.evidence.push(item);
        } else {
          data.set(date, { date, count: 1, evidence: [item] });
        }
      }
    });
    
    setCalendarData(data);
  }, [evidence]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    return { daysInMonth, startingDay };
  };

  const getHeatmapColor = (count: number): string => {
    if (count === 0) return 'bg-gray-50';
    if (count === 1) return 'bg-blue-100';
    if (count === 2) return 'bg-blue-200';
    if (count === 3) return 'bg-blue-300';
    if (count === 4) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const getHeatmapTextColor = (count: number): string => {
    if (count === 0) return 'text-gray-400';
    if (count <= 2) return 'text-blue-800';
    return 'text-white';
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days: Array<{ day: number; dateStr: string; count: number }> = [];
  
  // Previous month padding
  for (let i = 0; i < startingDay; i++) {
    days.push({ day: 0, dateStr: '', count: 0 });
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split('T')[0];
    const dayData = calendarData.get(dateStr);
    days.push({ day, dateStr, count: dayData?.count || 0 });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-800">Evidence Timeline</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
            {monthName}
          </span>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToToday}
            className="ml-2 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {days.map((dayData, index) => (
          <div
            key={index}
            className={`
              aspect-square flex flex-col items-center justify-center rounded-lg text-sm
              transition-all duration-200 cursor-pointer
              ${dayData.day === 0 
                ? 'invisible' 
                : `${getHeatmapColor(dayData.count)} ${getHeatmapTextColor(dayData.count)} hover:ring-2 hover:ring-blue-400`
              }
              ${selectedDate === dayData.dateStr ? 'ring-2 ring-blue-600' : ''}
            `}
            onClick={() => dayData.day > 0 && onDateSelect?.(dayData.dateStr)}
          >
            {dayData.day > 0 && (
              <>
                <span className="font-medium">{dayData.day}</span>
                {dayData.count > 0 && (
                  <span className="text-[10px] opacity-75">{dayData.count}</span>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-600">
        <span>Incident density:</span>
        <div className="flex items-center gap-1">
          <span>0</span>
          <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
          <div className="w-4 h-4 bg-blue-100 rounded"></div>
          <div className="w-4 h-4 bg-blue-200 rounded"></div>
          <div className="w-4 h-4 bg-blue-300 rounded"></div>
          <div className="w-4 h-4 bg-blue-400 rounded"></div>
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>5+</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{evidence.length}</p>
            <p className="text-xs text-gray-500">Total Evidence</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {new Set(evidence.map(e => e.date_captured?.split('T')[0]).filter(Boolean)).size}
            </p>
            <p className="text-xs text-gray-500">Days with Evidence</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {calendarData.size > 0 
                ? Math.max(...Array.from(calendarData.values()).map(d => d.count))
                : 0
              }
            </p>
            <p className="text-xs text-gray-500">Peak Daily Count</p>
          </div>
        </div>
      </div>
    </div>
  );
}
