"use client";

import { useEffect, useState } from "react";
import { API_URL } from "../../lib/api";

type Technicien = {
  id: number;
  name: string;
  firstname: string;
  email: string;
  phone: string;
};

const API = `${API_URL}/techniciens`;

export default function TechniciensAdmin() {
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [form, setForm] = useState({
    name: "",
    firstname: "",
    email: "",
    phone: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // ---------------- FETCH ----------------
  const fetchTechniciens = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setTechniciens(data);
  };

  useEffect(() => {
    fetchTechniciens();
  }, []);

  // ---------------- CREATE / UPDATE ----------------
  const handleSubmit = async () => {
    if (!form.name || !form.firstname || !form.email || !form.phone) return;

    if (editingId) {
      // UPDATE
      await fetch(`${API}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      // CREATE
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setForm({ name: "", firstname: "", email: "", phone: "" });
    setEditingId(null);
    fetchTechniciens();
  };

  // ---------------- DELETE ----------------
  const handleDelete = async (id: number) => {
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchTechniciens();
  };

  // ---------------- EDIT ----------------
  const handleEdit = (technicien: Technicien) => {
    setForm({
      name: technicien.name,
      firstname: technicien.firstname,
      email: technicien.email,
      phone: technicien.phone,
    });
    setEditingId(technicien.id);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Technicians</h1>

      {/* FORM */}
      <div className="bg-white p-4 rounded-xl shadow mb-6">

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Name"
            className="border p-2 rounded w-full md:w-1/4"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Firstname"
            className="border p-2 rounded w-full md:w-1/4"
            value={form.firstname}
            onChange={(e) =>
              setForm({ ...form, firstname: e.target.value })
            }
          />

          <input
            type="email"
            placeholder="Email"
            className="border p-2 rounded w-full md:w-1/3"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Phone"
            className="border p-2 rounded w-full md:w-1/4"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

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
        {techniciens.map((technicien) => (
          <div
            key={technicien.id}
            className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                {technicien.firstname} {technicien.name}
              </p>
              <p className="text-gray-500">{technicien.email}</p>
              <p className="text-gray-500">{technicien.phone}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(technicien)}
                className="bg-yellow-400 px-3 py-1 rounded hover:bg-yellow-500"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(technicien.id)}
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