"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../../lib/api";

type Intervention = {
  id: number;
  id_incident: number;
  id_technicien: number;
};

type Technicien = {
  id: number;
  name: string;
  firstname: string;
  phone: string;
};

type Incident = {
  id: number;
  name: string;
};

const API_INT = `${API_URL}/interventions`;
const API_TECHNICIENS = `${API_URL}/techniciens`;
const API_INCIDENTS = `${API_URL}/incidents`;

export default function InterventionsAdmin() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const [form, setForm] = useState({
    id_incident: 0,
    id_technicien: 0,
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  // ---------------- FETCH ----------------
  const fetchAll = async () => {
    const [r, u, p] = await Promise.all([
      fetch(API_INT).then((res) => res.json()),
      fetch(API_TECHNICIENS).then((res) => res.json()),
      fetch(API_INCIDENTS).then((res) => res.json()),
    ]);

    setInterventions(r);
    setTechniciens(u);
    setIncidents(p);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ---------------- CREATE / UPDATE ----------------
  const handleSubmit = async () => {
    if (!form.id_incident || !form.id_technicien) return;

    if (editingId) {
      await fetch(`${API_INT}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch(API_INT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setForm({ id_incident: 0, id_technicien: 0 });
    setEditingId(null);
    fetchAll();
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id: number) => {
    await fetch(`${API_INT}/${id}`, { method: "DELETE" });
    fetchAll();
  };

  // ---------------- EDIT ----------------
  const handleEdit = (r: Intervention) => {
    setForm({
      id_incident: r.id_incident,
      id_technicien: r.id_technicien,
    });
    setEditingId(r.id);
  };

  // Helpers to display names instead of IDs
  const getTechnicienName = (id: number) => {
    const technicien = techniciens.find((u) => u.id === id);
    return technicien ? `${technicien.firstname} ${technicien.name}` : `Technicien #${id}`;
  };

  const getIncidentName = (id: number) => {
    const incident = incidents.find((p) => p.id === id);
    return incident ? incident.name : `Incident #${id}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Interventions</h1>

      {/* FORM */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">

        <div className="flex flex-wrap gap-3">
          {/* INCIDENT SELECT */}
          <select
            className="border p-2 rounded w-full md:w-1/3"
            value={form.id_incident}
            onChange={(e) =>
              setForm({ ...form, id_incident: Number(e.target.value) })
            }
          >
            <option value={0}>Select Incident</option>
            {incidents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* USER SELECT */}
          <select
            className="border p-2 rounded w-full md:w-1/3"
            value={form.id_technicien}
            onChange={(e) =>
              setForm({ ...form, id_technicien: Number(e.target.value) })
            }
          >
            <option value={0}>Select Technicien</option>
            {techniciens.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstname} {u.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
          >
            {editingId ? "Update" : "Add"}
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="grid gap-4">
        {interventions.map((r) => (
          <div
            key={r.id}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                {getTechnicienName(r.id_technicien)}
              </p>
              <p className="text-gray-500">
                {getIncidentName(r.id_incident)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(r)}
                className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(r.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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