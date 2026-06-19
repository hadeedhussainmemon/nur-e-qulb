'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2, Compass, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Fix Leaflet Default Icon Urls
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// User Marker Icon (Blue)
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Kaaba Marker Icon (Gold)
const kaabaIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const KAABA_LAT = 21.422487;
const KAABA_LNG = 39.826206;

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function QiblaMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [bearing, setBearing] = useState<number | null>(null);

  // Helper calculations
  const calculateStats = (lat: number, lng: number) => {
    // Distance (Haversine formula)
    const R = 6371; // Earth's radius in km
    const dLat = ((KAABA_LAT - lat) * Math.PI) / 180;
    const dLon = ((KAABA_LNG - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((KAABA_LAT * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setDistance(Math.round(R * c));

    // Bearing
    const dLonRad = dLon;
    const latRad = (lat * Math.PI) / 180;
    const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;
    const y = Math.sin(dLonRad) * Math.cos(kaabaLatRad);
    const x =
      Math.cos(latRad) * Math.sin(kaabaLatRad) -
      Math.sin(latRad) * Math.cos(kaabaLatRad) * Math.cos(dLonRad);
    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    setBearing(Math.round((brng + 360) % 360));
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        calculateStats(lat, lng);
        setLoading(false);
      },
      (err) => {
        setError('Please allow location access to calculate Qibla directions.');
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="h-[450px] w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-muted-foreground text-sm">Determining location and Kaaba direction...</p>
      </div>
    );
  }

  if (error || !position) {
    return (
      <div className="h-[450px] w-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-200 p-4 text-center">
        <p className="text-sm font-medium">{error || 'Unable to load map due to coordinate issues.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Board */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Distance to Makkah</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{distance?.toLocaleString()} km</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Qibla Angle</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{bearing}°</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Container */}
      <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border relative z-0">
        <MapContainer center={position} zoom={3} scrollWheelZoom={true} className="h-full w-full">
          <ChangeView center={position} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Location */}
          <Marker position={position} icon={userIcon}>
            <Popup>
              <span className="font-semibold text-xs text-blue-600">Your Location</span>
            </Popup>
          </Marker>

          {/* Kaaba Location */}
          <Marker position={[KAABA_LAT, KAABA_LNG]} icon={kaabaIcon}>
            <Popup>
              <strong className="block text-amber-700">Kaaba (Makkah)</strong>
              <span className="text-[10px] text-muted-foreground">The Sacred Mosque</span>
            </Popup>
          </Marker>

          {/* Connection Polyline */}
          <Polyline
            positions={[position, [KAABA_LAT, KAABA_LNG]]}
            color="#059669"
            dashArray="8, 12"
            weight={3.5}
          />
        </MapContainer>
      </div>
    </div>
  );
}
