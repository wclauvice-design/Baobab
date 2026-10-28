import { useEffect, useMemo, useRef, useState } from 'react';
import { ListingVariant, VariantOption, variantLabel } from '@westzone/shared';
import { useCurrency } from '../lib/currency';

type Props = {
  product: any;
  onSelect: (variant: ListingVariant | null) => void;
};

/**
 * Sélection acheteur d'une combinaison réellement vendable.
 * Les combinaisons inexistantes sont désactivées, la première combinaison
 * disponible est présélectionnée et la rupture reste visible.
 */
export function VariantPicker({ product, onSelect }: Props) {
  const { format } = useCurrency();
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const options = useMemo<VariantOption[]>(
    () => (Array.isArray(product?.variantOptions) ? product.variantOptions : []),
    [product?.variantOptions],
  );
  const variants = useMemo<ListingVariant[]>(
    () =>
      (Array.isArray(product?.variants) ? product.variants : []).filter(
        (variant: ListingVariant) => variant?.active,
      ),
    [product?.variants],
  );

  // Présélectionne la première combinaison en stock (sinon la première
  // combinaison existante, pour afficher clairement la rupture).
  useEffect(() => {
    if (!options.length || !variants.length) {
      setChosen({});
      onSelectRef.current(null);
      return;
    }
    const initial =
      variants.find((variant) => Number(variant.stock) > 0) || variants[0];
    const values = Object.fromEntries(
      options.map((option) => [option.name, initial.values[option.name]]),
    );
    setChosen(values);
    onSelectRef.current(initial);
  }, [product?.id, options, variants]);

  const selected = useMemo(
    () =>
      variants.find((variant) =>
        options.every(
          (option) => variant.values[option.name] === chosen[option.name],
        ),
      ) || null,
    [variants, options, chosen],
  );

  if (!options.length || !variants.length) return null;

  /** Une valeur existe-t-elle avec les autres axes déjà choisis ? */
  function exists(name: string, value: string): boolean {
    return variants.some(
      (variant) =>
        variant.values[name] === value &&
        options.every(
          (option) =>
            option.name === name ||
            !chosen[option.name] ||
            variant.values[option.name] === chosen[option.name],
        ),
    );
  }

  function choose(name: string, value: string) {
    const next = { ...chosen, [name]: value };
    setChosen(next);
    const match =
      variants.find((variant) =>
        options.every(
          (option) => variant.values[option.name] === next[option.name],
        ),
      ) || null;
    onSelectRef.current(match);
  }

  const outOfStock = selected ? Number(selected.stock) <= 0 : false;

  return (
    <fieldset className="bb-variant-picker">
      <legend>Choisissez votre article</legend>
      {options.map((option) => (
        <div className="bb-variant-group" key={option.name}>
          <span className="bb-variant-name">
            {option.name}
            {chosen[option.name] ? ` : ${chosen[option.name]}` : ''}
          </span>
          <div className="bb-variant-values">
            {option.values.map((value) => {
              const available = exists(option.name, value);
              const active = chosen[option.name] === value;
              return (
                <button
                  type="button"
                  key={value}
                  className={`bb-variant-value${active ? ' is-selected' : ''}${
                    available ? '' : ' is-unavailable'
                  }`}
                  aria-pressed={active}
                  disabled={!available}
                  title={
                    available
                      ? value
                      : 'Cette combinaison n’est pas proposée'
                  }
                  onClick={() => choose(option.name, value)}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selected ? (
        <div className="bb-variant-summary">
          <div>
            <strong>{format(selected.price)}</strong>
            <small>{variantLabel(selected)}</small>
            {selected.sku && <small>Référence : {selected.sku}</small>}
          </div>
          <span
            className={`bb-variant-stock${
              outOfStock ? ' is-out' : ''
            }`}
            role="status"
          >
            {outOfStock
              ? 'Rupture de stock'
              : `${selected.stock} disponible${
                  Number(selected.stock) > 1 ? 's' : ''
                }`}
          </span>
        </div>
      ) : (
        <p className="bb-variant-status" role="status">
          Sélectionnez toutes les options pour voir le prix et la
          disponibilité.
        </p>
      )}
    </fieldset>
  );
}
