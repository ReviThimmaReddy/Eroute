import React, { useEffect } from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { PassLocation } from '../../types';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface RouteMapUpdaterProps {
  fromLoc: PassLocation;
  toLoc: PassLocation;
}

const RouteMapBounds: React.FC<RouteMapUpdaterProps> = ({ fromLoc, toLoc }) => {
  const map = useMap();
  useEffect(() => {
    if (fromLoc && toLoc) {
      const bounds = L.latLngBounds(
        [fromLoc.latitude, fromLoc.longitude],
        [toLoc.latitude, toLoc.longitude]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [fromLoc, toLoc, map]);
  return null;
};

interface GoogleRouteMapProps {
  fromLoc: PassLocation;
  toLoc: PassLocation;
  roadDistanceKm: number;
  estimatedTimeMins: number;
  polyline: Array<[number, number]>;
  height?: string | number;
}

export const GoogleRouteMap: React.FC<GoogleRouteMapProps> = ({
  fromLoc,
  toLoc,
  roadDistanceKm,
  estimatedTimeMins,
  polyline,
  height = 360
}) => {
  const centerLat = (fromLoc.latitude + toLoc.latitude) / 2;
  const centerLng = (fromLoc.longitude + toLoc.longitude) / 2;

  const polyCoords: [number, number][] = polyline.length > 0
    ? polyline as [number, number][]
    : [[fromLoc.latitude, fromLoc.longitude], [toLoc.latitude, toLoc.longitude]];

  return (
    <Box sx={{ position: 'relative', height, width: '100%', borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)' }}>
      {/* Floating Driving Route Info Badge */}
      <Paper sx={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 1000,
        px: 2,
        py: 1,
        bgcolor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5
      }}>
        <Chip label="Actual Road Route" color="primary" size="small" sx={{ fontWeight: 800 }} />
        <Typography variant="body2" sx={{ fontWeight: 800, color: '#fff' }}>
          🛣️ {roadDistanceKm} km &nbsp;|&nbsp; ⏱️ ~{estimatedTimeMins} mins driving
        </Typography>
      </Paper>

      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RouteMapBounds fromLoc={fromLoc} toLoc={toLoc} />

        <Marker position={[fromLoc.latitude, fromLoc.longitude]} icon={startIcon}>
          <Popup>
            <strong>📍 From: {fromLoc.name}</strong><br />
            {fromLoc.address}
          </Popup>
        </Marker>

        <Marker position={[toLoc.latitude, toLoc.longitude]} icon={endIcon}>
          <Popup>
            <strong>📍 To: {toLoc.name}</strong><br />
            {toLoc.address}
          </Popup>
        </Marker>

        <Polyline
          positions={polyCoords}
          pathOptions={{ color: '#3B82F6', weight: 5, opacity: 0.85, dashArray: '8, 8' }}
        />
      </MapContainer>
    </Box>
  );
};

export default GoogleRouteMap;
