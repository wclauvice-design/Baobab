import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, ApiError, replaceProductImage, addProductImages, removeProductImage, setProductMainImage } from '../../lib/api';
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
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [busyMessage, setBusyMessage] = useState<string>('');

  // Target for replacing a specific photo
  const [replaceTarget, setReplaceTarget] = useState<{ productId: string; oldUrl: string } | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Target for adding multiple photos
  const [addMultipleTargetId, setAddMultipleTargetId] = useState<string | null>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    api.get<ProductRow[]>('/products/mine').then(setProducts).catch(() => {});
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
  }

  useEffect(load, []);

  function flashSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  }

  async function createCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name'));
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    try {
      await api.post('/categories', { name, slug });
      (e.target as HTMLFormElement).reset();
      flashSuccess('Catégorie ajoutée !');
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
      flashSuccess('Article ajouté au catalogue !');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    }
  }

  function triggerReplace(productId: string, oldUrl: string) {
    setReplaceTarget({ productId, oldUrl });
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = '';
      replaceFileInputRef.current.click();
    }
  }

  async function handleReplaceFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !replaceTarget) return;

    const { productId, oldUrl } = replaceTarget;
    setBusyProductId(productId);
    setBusyMessage('Remplacement de la photo...');
    setError(null);

    try {
      await replaceProductImage(productId, oldUrl, file);
      flashSuccess('Photo remplacée avec succès !');
      load();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du remplacement de la photo');
    } finally {
      setBusyProductId(null);
      setBusyMessage('');
      setReplaceTarget(null);
    }
  }

  function triggerAddMultiple(productId: string) {
    setAddMultipleTargetId(productId);
    if (addFileInputRef.current) {
      addFileInputRef.current.value = '';
      addFileInputRef.current.click();
    }
  }

  async function handleAddFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !addMultipleTargetId) return;

    const productId = addMultipleTargetId;
    setBusyProductId(productId);
    setBusyMessage(`Téléversement de ${files.length} photo(s)...`);
    setError(null);

    try {
      const fileList = Array.from(files);
      await addProductImages(productId, fileList);
      flashSuccess(`${fileList.length} photo(s) ajoutée(s) !`);
      load();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'ajout des photos');
    } finally {
      setBusyProductId(null);
      setBusyMessage('');
      setAddMultipleTargetId(null);
    }
  }

  async function promptAddByUrl(productId: string) {
    const url = window.prompt("Collez l'URL directe de l'image (Temu, Dubizzle, CDN ou lien web) :");
    if (!url || !url.trim()) return;

    setBusyProductId(productId);
    setBusyMessage('Ajout de l\'image par URL...');
    setError(null);

    try {
      await addProductImages(productId, [url.trim()]);
      flashSuccess('Image ajoutée par URL !');
      load();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'ajout de l\'URL');
    } finally {
      setBusyProductId(null);
      setBusyMessage('');
    }
  }

  async function handleRemoveImage(productId: string, url: string) {
    if (!window.confirm('Voulez-vous retirer cette photo du produit ?')) return;

    setBusyProductId(productId);
    setBusyMessage('Suppression de la photo...');
    try {
      await removeProductImage(productId, url);
      flashSuccess('Photo retirée.');
      load();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la suppression de la photo');
    } finally {
      setBusyProductId(null);
      setBusyMessage('');
    }
  }

  async function handleSetMainImage(productId: string, url: string) {
    setBusyProductId(productId);
    setBusyMessage('Mise en photo principale...');
    try {
      await setProductMainImage(productId, url);
      flashSuccess('Photo principale mise à jour !');
      load();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du réordonnancement');
    } finally {
      setBusyProductId(null);
      setBusyMessage('');
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.seller?.shopName && p.seller.shopName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleReplaceFileSelected}
      />
      <input
        ref={addFileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleAddFilesSelected}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalogue global & Photos</h1>
          <p className="text-xs text-slate-500">
            Gestion des articles : remplacez une photo existante, ajoutez plusieurs images au même produit ou renseignez des liens d'images.
          </p>
        </div>

        <input
          type="search"
          placeholder="Rechercher par nom, catégorie, vendeur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 font-medium border border-red-200">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 font-medium border border-emerald-200">
          ✅ {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={createCategory} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Nouvelle catégorie</h2>
          <div className="flex gap-2">
            <input
              name="name"
              required
              placeholder="Nom de la catégorie"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-600 shrink-0">
              Ajouter
            </button>
          </div>
        </form>

        <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-semibold text-amber-700 hover:text-amber-800">
            + Nouveau produit (vente directe Baobab)
          </summary>
          <form onSubmit={createProduct} className="mt-4 space-y-2">
            <input
              name="name"
              required
              placeholder="Nom du produit"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              name="description"
              required
              placeholder="Description détaillée"
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
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
            <select
              name="categoryId"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Sélectionner une catégorie…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-600">
              Créer l'article
            </button>
          </form>
        </details>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3 min-w-[280px]">Galerie & Remplacement des photos</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Vendeur</th>
              <th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map((p) => {
              const isBusy = busyProductId === p.id;
              const images = Array.isArray(p.images) ? p.images : [];

              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-xs">
                    <p className="line-clamp-2">{p.name}</p>
                    <span className="text-[11px] font-mono text-slate-400">{p.id}</span>
                  </td>

                  <td className="px-4 py-3">
                    {isBusy && (
                      <div className="mb-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                        <span>{busyMessage || 'Action en cours...'}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {images.map((url, idx) => (
                        <div
                          key={url + idx}
                          className="group relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-xs"
                        >
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.opacity = '0.4';
                            }}
                          />

                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] text-amber-300 font-bold text-center py-0.5">
                              ★ Principale
                            </span>
                          )}

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                            <div className="flex justify-between items-center">
                              <button
                                type="button"
                                onClick={() => triggerReplace(p.id, url)}
                                title="Remplacer cette photo par une autre"
                                className="h-5 w-5 rounded bg-blue-600 text-white text-[10px] flex items-center justify-center hover:bg-blue-700 shadow"
                              >
                                🔄
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(p.id, url)}
                                title="Supprimer cette photo"
                                className="h-5 w-5 rounded bg-red-600 text-white text-[10px] flex items-center justify-center hover:bg-red-700 shadow"
                              >
                                ✕
                              </button>
                            </div>

                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetMainImage(p.id, url)}
                                title="Mettre en photo principale"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-bold py-0.5 rounded text-center"
                              >
                                ★ Mettre 1ère
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => triggerAddMultiple(p.id)}
                        title="Ajouter une ou plusieurs photos depuis votre appareil"
                        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50/30 transition-all text-xs font-semibold"
                      >
                        <span className="text-base leading-none">+</span>
                        <span className="text-[9px] mt-0.5">Photos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => promptAddByUrl(p.id)}
                        title="Ajouter une photo par lien URL (Temu, Dubizzle, fournisseur...)"
                        className="flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all text-[9px] font-medium"
                      >
                        <span className="text-xs">🔗</span>
                        <span>Lien</span>
                      </button>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{images.length} photo(s)</span>
                      <span>•</span>
                      <span className="text-slate-500">Survolez pour <strong>remplacer</strong> ou supprimer</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-600">{p.category?.name || '—'}</td>

                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {p.seller?.shopName ?? 'Baobab (direct)'}
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                    {formatXof(Number(p.price))}
                    {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price) && (
                      <span className="block text-xs font-normal text-slate-400 line-through">
                        {formatXof(Number(p.compareAtPrice))}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-700">
                    {p.stock}
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Aucun produit trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
