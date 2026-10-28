import { useMemo, useState } from 'react';
import {
  LISTING_PROFILES,
  ListingVariant,
  VariantOption,
  buildCombinations,
  isInternalAttribute,
  profileById,
  publicPriceFromMerchant,
  suggestedValues,
  validateListing,
  variantLabel,
} from '@westzone/shared';
import { formatInCurrency, fromXof, toXof } from '../lib/format';
import './ListingConfiguration.css';

export type ListingConfiguration = {
  productType: string;
  attributes: Record<string, string>;
  variantOptions: VariantOption[];
  variants: ListingVariant[];
};

type Props = {
  value: ListingConfiguration;
  onChange: (value: ListingConfiguration) => void;
  admin: boolean;
  currency?: string;
  /** Prix net commerçant de référence, exprimé en XOF. */
  defaultSupplierPrice?: number;
  productName?: string;
};

function skuPart(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .slice(0, 10)
    .toUpperCase();
}

function makeSku(
  prefix: string,
  values: Record<string, string>,
  used: Set<string>,
  index: number,
): string {
  const base =
    [prefix, ...Object.values(values).map(skuPart)]
      .filter(Boolean)
      .join('-')
      .slice(0, 70) || `BB-${index + 1}`;
  let sku = base;
  let suffix = 2;
  while (used.has(sku.toLowerCase())) sku = `${base}-${suffix++}`;
  used.add(sku.toLowerCase());
  return sku;
}

