import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sellerId: string | null;
  shopName: string;
  selected: boolean;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity' | 'selected'>, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  toggleSelected: (productId: string) => void;
  setAllSelected: (selected: boolean) => void;
  clearSelected: () => void;
  clear: () => void;
  total: number;
  selectedTotal: number;
  selectedCount: number;
}

const STORAGE_KEY = 'baobab_cart';
const CartContext = createContext<CartContextValue | null>(null);

function normalize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    sellerId: null,
    shopName: 'Baobab',
    selected: true,
    ...item,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const rawStored = localStorage.getItem(STORAGE_KEY);
      return rawStored ? normalize(JSON.parse(rawStored)) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(item: Omit<CartItem, 'quantity' | 'selected'>, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i,
        );
      }
      return [...prev, { ...item, quantity, selected: true }];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function toggleSelected(productId: string) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, selected: !i.selected } : i)),
    );
  }

  function setAllSelected(selected: boolean) {
    setItems((prev) => prev.map((i) => ({ ...i, selected })));
  }

  function clearSelected() {
    setItems((prev) => prev.filter((i) => !i.selected));
  }

  function clear() {
    setItems([]);
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedItems = items.filter((i) => i.selected);
  const selectedTotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        toggleSelected,
        setAllSelected,
        clearSelected,
        clear,
        total,
        selectedTotal,
        selectedCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
