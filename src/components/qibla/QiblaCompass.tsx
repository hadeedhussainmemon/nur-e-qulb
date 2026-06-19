'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Compass as CompassIcon, MapPin, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Kaaba Coordinates
const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

export function QiblaCompass() {
  const [heading, setHeading] = useState<number>(0);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);

  // Helper to calculate bearing
  const calculateQibla = (lat: number, lng: number) => {
    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;
    const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;
    const kaabaLngRad = (KAABA_LNG * Math.PI) / 180;

    const y = Math.sin(kaabaLngRad - lngRad);
    const x = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(kaabaLngRad - lngRad);
    
    let qibla = (Math.atan2(y, x) * 180) / Math.PI;
    qibla = (qibla + 360) % 360;
    setQiblaAngle(qibla);
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    let compassHeading = event.alpha;
    
    // Check for iOS webkitCompassHeading
    if ((event as any).webkitCompassHeading) {
      compassHeading = (event as any).webkitCompassHeading;
    } else if (compassHeading !== null) {
      // Convert standard alpha (which is based on the device's rotation relative to the Earth's frame)
      // Usually, alpha is 0 when pointing top to the Earth's North Pole (if absolute is true)
      // For general web, standard alpha goes counter-clockwise. We want clockwise heading.
      compassHeading = 360 - compassHeading;
    }

    if (compassHeading !== null) {
      setHeading(compassHeading);
    }
  };

  const startCompass = async () => {
    setError(null);
    setIsCalibrating(true);

    // 1. Get Location
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsCalibrating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        calculateQibla(position.coords.latitude, position.coords.longitude);
        
        // 2. Setup Device Orientation
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          // iOS 13+ devices require explicit permission
          setNeedsPermission(true);
          setIsCalibrating(false);
        } else {
          // Non-iOS devices
          window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
          // Fallback if absolute is not supported
          window.addEventListener('deviceorientation', handleOrientation as any, true);
          setIsCalibrating(false);
        }
      },
      (err) => {
        setError("Please allow location access to find the Qibla.");
        setIsCalibrating(false);
      }
    );
  };

  const requestIOSPermission = async () => {
    try {
      const permissionState = await (DeviceOrientationEvent as any).requestPermission();
      if (permissionState === 'granted') {
        window.addEventListener('deviceorientation', handleOrientation, true);
        setNeedsPermission(false);
      } else {
        setError("Permission to access device orientation was denied.");
      }
    } catch (err) {
      setError("Failed to request orientation permission.");
    }
  };

  useEffect(() => {
    // Cleanup listeners
    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true);
      window.removeEventListener('deviceorientation', handleOrientation as any, true);
    };
  }, []);

  // Calculate rotation difference
  const compassRotation = -heading;
  const kaabaMarkerRotation = qiblaAngle !== null ? qiblaAngle : 0;
  
  const isFacingQibla = qiblaAngle !== null && (Math.abs((heading - qiblaAngle + 360) % 360) < 5 || Math.abs((heading - qiblaAngle - 360) % 360) < 5);

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 overflow-hidden relative">
      <CardContent className="p-8 md:p-16 flex flex-col items-center justify-center min-h-[500px]">
        
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {qiblaAngle === null && !needsPermission && !error ? (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <MapPin className="w-12 h-12 text-emerald-600 dark:text-emerald-500" />
            </div>
            <p className="text-lg text-muted-foreground max-w-sm mx-auto">
              We need access to your location and device compass to point you toward Makkah.
            </p>
            <Button onClick={startCompass} size="lg" className="bg-emerald-600 hover:bg-emerald-700" disabled={isCalibrating}>
              {isCalibrating ? "Locating..." : "Start Qibla Finder"}
            </Button>
          </div>
        ) : needsPermission ? (
          <div className="text-center space-y-6">
            <Button onClick={requestIOSPermission} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              Grant Compass Access
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center relative w-full">
            {/* The Compass Dial */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
              {/* Outer Ring */}
              <div 
                className="absolute inset-0 border-[16px] border-slate-200 dark:border-slate-800 rounded-full shadow-inner transition-transform duration-100 ease-linear"
                style={{ transform: `rotate(${compassRotation}deg)` }}
              >
                {/* North Marker */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">N</div>
                {/* South Marker */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-slate-400 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">S</div>
              </div>

              {/* Kaaba Direction Indicator (Relative to North, so it rotates with the dial) */}
              <div 
                className="absolute inset-0 transition-transform duration-100 ease-linear pointer-events-none"
                style={{ transform: `rotate(${compassRotation + kaabaMarkerRotation}deg)` }}
              >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1 h-1/2 bg-gradient-to-b from-emerald-500 to-transparent flex justify-center origin-bottom">
                  {/* The Kaaba Icon/Marker */}
                  <div className={`w-8 h-8 rounded-sm absolute -top-4 shadow-lg flex items-center justify-center transition-all ${isFacingQibla ? 'bg-emerald-500 scale-125' : 'bg-emerald-800 scale-100'}`}>
                    <div className="w-6 h-4 border-t-4 border-yellow-500 opacity-80" /> {/* Mini Kaaba styling */}
                  </div>
                </div>
              </div>

              {/* Center Pivot */}
              <div className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center z-10 transition-colors ${isFacingQibla ? 'bg-emerald-500' : 'bg-slate-800 dark:bg-slate-700'}`}>
                <div className="w-4 h-4 bg-white rounded-full opacity-50" />
              </div>
            </div>

            <div className="mt-12 text-center">
              <h3 className={`text-3xl font-bold tracking-tight transition-colors ${isFacingQibla ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                {isFacingQibla ? "You are facing the Qibla" : `${Math.round(heading)}°`}
              </h3>
              <p className="text-muted-foreground mt-2">
                Qibla is at {Math.round(qiblaAngle || 0)}° from North
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
