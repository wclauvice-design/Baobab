import { KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

export interface CategoryOption {
  value: string;
  label: string;
  group?: string;
}

interface CategoryMultiSelectProps {
  options: CategoryOption[];
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
  /** Thème sombre (formulaires admin) ou clair (fiche commerçant). */
  dark?: boolean;
  max?: number;
  disabled?: boolean;
  /** Autorise une seule valeur (le premier choix remplace le précédent). */
  single?: boolean;
}

function normalize(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Sélecteur de catégories avec recherche instantanée.
 * L'utilisateur tape quelques lettres (insensible aux accents), filtre la liste
 * et sélectionne une ou plusieurs valeurs sans avoir à faire défiler des
 * centaines d'options. Les valeurs choisies restent visibles sous forme de puces.
 */
export function CategoryMultiSelect({
  options,
  values,
  onChange,
  label = 'Catégories',
  placeholder = 'Rechercher une catégorie…',
  hint,
  dark = false,
  max = 12,
  disabled = false,
  single = false,
}: CategoryMultiSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const palette = dark
    ? {
        text: '#e2e8f0',
        muted: 'rgba(226,232,240,0.6)',
        border: 'rgba(255,255,255,0.18)',
        borderActive: '#f2c35e',
        fieldBg: 'rgba(255,255,255,0.04)',
        dropdownBg: '#111a2b',
        hoverBg: 'rgba(242,195,94,0.12)',
        chipBg: 'rgba(242,195,94,0.16)',
        chipText: '#f6d68a',
        accent: '#f2c35e',
      }
    : {
        text: '#0f172a',
        muted: '#64748b',
        border: '#cbd5e1',
        borderActive: '#059669',
        fieldBg: '#ffffff',
        dropdownBg: '#ffffff',
        hoverBg: 'rgba(5,150,105,0.08)',
        chipBg: 'rgba(5,150,105,0.1)',
        chipText: '#047857',
        accent: '#059669',
      };

  const optionByValue = useMemo(() => {
    const map = new Map<string, CategoryOption>();
    for (const option of options) map.set(option.value, option);
    return map;
  }, [options]);

  const selected = values
    .map((value) => optionByValue.get(value) || { value, label: value })
    .filter((option) => option.label);

  const filtered = useMemo(() => {
    const tokens = normalize(query).split(/\s+/).filter(Boolean);
    if (!tokens.length) return options;
    return options.filter((option) => {
      const haystack = normalize(`${option.label} ${option.group || ''}`);
      return tokens.every((token) => haystack.includes(token));
    });
  }, [options, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CategoryOption[]>();
    for (const option of filtered) {
      const key = option.group || 'Autres';
      const list = map.get(key) || [];
      list.push(option);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flat = useMemo(() => groups.flatMap(([, items]) => items), [groups]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  function toggle(option: CategoryOption) {
    if (disabled) return;
    const already = values.includes(option.value);
    if (already) {
      onChange(values.filter((value) => value !== option.value));
      return;
    }
    if (single) {
      onChange([option.value]);
      setQuery('');
      setOpen(false);
      return;
    }
    if (values.length >= max) return;
    onChange([...values, option.value]);
    setQuery('');
  }

  function remove(value: string) {
    if (disabled) return;
    onChange(values.filter((item) => item !== value));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight((index) => Math.min(index + 1, Math.max(flat.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      if (open && flat[highlight]) {
        event.preventDefault();
        toggle(flat[highlight]);
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
    } else if (event.key === 'Backspace' && !query && values.length) {
      event.preventDefault();
      remove(values[values.length - 1]);
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: palette.muted,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: selected.length ? palette.accent : palette.muted }}>
          {selected.length}
          {single ? '' : ` / ${max}`}
        </span>
      </div>

      <div
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          inputRef.current?.focus();
        }}
        style={{
          minHeight: 44,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
          padding: '6px 8px',
          borderRadius: 10,
          border: `1.5px solid ${open ? palette.borderActive : palette.border}`,
          background: palette.fieldBg,
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color 0.15s ease',
        }}
      >
        {selected.map((option) => (
          <span
            key={option.value}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              maxWidth: '100%',
              padding: '3px 6px 3px 8px',
              borderRadius: 999,
              background: palette.chipBg,
              color: palette.chipText,
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {option.label}
            </span>
            <button
              type="button"
              aria-label={`Retirer ${option.label}`}
              onClick={(event) => {
                event.stopPropagation();
                remove(option.value);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: 13,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={selected.length && !single ? 'Ajouter…' : placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label={label}
          style={{
            flex: '1 1 120px',
            minWidth: 90,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: palette.text,
            fontSize: 13,
            padding: '4px 2px',
          }}
        />
      </div>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-multiselectable={!single}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 40,
            marginTop: 4,
            maxHeight: 260,
            overflowY: 'auto',
            borderRadius: 10,
            border: `1px solid ${palette.border}`,
            background: palette.dropdownBg,
            boxShadow: '0 16px 40px rgba(2,6,23,0.35)',
          }}
        >
          {flat.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: palette.muted }}>
              Aucun résultat pour « {query} ».
            </div>
          ) : (
            groups.map(([group, items]) => (
              <div key={group}>
                <div
                  style={{
                    padding: '7px 12px 4px',
                    fontSize: 9.5,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: palette.muted,
                  }}
                >
                  {group}
                </div>
                {items.map((option) => {
                  const index = flat.indexOf(option);
                  const active = values.includes(option.value);
                  const blocked = !active && !single && values.length >= max;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      data-index={index}
                      role="option"
                      aria-selected={active}
                      disabled={blocked}
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => toggle(option)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '8px 12px',
                        border: 'none',
                        background: index === highlight ? palette.hoverBg : 'transparent',
                        color: blocked ? palette.muted : palette.text,
                        fontSize: 12.5,
                        fontWeight: active ? 800 : 500,
                        textAlign: 'left',
                        cursor: blocked ? 'not-allowed' : 'pointer',
                        opacity: blocked ? 0.5 : 1,
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {option.label}
                      </span>
                      {active && <span style={{ color: palette.accent, fontWeight: 900 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, color: palette.muted }}>
          {hint || 'Tapez quelques lettres pour filtrer. Sélectionnez une ou plusieurs valeurs.'}
        </span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            style={{
              border: 'none',
              background: 'transparent',
              color: palette.muted,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Tout effacer
          </button>
        )}
      </div>
    </div>
  );
}
