'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';

// Fix Leaflet's default icon missing issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Mosque Icon
const mosqueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// User Location Marker
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to dynamically update map view
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MosqueMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mosques, setMosques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);

        // Fetch nearby mosques using Overpass API
        const overpassQuery = `
          [out:json][timeout:25];
          (
            node["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lng});
            way["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lng});
            relation["amenity"="place_of_worship"]["religion"="muslim"](around:5000,${lat},${lng});
          );
          out center;
        `;
        
        try {
          const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: overpassQuery
          });
          const data = await res.json();
          const foundMosques = data.elements.map((el: any) => ({
            id: el.id,
            name: el.tags?.name || 'Local Mosque',
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
          })).filter((m: any) => m.lat && m.lon);

          setMosques(foundMosques);
        } catch (err) {
          setError('Failed to find nearby mosques. Please try again later.');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError('Please allow location access to find nearby mosques.');
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div className="h-[500px] w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-muted-foreground">Locating you and finding nearby mosques...</p>
      </div>
    );
  }

  if (error || !position) {
    return (
      <div className="h-[500px] w-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-200">
        <p>{error || 'Unable to load map.'}</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border relative z-0">
      <MapContainer center={position} zoom={14} scrollWheelZoom={true} className="h-full w-full">
        <ChangeView center={position} zoom={14} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User Location */}
        <Marker position={position} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Mosques */}
        {mosques.map((mosque) => (
          <Marker key={mosque.id} position={[mosque.lat, mosque.lon]} icon={mosqueIcon}>
            <Popup>
              <strong className="block text-emerald-700">{mosque.name}</strong>
              <span className="text-xs text-muted-foreground">Masjid</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
