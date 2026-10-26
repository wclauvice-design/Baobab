import { FormEvent, useEffect, useRef, useState } from 'react';
import { api, ApiError, replaceProductImage, addProductImages, removeProductImage, setProductMainImage } from '../../lib/api';
import { MediaDropzone } from '../../components/MediaDropzone';
import { CategoryMultiSelect } from '../../components/CategoryMultiSelect';
import {
  subcategoryOptionsForCategory,
  taxonomyCategoryOptions,
  taxonomySubcategoryOptions,
  withLegacyCategoryOptions,
} from '../../lib/taxonomy';
import { MEDIA_ACCEPT, isVideoUrl } from '../../lib/media';
import {
  formatXof,
  toXof,
  MERCHANT_DEFAULT_CURRENCY,
  PRICING_CURRENCIES,
} from '../../lib/format';

interface Category {
  id: string;
  name: string;
  universe?: string;
}

interface ProductRow {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: string[];
  category: { name: string };
  categoryIds?: string[];
  subcategory?: string;
  subcategories?: string[];
  attributes?: Record<string, string>;
}

export function Products() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [busyMessage, setBusyMessage] = useState<string>('');
  const [priceCurrency, setPriceCurrency] = useState<string>(MERCHANT_DEFAULT_CURRENCY);
  const [priceInput, setPriceInput] = useState<string>('');
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);

  // Target for replacing a specific photo: { productId, oldUrl }
  const [replaceTarget, setReplaceTarget] = useState<{ productId: string; oldUrl: string } | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Target for adding multiple photos to a product
  const [addMultipleTargetId, setAddMultipleTargetId] = useState<string | null>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    api.get<ProductRow[]>('/products/mine').then(setProducts).catch(() => {});
    api.get<Category[]>('/categories').then(setCategories).catch(() => {});
    api.get('/concierge/config').then(setConfig).catch(() => {});
  }

  useEffect(load, []);

  function flashSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  }

  async function createProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!categoryIds.length) {
      setError('Sélectionnez au moins une catégorie.');
      return;
    }
    try {
      const compareAtPrice = form.get('compareAtPrice');
      const amount = Number(form.get('sourcePrice') || form.get('price') || 0);
      const created = await api.post<any>('/products', {
        name: form.get('name'),
        description: form.get('description'),
        price: toXof(amount, priceCurrency),
        sourcePrice: amount,
        sourceCurrency: priceCurrency,
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        stock: Number(form.get('stock')),
        categoryId: categoryIds[0],
        categoryIds,
        subcategory: subcategories[0] || 'Autres',
        subcategories: subcategories.length ? subcategories : ['Autres'],
      });
      if (created?.id && formFiles.length > 0) {
        await addProductImages(created.id, formFiles).catch(() => {});
      }
      (e.target as HTMLFormElement).reset();
      setFormFiles([]);
      setCategoryIds([]);
      setSubcategories([]);
      setPriceInput('');
      flashSuccess('Produit créé avec succès !');
      load();
      window.dispatchEvent(new Event('baobab:refresh-counts'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur réseau');
    }
  }

  async function updateStock(id: string, stock: number) {
    await api.patch(`/products/${id}`, { stock });
    load();
  }

  // Déclenche le remplacement d'une image ciblée
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

  // Déclenche l'ajout d'une ou plusieurs photos
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
      flashSuccess(`${fileList.length} photo(s) ajoutée(s) au produit !`);
      load();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'ajout des photos');
    } finally {
      setBusyProductId(null);
      setBusyMessage('');
      setAddMultipleTargetId(null);
    }
  }

  // Ajout direct par lien URL
  async function promptAddByUrl(productId: string) {
    const url = window.prompt("Collez l'URL directe de l'image (Temu, Dubizzle, CDN ou lien web) :");
    if (!url || !url.trim()) return;

    setBusyProductId(productId);
    setBusyMessage('Ajout de l\'image par URL...');
    setError(null);

    try {
      await addProductImages(productId, [url.trim()]);
      flashSuccess('Image ajoutée par URL avec succès !');
      load();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'ajout de l\'URL');
    } finally {
      setBusyProductId(null);
      setBusyMessage('');
    }
  }

  // Retirer une photo
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

  // Définir comme photo principale
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
      p.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  const categoryOptions = (() => {
    const canonical = taxonomyCategoryOptions(config?.taxonomy);
    if (canonical.length) return canonical;
    return categories.map((c) => ({ value: c.id, label: c.name }));
  })();
  const allSubcategoryOptions = taxonomySubcategoryOptions(config?.taxonomy);
  const subcategoryOptions = (() => {
    if (config?.taxonomy) {
      const scoped = categoryIds.length
        ? subcategoryOptionsForCategory(config.taxonomy, categoryIds)
        : [];
      if (scoped.length) return scoped;
      if (allSubcategoryOptions.length) return allSubcategoryOptions;
    }
    const map = new Map<string, { value: string; label: string; group?: string }>();
    for (const universe of config?.universes || []) {
      for (const name of universe.categories || []) {
        if (!map.has(name)) {
          map.set(name, { value: name, label: name, group: universe.name });
        }
      }
    }
    return Array.from(map.values());
  })();

  return (
    <div className="space-y-6">
      {/* Hidden file inputs for replace and add operations */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept={MEDIA_ACCEPT}
        className="hidden"
        onChange={handleReplaceFileSelected}
      />
      <input
        ref={addFileInputRef}
        type="file"
        multiple
        accept={MEDIA_ACCEPT}
        className="hidden"
        onChange={handleAddFilesSelected}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes produits & Photos</h1>
          <p className="text-xs text-slate-500">
            Gérez votre catalogue : remplacez une photo existante, ajoutez plusieurs images au même produit ou renseignez des liens directs.
          </p>
        </div>

        <input
          type="search"
          placeholder="Rechercher un produit..."
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

      <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-amber-700 hover:text-amber-800">
          + Ajouter un nouveau produit à ma boutique
        </summary>
        <form onSubmit={createProduct} className="mt-4 max-w-xl space-y-3">
          <input
            name="name"
            required
            placeholder="Nom de l'article"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            required
            placeholder="Description détaillée (caractéristiques, options, compatibilité...)"
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 space-y-2">
            <label className="block text-[11px] font-semibold text-amber-800">
              Prix de vente — saisi en {priceCurrency} (converti automatiquement en FCFA)
            </label>
            <div className="flex gap-2">
              <select
                value={priceCurrency}
                onChange={(e) => setPriceCurrency(e.target.value)}
                className="rounded-lg border border-amber-300 bg-white px-2 py-2 text-sm font-semibold"
                aria-label="Devise du prix"
              >
                {PRICING_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
              <input
                name="sourcePrice"
                type="number"
                min="0"
                step="0.01"
                required
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder={`Montant en ${priceCurrency}`}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <p className="text-[11px] text-amber-700">
              Prix affiché aux clients :{' '}
              <b>{formatXof(toXof(Number(priceInput || 0), priceCurrency))}</b>
              {priceCurrency !== 'XOF' && (
                <span className="ml-1 text-amber-600">
                  (1 {priceCurrency} ≈ {formatXof(toXof(1, priceCurrency))})
                </span>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              name="stock"
              type="number"
              required
              placeholder="Stock disponible"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="compareAtPrice"
              type="number"
              placeholder="Prix barré indicatif (FCFA, optionnel)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <CategoryMultiSelect
            label="Catégories (une ou plusieurs)"
            placeholder="Rechercher une catégorie…"
            options={withLegacyCategoryOptions(
              categoryOptions,
              categories,
              categoryIds,
            )}
            values={categoryIds}
            onChange={setCategoryIds}
            max={12}
            hint="Tapez quelques lettres pour filtrer instantanément la liste, sans défiler."
          />
          <CategoryMultiSelect
            label="Sous-catégories (une ou plusieurs)"
            placeholder="Rechercher une sous-catégorie…"
            options={subcategoryOptions}
            values={subcategories}
            onChange={setSubcategories}
            max={20}
            hint="Recherche insensible aux accents. Sélectionnez plusieurs sous-catégories si besoin."
          />
          <MediaDropzone
            files={formFiles}
            onChangeFiles={setFormFiles}
            label="Photos & vidéos de l'article"
            hint="Cliquez, glissez-déposez ou collez (Ctrl+V) une image ou une vidéo copiée depuis un site, WhatsApp ou Dubizzle."
          />
          <button className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow hover:bg-amber-600">
            Enregistrer et publier l'article
          </button>
        </form>
      </details>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3 min-w-[280px]">Galerie & Remplacement des photos</th>
              <th className="px-4 py-3">Catégorie</th>
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
                          {isVideoUrl(url) ? (
                            <video
                              src={url}
                              muted
                              playsInline
                              loop
                              autoPlay
                              preload="metadata"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={url}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = '0.4';
                              }}
                            />
                          )}

                          {/* Badge Photo Principale */}
                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] text-amber-300 font-bold text-center py-0.5">
                              ★ Principale
                            </span>
                          )}

                          {/* Overlay d'actions sur hover */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                            <div className="flex justify-between items-center">
                              {/* Bouton Remplacer */}
                              <button
                                type="button"
                                onClick={() => triggerReplace(p.id, url)}
                                title="Remplacer cette photo par une autre"
                                className="h-5 w-5 rounded bg-blue-600 text-white text-[10px] flex items-center justify-center hover:bg-blue-700 shadow"
                              >
                                🔄
                              </button>

                              {/* Bouton Supprimer */}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(p.id, url)}
                                title="Supprimer cette photo"
                                className="h-5 w-5 rounded bg-red-600 text-white text-[10px] flex items-center justify-center hover:bg-red-700 shadow"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Bouton définir comme principale */}
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetMainImage(p.id, url)}
                                title="Définir en 1ère photo (Principale)"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-[8px] font-bold py-0.5 rounded text-center"
                              >
                                ★ Mettre 1ère
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Bouton Ajouter photos (fichiers multiples) */}
                      <button
                        type="button"
                        onClick={() => triggerAddMultiple(p.id)}
                        title="Ajouter une ou plusieurs photos depuis votre appareil"
                        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-amber-500 hover:text-amber-600 hover:bg-amber-50/30 transition-all text-xs font-semibold"
                      >
                        <span className="text-base leading-none">+</span>
                        <span className="text-[9px] mt-0.5">Photos</span>
                      </button>

                      {/* Bouton Ajouter par URL directe */}
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
                      <span className="text-slate-500">Survolez une photo pour la <strong>remplacer</strong> ou la supprimer</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {p.category?.name || '—'}
                    {Array.isArray(p.subcategories) && p.subcategories.length > 0 && (
                      <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                        {p.subcategories.join(' · ')}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                    {formatXof(Number(p.price))}
                    {p.attributes?.sourceCurrency && p.attributes?.sourcePrice && (
                      <span className="block text-[10px] font-normal text-amber-700">
                        saisi : {Number(p.attributes.sourcePrice).toLocaleString('fr-FR')} {p.attributes.sourceCurrency}
                      </span>
                    )}
                    {p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price) && (
                      <span className="block text-xs font-normal text-slate-400 line-through">
                        {formatXof(Number(p.compareAtPrice))}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={p.stock}
                      onBlur={(e) => updateStock(p.id, Number(e.target.value))}
                      className="w-16 rounded border border-slate-300 px-2 py-1 text-center font-medium"
                    />
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
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
