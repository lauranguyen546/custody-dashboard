'use client';

import React from 'react';
import { ExifData } from '@/types/evidence';
import { Camera, MapPin, Calendar, Clock, Smartphone } from 'lucide-react';

interface EXIFDisplayProps {
  exifData: ExifData;
  isLoading?: boolean;
}

export default function EXIFDisplay({ exifData, isLoading = false }: EXIFDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
          <span className="text-sm">Extracting EXIF data...</span>
        </div>
      </div>
    );
  }

  if (!exifData || Object.keys(exifData).length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500">No EXIF data available</p>
      </div>
    );
  }

  const hasDate = exifData.dateTime || exifData.dateTimeOriginal;
  const hasLocation = exifData.gpsLatitude && exifData.gpsLongitude;
  const hasDevice = exifData.make || exifData.model;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
        <Camera className="w-4 h-4" />
        EXIF Data
      </h4>
      
      <div className="space-y-3">
        {/* Date Information */}
        {hasDate && (
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-700 font-medium">Capture Date</p>
              <p className="text-sm text-blue-900">
                {exifData.dateTimeOriginal 
                  ? formatDate(exifData.dateTimeOriginal)
                  : exifData.dateTime 
                    ? formatDate(exifData.dateTime)
                    : 'Unknown'
                }
              </p>
            </div>
          </div>
        )}

        {/* Location Information */}
        {hasLocation && (
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-700 font-medium">GPS Location</p>
              <p className="text-sm text-blue-900 font-mono">
                {exifData.gpsLatitude?.toFixed(6)}, {exifData.gpsLongitude?.toFixed(6)}
              </p>
              {exifData.gpsAltitude && (
                <p className="text-xs text-blue-600">
                  Altitude: {exifData.gpsAltitude.toFixed(1)}m
                </p>
              )}
            </div>
          </div>
        )}

        {/* Device Information */}
        {hasDevice && (
          <div className="flex items-start gap-3">
            <Smartphone className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-blue-700 font-medium">Device</p>
              <p className="text-sm text-blue-900">
                {exifData.make} {exifData.model}
              </p>
              {exifData.orientation && (
                <p className="text-xs text-blue-600">
                  Orientation: {getOrientationLabel(exifData.orientation)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Raw Data Toggle */}
        <details className="mt-3">
          <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
            View raw EXIF data
          </summary>
          <pre className="mt-2 p-2 bg-white rounded text-xs text-gray-700 overflow-x-auto">
            {JSON.stringify(exifData, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

function getOrientationLabel(orientation: number): string {
  const orientations: Record<number, string> = {
    1: 'Normal',
    2: 'Flipped horizontally',
    3: 'Rotated 180°',
    4: 'Flipped vertically',
    5: 'Rotated 90° CW, flipped',
    6: 'Rotated 90° CW',
    7: 'Rotated 90° CCW, flipped',
    8: 'Rotated 90° CCW'
  };
  return orientations[orientation] || `Unknown (${orientation})`;
}
