import { Link } from 'react-router-dom';
import { IconChat } from '../components/icons';

export function Messages() {
  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/account" className="text-slate-400">←</Link>
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      <div className="card p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/5 text-sky-400">
          <IconChat className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm text-slate-400">
          La messagerie avec les vendeurs arrive bientôt. En attendant, contactez le support via
          WhatsApp depuis la page Compte.
        </p>
      </div>
    </div>
  );
}
