/**
 * Profile and bundle export logic
 */

import type { CartItem, ProfileConfig } from "./cart"

interface ExportedProfile {
  model?: string
  small_model?: string
  registries: {
    slurpyb: { url: string }
  }
}

interface ExportedBundle {
  name: string
  type: "profile"
  description: string
  dependencies: string[]
}

/**
 * Build the OCX profile config (ocx.jsonc)
 */
export function buildProfileConfig(config: ProfileConfig): string {
  const profile: ExportedProfile = {
    registries: {
      slurpyb: { url: config.registryUrl },
    },
  }

  if (config.model) profile.model = config.model
  if (config.smallModel) profile.small_model = config.smallModel

  return JSON.stringify(profile, null, 2)
}

/**
 * Build the registry entry for the bundle (for publishing)
 */
export function buildBundleManifest(cart: CartItem[], profileName: string): string {
  const byType = groupBy(cart, (c) => c.type)
  const summary = Object.entries(byType)
    .map(([type, items]) => `${items.length} ${type}${items.length > 1 ? "s" : ""}`)
    .join(", ")

  const bundle: ExportedBundle = {
    name: profileName,
    type: "profile",
    description: `Custom profile with ${summary}`,
    dependencies: cart.map((c) => c.name),
  }

  return JSON.stringify(bundle, null, 2)
}

/**
 * Download a file to the user's device
 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Helper: group array by key
function groupBy<T, K extends string | number>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = keyFn(item)
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    },
    {} as Record<K, T[]>
  )
}
