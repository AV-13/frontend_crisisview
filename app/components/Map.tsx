"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import { API_URL } from "../lib/api";

type Incident = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

type Intervention = {
  id: number;
  id_incident: number;
  id_technicien: number;
};

// Fix default marker icons (Leaflet bug in Next)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function Map({
  incidents,
}: {
  incidents: Incident[];
}) {
  const [interventions, setInterventions] = useState<Intervention[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/interventions`)
      .then((res) => res.json())
      .then(setInterventions);
  }, []);

  const defaultCenter: [number, number] = [48.8566, 2.3522]; // Paris fallback

  const center =
    incidents.length > 0
      ? [incidents[0].latitude, incidents[0].longitude]
      : defaultCenter;

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={2}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {incidents.map((p) => {
        const technicienCount = interventions.filter(i => i.id_incident === p.id).length;

        return (
          <Marker
            key={p.id}
            position={[p.latitude, p.longitude]}
            icon={technicienCount === 0 ? redIcon : blueIcon}
          >
            <Popup>
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Technicians assigned: {technicienCount}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}