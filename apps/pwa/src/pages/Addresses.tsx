import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';

interface Address {
  id: string;
  label: string;
  fullAddress: string;
  city: string;
  isDefault: boolean;
}

export function Addresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get<Address[]>('/addresses')
      .then(setAddresses)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      label: String(form.get('label')),
      fullAddress: String(form.get('fullAddress')),
      city: String(form.get('city')),
      isDefault: form.get('isDefault') === 'on',
    };
    try {
      if (editing) {
        await api.patch(`/addresses/${editing.id}`, payload);
      } else {
        await api.post('/addresses', payload);
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    }
  }

  async function handleDelete(id: string) {
    await api.delete(`/addresses/${id}`);
    load();
  }

  async function handleSetDefault(id: string) {
    await api.patch(`/addresses/${id}/default`);
    load();
  }

  function startEdit(address: Address) {
    setEditing(address);
    setShowForm(true);
  }

  function startCreate() {
    setEditing(null);
    setShowForm(true);
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/account" className="text-slate-400">←</Link>
        <h1 className="text-xl font-bold">Mes adresses</h1>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-xl2 bg-base-800 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {a.label}
                    {a.isDefault && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                        Par défaut
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">{a.fullAddress}</p>
                  <p className="text-sm text-slate-400">{a.city}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-3 text-xs">
                {!a.isDefault && (
                  <button onClick={() => handleSetDefault(a.id)} className="text-emerald-400 underline">
                    Définir par défaut
                  </button>
                )}
                <button onClick={() => startEdit(a)} className="text-slate-400 underline">
                  Modifier
                </button>
                <button onClick={() => handleDelete(a.id)} className="text-red-400 underline">
                  Supprimer
                </button>
              </div>
            </li>
          ))}
          {addresses.length === 0 && (
            <p className="text-sm text-slate-500">Aucune adresse enregistrée.</p>
          )}
        </ul>
      )}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col gap-3 rounded-xl2 border border-base-700 bg-base-800 p-4"
        >
          <input
            name="label"
            required
            defaultValue={editing?.label}
            placeholder="Nom (ex: Domicile, Bureau)"
            className="rounded-lg bg-base-700 px-3 py-2 text-sm placeholder:text-slate-500"
          />
          <textarea
            name="fullAddress"
            required
            defaultValue={editing?.fullAddress}
            placeholder="Adresse complète"
            rows={2}
            className="rounded-lg bg-base-700 px-3 py-2 text-sm placeholder:text-slate-500"
          />
          <input
            name="city"
            required
            defaultValue={editing?.city}
            placeholder="Ville"
            className="rounded-lg bg-base-700 px-3 py-2 text-sm placeholder:text-slate-500"
          />
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" name="isDefault" defaultChecked={editing?.isDefault} />
            Définir comme adresse par défaut
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-base-950">
              {editing ? 'Enregistrer' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
              className="rounded-lg border border-base-700 px-3 py-2 text-sm text-slate-400"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={startCreate}
          className="mt-4 w-full rounded-xl2 border border-dashed border-base-700 py-3 text-sm text-amber-400"
        >
          + Ajouter une adresse
        </button>
      )}
    </div>
  );
}
