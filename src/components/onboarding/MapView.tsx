import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import type { Coordinates } from '../../types/onboarding';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Custom black pin icon
const blackPinIcon = L.divIcon({
  className: 'custom-pin',
  html: `<svg width="22" height="30" viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 28 16 28s16-16 16-28c0-8.836-7.164-16-16-16z" fill="#1a1a1a"/>
    <circle cx="16" cy="16" r="6" fill="#fff"/>
  </svg>`,
  iconSize: [22, 30],
  iconAnchor: [11, 30],
});

interface MapViewProps {
  center: Coordinates;
  markerPosition: Coordinates | null;
  onMapClick: (coordinates: Coordinates) => void;
  zoom?: number;
}

function normalizeLongitude(lng: number): number {
  while (lng > 180) lng -= 360;
  while (lng < -180) lng += 360;
  return lng;
}

function MapClickHandler({ onMapClick }: { onMapClick: (coordinates: Coordinates) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick({
        lat: e.latlng.lat,
        lng: normalizeLongitude(e.latlng.lng),
      });
    },
  });
  return null;
}

function MapCenterUpdater({ center, zoom }: { center: Coordinates; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom ?? map.getZoom(), { duration: 0.5 });
  }, [center, zoom, map]);

  return null;
}

function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [map]);

  return null;
}

export default function MapView({ center, markerPosition, onMapClick, zoom }: MapViewProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="address-map-container"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />
      <MapCenterUpdater center={center} zoom={zoom} />
      <MapResizeHandler />
      {markerPosition && (
        <Marker position={[markerPosition.lat, markerPosition.lng]} icon={blackPinIcon} />
      )}
    </MapContainer>
  );
}
