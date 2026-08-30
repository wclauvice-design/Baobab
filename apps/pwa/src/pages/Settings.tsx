import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/account" className="text-slate-400">←</Link>
        <h1 className="text-xl font-bold">Paramètres</h1>
      </div>

      <div className="rounded-xl2 bg-base-800 p-4">
        <p className="text-sm text-slate-400">Téléphone</p>
        <p className="font-medium">{user?.phone}</p>
        <p className="mt-3 text-sm text-slate-400">Langue</p>
        <p className="font-medium">Français</p>
        <p className="mt-3 text-sm text-slate-400">Rôle</p>
        <p className="font-medium">{user?.role}</p>
      </div>

      <button onClick={logout} className="mt-6 text-sm text-red-400 underline">
        Se déconnecter
      </button>
    </div>
  );
}
