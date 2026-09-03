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

      <div className="card divide-y divide-white/[0.06] p-0">
        <div className="p-4">
          <p className="text-sm text-slate-400">Téléphone</p>
          <p className="font-medium">{user?.phone}</p>
        </div>
        <div className="p-4">
          <p className="text-sm text-slate-400">Langue</p>
          <p className="font-medium">Français</p>
        </div>
        <div className="p-4">
          <p className="text-sm text-slate-400">Rôle</p>
          <p className="font-medium">{user?.role}</p>
        </div>
      </div>

      <button
        onClick={logout}
        className="mt-6 w-full rounded-xl2 border border-red-500/20 bg-red-500/5 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
      >
        Se déconnecter
      </button>
    </div>
  );
}
