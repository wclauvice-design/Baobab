import { Link } from 'react-router-dom';

export function Messages() {
  return (
    <div className="mx-auto max-w-md px-4 pb-24 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/account" className="text-slate-400">←</Link>
        <h1 className="text-xl font-bold">Messages</h1>
      </div>

      <div className="rounded-xl2 bg-base-800 p-6 text-center">
        <p className="text-3xl">💬</p>
        <p className="mt-3 text-sm text-slate-400">
          La messagerie avec les vendeurs arrive bientôt. En attendant, contactez le support via
          WhatsApp depuis la page Compte.
        </p>
      </div>
    </div>
  );
}
