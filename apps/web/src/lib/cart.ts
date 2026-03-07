/**
 * Cart state management with localStorage persistence
 * Simple pub/sub pattern for cross-component communication
 */

export interface CartItem {
  name: string
  type: "skill" | "plugin" | "agent" | "command" | "bundle" | "profile"
  description: string
  icon?: string
}

export interface ProfileConfig {
  name: string
  model?: string
  smallModel?: string
  registryUrl: string
}

type CartListener = (items: CartItem[]) => void

const CART_KEY = "ocx-cart"
const PROFILE_KEY = "ocx-profile-config"

// In-memory subscribers
const listeners: Set<CartListener> = new Set()

// Get cart items from localStorage
export function getCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(CART_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Save cart to localStorage and notify listeners
function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  listeners.forEach((fn) => { fn(items) })
  // Dispatch custom event for cross-component sync
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: items }))
}

// Add item to cart
export function addToCart(item: CartItem): void {
  const cart = getCart()
  if (!cart.some((c) => c.name === item.name)) {
    saveCart([...cart, item])
  }
}

// Remove item from cart
export function removeFromCart(name: string): void {
  const cart = getCart()
  saveCart(cart.filter((c) => c.name !== name))
}

// Check if item is in cart
export function isInCart(name: string): boolean {
  return getCart().some((c) => c.name === name)
}

// Clear entire cart
export function clearCart(): void {
  saveCart([])
}

// Add multiple items (for bundles)
export function addManyToCart(items: CartItem[]): void {
  const cart = getCart()
  const existingNames = new Set(cart.map((c) => c.name))
  const newItems = items.filter((i) => !existingNames.has(i.name))
  saveCart([...cart, ...newItems])
}

// Subscribe to cart changes
export function subscribeToCart(listener: CartListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Get cart count
export function getCartCount(): number {
  return getCart().length
}

// Profile config helpers
export function getProfileConfig(): ProfileConfig {
  if (typeof window === "undefined") {
    return { name: "my-profile", registryUrl: "https://registry.slurpyb.workers.dev" }
  }
  try {
    const stored = localStorage.getItem(PROFILE_KEY)
    return stored
      ? JSON.parse(stored)
      : { name: "my-profile", registryUrl: "https://registry.slurpyb.workers.dev" }
  } catch {
    return { name: "my-profile", registryUrl: "https://registry.slurpyb.workers.dev" }
  }
}

export function saveProfileConfig(config: ProfileConfig): void {
  if (typeof window === "undefined") return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(config))
}
