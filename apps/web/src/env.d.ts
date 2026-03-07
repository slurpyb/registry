/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Extend window for cart functionality
declare global {
  interface Window {
    addToCart?: (data: { name: string; type: string; description: string; icon?: string }) => void
  }
}

export {}
