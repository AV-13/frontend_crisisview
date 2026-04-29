"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { API_URL } from "./lib/api";

type Incident = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

// Load map only on client (VERY IMPORTANT)
const Map = dynamic(() => import("./components/Map"), {
  ssr: false,
});

export default function Home() {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/incidents`)
      .then((res) => res.json())
      .then(setIncidents);
  }, []);

  return (
    <div className="h-[90vh]">
      <h1 className="text-2xl font-bold p-4">
        Incident Map
      </h1>
      <p>Number of incidents: {incidents.length}</p>

      <Map incidents={incidents} />
    </div>
  );
}