export function ListingConfigurationEditor({
  value,
  onChange,
  admin,
  currency = 'XOF',
  defaultSupplierPrice = 0,
  productName = '',
}: Props) {
  const [issue, setIssue] = useState('');
  const [notice, setNotice] = useState('');
  const [newValue, setNewValue] = useState<Record<number, string>>({});
  const [extraKey, setExtraKey] = useState('');
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [skuPrefix, setSkuPrefix] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const profile = profileById(value.productType) ?? LISTING_PROFILES[0];
  const locked = value.variants.length > 0;

  const patch = (next: Partial<ListingConfiguration>) => {
    onChange({ ...value, ...next });
  };

  const updateVariant = (id: string, next: Partial<ListingVariant>) => {
    patch({
      variants: value.variants.map((variant) =>
        variant.id === id ? { ...variant, ...next } : variant,
      ),
    });
  };

  const setOptions = (options: VariantOption[]) => {
    patch({ variantOptions: options });
  };

  const setAttribute = (key: string, nextValue: string) => {
    patch({ attributes: { ...value.attributes, [key]: nextValue } });
  };

  const extraAttributes = useMemo(
    () =>
      Object.entries(value.attributes).filter(
        ([key]) =>
          !profile.fields.some((field) => field.key === key) &&
          !isInternalAttribute(key),
      ),
    [value.attributes, profile.fields],
  );

  const activeVariants = useMemo(
    () => value.variants.filter((variant) => variant.active),
    [value.variants],
  );
  const totalStock = activeVariants.reduce(
    (total, variant) => total + Number(variant.stock || 0),
    0,
  );
  const prices = activeVariants
    .map((variant) => Number(variant.price || 0))
    .filter((price) => price > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const missingSku = activeVariants.filter(
    (variant) => !variant.sku.trim(),
  ).length;
  const missingPrice = activeVariants.filter(
    (variant) => !(Number(variant.price) > 0),
  ).length;
  const previewVariant = activeVariants[0];

  const requiredFields = profile.fields.filter((field) => field.required);
  const completedRequired = requiredFields.filter((field) =>
    String(value.attributes[field.key] || '').trim(),
  ).length;

  const validationErrors = useMemo(
    () =>
      validateListing(
        value.productType,
        value.attributes,
        value.variantOptions,
        value.variants,
      ),
    [value],
  );

  function addOption() {
    if (locked || value.variantOptions.length >= 3) return;
    const used = new Set(
      value.variantOptions.map((option) => option.name.toLowerCase()),
    );
    const suggestion = profile.options.find(
      (name) => !used.has(name.toLowerCase()),
    );
    setOptions([
      ...value.variantOptions,
      { name: suggestion || '', values: [] },
    ]);
    setIssue('');
  }

  function removeOption(index: number) {
    if (locked) return;
    setOptions(value.variantOptions.filter((_, position) => position !== index));
  }

  function renameOption(index: number, name: string) {
    if (locked) return;
    setOptions(
      value.variantOptions.map((option, position) =>
        position === index ? { ...option, name } : option,
      ),
    );
  }

  function addValues(index: number) {
    const option = value.variantOptions[index];
    if (!option) return;
    const raw = String(newValue[index] || '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (!raw.length) return;

    const seen = new Set(option.values.map((entry) => entry.toLowerCase()));
    const values = [...option.values];
    for (const entry of raw) {
      if (entry.length > 80) {
        setIssue('Une valeur ne peut pas dépasser 80 caractères.');
        continue;
      }
      if (!seen.has(entry.toLowerCase())) {
        seen.add(entry.toLowerCase());
        values.push(entry);
      }
    }
    if (values.length > 100) {
      setIssue('Une option ne peut pas dépasser 100 valeurs.');
      return;
    }
    setOptions(
      value.variantOptions.map((current, position) =>
        position === index ? { ...current, values } : current,
      ),
    );
    setNewValue({ ...newValue, [index]: '' });
    setIssue('');
  }

  function removeValue(index: number, target: string) {
    if (locked) return;
    setOptions(
      value.variantOptions.map((option, position) =>
        position === index
          ? {
              ...option,
              values: option.values.filter((entry) => entry !== target),
            }
          : option,
      ),
    );
  }

  function toggleSuggestion(index: number, suggestion: string) {
    if (locked) return;
    const option = value.variantOptions[index];
    if (!option) return;
    const selected = option.values.some(
      (entry) => entry.toLowerCase() === suggestion.toLowerCase(),
    );
    setOptions(
      value.variantOptions.map((current, position) =>
        position === index
          ? {
              ...current,
              values: selected
                ? current.values.filter(
                    (entry) =>
                      entry.toLowerCase() !== suggestion.toLowerCase(),
                  )
                : [...current.values, suggestion],
            }
          : current,
      ),
    );
  }

  function generate() {
    setIssue('');
    setNotice('');
    const options = value.variantOptions;
    if (!options.length) {
      setIssue('Ajoutez au moins un axe de variante.');
      return;
    }
    if (
      options.some(
        (option) => !option.name.trim() || option.values.length === 0,
      )
    ) {
      setIssue('Renseignez le nom et au moins une valeur pour chaque axe.');
      return;
    }
    const count = options.reduce(
      (total, option) => total * option.values.length,
      1,
    );
    if (count > 200) {
      setIssue(
        'Plus de 200 combinaisons : réduisez les valeurs ou créez plusieurs annonces.',
      );
      return;
    }

    const combinations = buildCombinations(options);
    const usedSkus = new Set(
      value.variants
        .map((variant) => variant.sku.trim().toLowerCase())
        .filter(Boolean),
    );
    const prefix = (skuPrefix.trim() || productName.trim() || 'BB').slice(0, 20);
    const supplier = Math.max(0, Number(defaultSupplierPrice || 0));

    const additions = combinations
      .filter(
        (combination) =>
          !value.variants.some(
            (variant) =>
              Object.keys(combination).length ===
                Object.keys(variant.values).length &&
              Object.entries(combination).every(
                ([key, entry]) => variant.values[key] === entry,
              ),
          ),
      )
      .map((combination, index) => ({
        id: crypto.randomUUID(),
        sku: makeSku(prefix, combination, usedSkus, index),
        values: combination,
        price: publicPriceFromMerchant(supplier),
        supplierPrice: supplier,
        stock: 0,
        images: [],
        active: true,
      }));

    if (value.variants.length + additions.length > 200) {
      setIssue('Maximum de 200 variantes, y compris les variantes désactivées.');
      return;
    }
    if (!additions.length) {
      setNotice('Toutes les combinaisons existent déjà.');
      return;
    }
    patch({ variants: [...value.variants, ...additions] });
    setNotice(
      supplier > 0
        ? `${additions.length} combinaison(s) créée(s). Vérifiez le stock et les prix.`
        : `${additions.length} combinaison(s) créée(s). Renseignez le prix commerçant et le stock.`,
    );
  }

  function resetVariants() {
    if (
      !window.confirm(
        'Supprimer toutes les combinaisons ? Les références SKU, les stocks et les prix saisis seront perdus.',
      )
    ) {
      return;
    }
    patch({ variants: [] });
    setIssue('');
    setNotice('Combinaisons supprimées. Vous pouvez modifier les options.');
  }

  function applyBulkPrice() {
    const amount = Number(bulkPrice);
    if (!Number.isFinite(amount) || amount <= 0) {
      setIssue('Saisissez un prix commerçant positif.');
      return;
    }
    const supplier = toXof(amount, currency);
    patch({
      variants: value.variants.map((variant) =>
        variant.active
          ? {
              ...variant,
              supplierPrice: supplier,
              price: publicPriceFromMerchant(supplier),
            }
          : variant,
      ),
    });
    setIssue('');
    setNotice('Prix appliqué aux variantes actives.');
  }

  function applyBulkStock() {
    const stock = Number(bulkStock);
    if (!Number.isInteger(stock) || stock < 0) {
      setIssue('Saisissez un stock entier positif.');
      return;
    }
    patch({
      variants: value.variants.map((variant) =>
        variant.active ? { ...variant, stock } : variant,
      ),
    });
    setIssue('');
    setNotice('Stock appliqué aux variantes actives.');
  }

  function generateSkus() {
    const prefix = (skuPrefix.trim() || productName.trim() || 'BB').slice(0, 20);
    const used = new Set(
      value.variants
        .map((variant) => variant.sku.trim().toLowerCase())
        .filter(Boolean),
    );
    patch({
      variants: value.variants.map((variant, index) =>
        variant.sku.trim()
          ? variant
          : {
              ...variant,
              sku: makeSku(prefix, variant.values, used, index),
            },
      ),
    });
    setIssue('');
    setNotice('Références SKU générées pour les variantes sans référence.');
  }

  function applyMarkup() {
    patch({
      variants: value.variants.map((variant) => {
        const supplier = Number(variant.supplierPrice ?? variant.price ?? 0);
        return supplier > 0
          ? { ...variant, price: publicPriceFromMerchant(supplier) }
          : variant;
      }),
    });
    setIssue('');
    setNotice('Prix publics recalculés avec la marge ×1,75.');
  }

  function addExtraAttribute() {
    const key = extraKey.trim();
    if (!key) return;
    if (key.length > 80) {
      setIssue('Le nom de la caractéristique est trop long.');
      return;
    }
    if (
      profile.fields.some((field) => field.key === key) ||
      Object.prototype.hasOwnProperty.call(value.attributes, key)
    ) {
      setIssue('Cette caractéristique existe déjà.');
      return;
    }
    patch({ attributes: { ...value.attributes, [key]: '' } });
    setExtraKey('');
    setIssue('');
  }

  function removeExtraAttribute(key: string) {
    const attributes = { ...value.attributes };
    delete attributes[key];
    patch({ attributes });
  }

  return (
    <section className="listing-config op-span">
      <header className="listing-config-head">
        <div className="listing-heading">
          <span className="listing-step">1</span>
          <div>
            <h3>Famille et caractéristiques</h3>
            <p>
              Choisissez la famille exacte. Les champs marqués d’un astérisque
              sont obligatoires.
            </p>
          </div>
        </div>
        <span className="listing-progress">
          {requiredFields.length
            ? `${completedRequired}/${requiredFields.length} obligatoires`
            : 'Aucun champ obligatoire'}
        </span>
      </header>

      <div className="listing-family">
        <label>
          Famille de produit
          <select
            value={value.productType}
            disabled={locked}
            onChange={(event) => {
              if (locked) {
                setIssue(
                  'Réinitialisez les combinaisons avant de changer de famille.',
                );
                return;
              }
              patch({
                productType: event.target.value,
                variantOptions: [],
              });
              setIssue('');
              setNotice('');
            }}
          >
            {LISTING_PROFILES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <p>{profile.description}</p>
      </div>

      <div className="listing-spec-grid">
        {profile.fields.map((field) => {
          const empty =
            field.required &&
            !String(value.attributes[field.key] || '').trim();
          return (
            <label
              key={field.key}
              className={empty ? 'is-required-empty' : undefined}
            >
              <span>
                {field.label}
                {field.unit ? ` (${field.unit})` : ''}
                {field.required ? ' *' : ''}
              </span>
              {field.choices ? (
                <select
                  value={value.attributes[field.key] || ''}
                  onChange={(event) =>
                    setAttribute(field.key, event.target.value)
                  }
                  required={field.required}
                >
                  <option value="">Sélectionner…</option>
                  {field.choices.map((choice) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.numeric ? 'number' : 'text'}
                  min={field.numeric ? 0 : undefined}
                  step={field.numeric ? 'any' : undefined}
                  maxLength={field.numeric ? undefined : 300}
                  value={value.attributes[field.key] || ''}
                  placeholder={field.placeholder}
                  onChange={(event) =>
                    setAttribute(field.key, event.target.value)
                  }
                  required={field.required}
                />
              )}
              {field.help && <small>{field.help}</small>}
            </label>
          );
        })}
      </div>

      <details className="listing-extra">
        <summary>
          Caractéristiques complémentaires ({extraAttributes.length})
        </summary>
        <div className="listing-spec-grid">
          {extraAttributes.map(([key, entry]) => (
            <label key={key}>
              {key}
              <div className="listing-inline">
                <input
                  value={entry}
                  maxLength={300}
                  onChange={(event) => setAttribute(key, event.target.value)}
                />
                <button
                  type="button"
                  className="danger"
                  onClick={() => removeExtraAttribute(key)}
                >
                  Retirer
                </button>
              </div>
            </label>
          ))}
        </div>
        <div className="listing-inline">
          <input
            value={extraKey}
            maxLength={80}
            placeholder="Ex. Indice de protection"
            onChange={(event) => setExtraKey(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addExtraAttribute();
              }
            }}
          />
          <button type="button" onClick={addExtraAttribute}>
            Ajouter
          </button>
        </div>
      </details>

      {!profile.unique && (
        <>
          <header className="listing-config-head">
            <div className="listing-heading">
              <span className="listing-step">2</span>
              <div>
                <h3>Options vendables</h3>
                <p>
                  Une combinaison correspond à un article réellement
                  disponible, avec son prix, son stock et son SKU.
                </p>
              </div>
            </div>
            <span className="listing-badge">
              {value.variantOptions.length} axe(s) ·{' '}
              {value.variants.length} combinaison(s)
            </span>
          </header>

          {value.variantOptions.length === 0 && (
            <div className="listing-empty">
              <strong>Aucune option pour le moment.</strong>
              <span>
                Ajoutez par exemple « Couleur », « Taille » ou « Stockage ».
                Pour un article unique sans déclinaison, laissez cette section
                vide.
              </span>
            </div>
          )}

          {value.variantOptions.map((option, index) => {
            const suggestions = suggestedValues(option.name);
            return (
              <div className="listing-option-card" key={`${option.name}-${index}`}>
                <div className="listing-option-top">
                  <label>
                    Nom de l’axe
                    <select
                      value={
                        profile.options.includes(option.name)
                          ? option.name
                          : 'custom'
                      }
                      disabled={locked}
                      onChange={(event) =>
                        renameOption(
                          index,
                          event.target.value === 'custom'
                            ? ''
                            : event.target.value,
                        )
                      }
                    >
                      <option value="custom">Personnalisée</option>
                      {profile.options.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <input
                      value={option.name}
                      maxLength={60}
                      disabled={locked}
                      placeholder="Ex. Couleur"
                      onChange={(event) =>
                        renameOption(index, event.target.value)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="danger"
                    disabled={locked}
                    onClick={() => removeOption(index)}
                  >
                    Retirer l’axe
                  </button>
                </div>

                <div className="listing-values">
                  {option.values.length === 0 && (
                    <span className="listing-muted">
                      Aucune valeur. Ajoutez-en ci-dessous.
                    </span>
                  )}
                  {option.values.map((entry) => (
                    <span className="listing-chip" key={entry}>
                      {entry}
                      {!locked && (
                        <button
                          type="button"
                          aria-label={`Retirer ${entry}`}
                          onClick={() => removeValue(index, entry)}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="listing-inline">
                  <input
                    value={newValue[index] || ''}
                    maxLength={80}
                    disabled={locked}
                    placeholder="Ajouter une valeur (séparez par une virgule)"
                    onChange={(event) =>
                      setNewValue({ ...newValue, [index]: event.target.value })
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addValues(index);
                      }
                    }}
                  />
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => addValues(index)}
                  >
                    Ajouter
                  </button>
                </div>

                {suggestions.length > 0 && (
                  <div className="listing-suggestions">
                    <span>Suggestions :</span>
                    {suggestions.map((suggestion) => {
                      const selected = option.values.some(
                        (entry) =>
                          entry.toLowerCase() === suggestion.toLowerCase(),
                      );
                      return (
                        <button
                          type="button"
                          key={suggestion}
                          className={selected ? 'is-selected' : undefined}
                          disabled={locked}
                          onClick={() => toggleSuggestion(index, suggestion)}
                        >
                          {suggestion}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="listing-inline listing-option-actions">
            <button
              type="button"
              disabled={locked || value.variantOptions.length >= 3}
              onClick={addOption}
            >
              + Ajouter un axe
            </button>
            <button
              type="button"
              className="primary"
              disabled={locked || value.variantOptions.length === 0}
              onClick={generate}
            >
              Générer les combinaisons
            </button>
            {locked && (
              <button type="button" className="danger" onClick={resetVariants}>
                Réinitialiser les combinaisons
              </button>
            )}
          </div>

          {locked && (
            <p className="listing-locked">
              Options verrouillées : des combinaisons existent déjà. Pour les
              modifier, réinitialisez les combinaisons.
            </p>
          )}

          {issue && (
            <p className="listing-alert" role="alert">
              {issue}
            </p>
          )}
          {notice && <p className="listing-notice">{notice}</p>}

          {value.variants.length > 0 && (
            <>
              <div className="listing-bulk">
                <label>
                  Prix commerçant ({currency})
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkPrice}
                    placeholder="Ex. 100"
                    onChange={(event) => setBulkPrice(event.target.value)}
                  />
                </label>
                <button type="button" onClick={applyBulkPrice}>
                  Appliquer aux actives
                </button>
                <label>
                  Stock
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={bulkStock}
                    placeholder="Ex. 10"
                    onChange={(event) => setBulkStock(event.target.value)}
                  />
                </label>
                <button type="button" onClick={applyBulkStock}>
                  Appliquer
                </button>
                <label>
                  Préfixe SKU
                  <input
                    value={skuPrefix}
                    maxLength={20}
                    placeholder="BB"
                    onChange={(event) => setSkuPrefix(event.target.value)}
                  />
                </label>
                <button type="button" onClick={generateSkus}>
                  Générer les SKU
                </button>
                {admin && (
                  <button type="button" onClick={applyMarkup}>
                    Appliquer ×1,75
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      variants: value.variants.map((variant) => ({
                        ...variant,
                        active: true,
                      })),
                    })
                  }
                >
                  Tout activer
                </button>
              </div>

              <div className="listing-summary">
                <span>
                  <b>{activeVariants.length}</b> variante(s) active(s)
                </span>
                <span>
                  <b>{totalStock}</b> en stock
                </span>
                {minPrice > 0 && (
                  <span>
                    Dès <b>{formatInCurrency(minPrice, currency)}</b>
                  </span>
                )}
                {missingSku > 0 && (
                  <span className="is-warning">
                    {missingSku} SKU manquant(s)
                  </span>
                )}
                {missingPrice > 0 && (
                  <span className="is-warning">
                    {missingPrice} prix manquant(s)
                  </span>
                )}
              </div>

              <div className="listing-table-wrap">
                <table className="listing-table">
                  <thead>
                    <tr>
                      <th>Combinaison</th>
                      <th>SKU</th>
                      <th>Prix commerçant ({currency})</th>
                      <th>Prix public ({currency})</th>
                      <th>Stock</th>
                      <th>Poids (kg)</th>
                      <th>Active</th>
                      <th>Médias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {value.variants.map((variant) => {
                      const supplier = Number(
                        variant.supplierPrice ?? variant.price ?? 0,
                      );
                      return (
                        <tr
                          key={variant.id}
                          className={variant.active ? undefined : 'is-inactive'}
                        >
                          <td>
                            <strong>{variantLabel(variant)}</strong>
                            {!variant.active && <small>Désactivée</small>}
                          </td>
                          <td>
                            <input
                              value={variant.sku}
                              maxLength={80}
                              placeholder="Référence"
                              onChange={(event) =>
                                updateVariant(variant.id, {
                                  sku: event.target.value,
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={fromXof(supplier, currency)}
                              onChange={(event) => {
                                const nextSupplier = toXof(
                                  Number(event.target.value || 0),
                                  currency,
                                );
                                updateVariant(variant.id, {
                                  supplierPrice: nextSupplier,
                                  ...(!admin
                                    ? {
                                        price: publicPriceFromMerchant(
                                          nextSupplier,
                                        ),
                                      }
                                    : {}),
                                });
                              }}
                            />
                          </td>
                          <td>
                            {admin ? (
                              <div className="listing-price-cell">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={fromXof(
                                    Number(variant.price || 0),
                                    currency,
                                  )}
                                  onChange={(event) =>
                                    updateVariant(variant.id, {
                                      price: toXof(
                                        Number(event.target.value || 0),
                                        currency,
                                      ),
                                    })
                                  }
                                />
                                <button
                                  type="button"
                                  title="Appliquer la marge ×1,75"
                                  onClick={() =>
                                    updateVariant(variant.id, {
                                      price: publicPriceFromMerchant(supplier),
                                    })
                                  }
                                >
                                  ×1,75
                                </button>
                              </div>
                            ) : (
                              <span className="listing-computed-price">
                                {formatInCurrency(
                                  publicPriceFromMerchant(supplier),
                                  currency,
                                )}
                              </span>
                            )}
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={variant.stock}
                              onChange={(event) =>
                                updateVariant(variant.id, {
                                  stock: Number(event.target.value || 0),
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.001"
                              value={variant.weightKg ?? ''}
                              placeholder="—"
                              onChange={(event) =>
                                updateVariant(variant.id, {
                                  weightKg: event.target.value
                                    ? Number(event.target.value)
                                    : undefined,
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              checked={variant.active}
                              aria-label={`Activer ${variantLabel(variant)}`}
                              onChange={(event) =>
                                updateVariant(variant.id, {
                                  active: event.target.checked,
                                })
                              }
                            />
                          </td>
                          <td>
                            <details className="listing-media">
                              <summary>
                                {variant.images.length
                                  ? `${variant.images.length} média(s)`
                                  : 'Ajouter'}
                              </summary>
                              <textarea
                                rows={3}
                                value={variant.images.join('\n')}
                                placeholder="Une URL HTTPS par ligne"
                                onChange={(event) =>
                                  updateVariant(variant.id, {
                                    images: event.target.value
                                      .split('\n')
                                      .map((entry) => entry.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <details className="listing-preview">
                <summary>Prévisualisation de la fiche acheteur</summary>
                <div className="listing-preview-card">
                  <strong>{productName || 'Votre article'}</strong>
                  <div className="listing-preview-options">
                    {value.variantOptions.map((option) => (
                      <div key={option.name}>
                        <span>{option.name}</span>
                        <div>
                          {option.values.map((entry) => (
                            <button
                              type="button"
                              key={entry}
                              className={
                                previewVariant?.values[option.name] === entry
                                  ? 'is-selected'
                                  : undefined
                              }
                            >
                              {entry}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {previewVariant ? (
                    <div className="listing-preview-footer">
                      <b>{formatInCurrency(previewVariant.price, currency)}</b>
                      <span>
                        {previewVariant.stock} en stock · SKU{' '}
                        {previewVariant.sku || 'à définir'}
                      </span>
                    </div>
                  ) : (
                    <p className="listing-muted">
                      Activez au moins une combinaison pour afficher un prix.
                    </p>
                  )}
                </div>
              </details>
            </>
          )}

          <div className="listing-validation">
            <button
              type="button"
              onClick={() => setShowValidation(true)}
            >
              Vérifier la fiche
            </button>
            {showValidation &&
              (validationErrors.length ? (
                <ul>
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : (
                <p className="is-valid">Aucune erreur détectée.</p>
              ))}
          </div>
        </>
      )}

      {profile.unique && (
        <div className="listing-note">
          Cette famille décrit une annonce individuelle : les variantes ne
          s’appliquent pas. Les caractéristiques ci-dessus suffisent.
        </div>
      )}
    </section>
  );
}
