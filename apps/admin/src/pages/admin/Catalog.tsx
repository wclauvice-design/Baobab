import { FormEvent, useEffect, useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { formatXof } from '../../lib/format';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string[];
  category: { name: string };
  seller: { shopName: string } | null;
}

export function Catalog() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get<ProductRow[]>('/products/mine').then(setProducts);
    api.get<Category[]>('/categories').then(setCategories);
  }

  useEffect(load, []);

  async function createCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name'));
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    try {
      await api.post('/categories', { name, slug });
      (e.target as HTMLFormElement).reset();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    }
  }

  async function createProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const compareAtPrice = form.get('compareAtPrice');
      await api.post('/products', {
        name: form.get('name'),
        description: form.get('description'),
        price: Number(form.get('price')),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        stock: Number(form.get('stock')),
        categoryId: form.get('categoryId'),
      });
      (e.target as HTMLFormElement).reset();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    }
  }

  async function uploadImage(productId: string, file: File) {
    try {
      await api.upload(`/products/${productId}/images`, file);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    }
  }

  async function removeImage(productId: string, url: string) {
    await api.delete(`/products/${productId}/images`, { url });
    load();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Catalogue global</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="mb-8 grid grid-cols-2 gap-6">
        <form onSubmit={createCategory} className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Nouvelle catégorie</h2>
          <input
            name="name"
            required
            placeholder="Nom"
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white">
            Ajouter
          </button>
        </form>

        <form onSubmit={createProduct} className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold">Nouveau produit (vente directe)</h2>
          <input
            name="name"
            required
            placeholder="Nom"
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            required
            placeholder="Description"
            rows={2}
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="mb-2 grid grid-cols-2 gap-2">
            <input
              name="price"
              type="number"
              required
              placeholder="Prix (FCFA)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="stock"
              type="number"
              required
              placeholder="Stock"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <input
            name="compareAtPrice"
            type="number"
            placeholder="Prix barré (optionnel, pour une promo)"
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            name="categoryId"
            required
            className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Catégorie…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white">
            Créer
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Photos</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Vendeur</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.images.map((url) => (
                      <div key={url} className="group relative h-10 w-10 shrink-0">
                        <img src={url} alt="" className="h-10 w-10 rounded-md object-cover" />
                        <button
                          onClick={() => removeImage(p.id, url)}
                          title="Retirer cette photo"
                          className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] leading-none text-white group-hover:flex"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 text-slate-400 hover:border-amber-400 hover:text-amber-500">
                      +
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(p.id, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3">{p.seller?.shopName ?? 'Baobab (direct)'}</td>
                <td className="px-4 py-3">
                  {formatXof(Number(p.price))}
                  {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price) && (
                    <span className="ml-1 text-xs text-slate-400 line-through">
                      {formatXof(Number(p.compareAtPrice))}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
