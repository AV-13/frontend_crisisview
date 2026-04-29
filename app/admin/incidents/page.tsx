"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../../lib/api";

type Incident = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

const API = `${API_URL}/incidents`;

export default function IncidentAdmin() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [form, setForm] = useState({ name: "", latitude: 0, longitude: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchIncidents = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setIncidents(data);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSubmit = async () => {
    if (editingId) {
      await fetch(`${API}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setForm({ name: "", latitude: 0, longitude: 0 });
    setEditingId(null);
    fetchIncidents();
  };

  const handleDelete = async (id: number) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchIncidents();
  };

  const handleEdit = (p: Incident) => {
    setForm({ name: p.name, latitude: p.latitude, longitude: p.longitude });
    setEditingId(p.id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Incidents</h1>

      {/* FORM */}
      <div className="bg-white p-4 rounded shadow mb-6 flex gap-2">

        <input
          className="border p-2 rounded w-full"
          placeholder="Name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          className="border p-2 rounded w-32"
          type="number"
          step="any"
          placeholder="Latitude"
          value={form.latitude}
          onChange={(e) =>
            setForm({ ...form, latitude: Number(e.target.value) })
          }
        />

        <input
          className="border p-2 rounded w-32"
          type="number"
          step="any"
          placeholder="Longitude"
          value={form.longitude}
          onChange={(e) =>
            setForm({ ...form, longitude: Number(e.target.value) })
          }
        />

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 rounded"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </div>

      {/* LIST */}
      <div className="grid gap-4">
        {incidents.map((p) => (
          <div
            key={p.id}
            className="bg-white p-4 rounded shadow flex justify-between"
          >
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-gray-500">
                {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(p)}
                className="bg-yellow-400 px-3 rounded"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(p.id)}
                className="bg-red-500 text-white px-3 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}