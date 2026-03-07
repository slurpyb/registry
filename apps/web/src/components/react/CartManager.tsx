import { useState, useEffect, useCallback } from "react";
import {
  Theme,
  Table,
  TextField,
  Badge,
  Button,
  Flex,
  Text,
  Box,
  IconButton,
  Card,
  Heading,
  Separator,
  AlertDialog,
} from "@radix-ui/themes";
import {
  TrashIcon,
  DownloadIcon,
  Cross2Icon,
  ExternalLinkIcon,
} from "@radix-ui/react-icons";

// Types matching cart.ts
interface CartItem {
  name: string;
  type: "skill" | "plugin" | "agent" | "command" | "bundle" | "profile";
  description: string;
  icon?: string;
}

interface ProfileConfig {
  name: string;
  model?: string;
  smallModel?: string;
  registryUrl: string;
}

const TYPE_COLORS: Record<string, "blue" | "green" | "orange" | "purple" | "red"> = {
  skill: "blue",
  plugin: "green",
  agent: "purple",
  command: "orange",
  bundle: "red",
};

const TYPE_ICONS: Record<string, string> = {
  skill: "🛠️",
  plugin: "🔌",
  agent: "🤖",
  command: "⚡",
  bundle: "📦",
  profile: "👤",
};

// Local storage helpers
function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("ocx-cart");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem("ocx-cart", JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

function getProfileConfig(): ProfileConfig {
  if (typeof window === "undefined") {
    return { name: "my-profile", registryUrl: "https://registry.slurpyb.workers.dev" };
  }
  try {
    const stored = localStorage.getItem("ocx-profile-config");
    return stored
      ? JSON.parse(stored)
      : { name: "my-profile", registryUrl: "https://registry.slurpyb.workers.dev" };
  } catch {
    return { name: "my-profile", registryUrl: "https://registry.slurpyb.workers.dev" };
  }
}

function saveProfileConfig(config: ProfileConfig) {
  localStorage.setItem("ocx-profile-config", JSON.stringify(config));
}

// Export helpers
function buildProfileConfig(config: ProfileConfig, cart: CartItem[]): string {
  const byType = cart.reduce(
    (acc, item) => {
      const key = `${item.type}s` as keyof typeof acc;
      if (!acc[key]) acc[key] = [];
      (acc[key] as string[]).push(item.name);
      return acc;
    },
    { skills: [], plugins: [], agents: [], commands: [] } as Record<string, string[]>
  );

  const profile: Record<string, unknown> = {
    $schema: "https://ocx.kdco.dev/schema.json",
    name: config.name,
    extends: config.registryUrl,
  };

  if (config.model) profile.model = config.model;
  if (config.smallModel) profile.smallModel = config.smallModel;

  if (byType.skills.length) profile.skills = byType.skills;
  if (byType.plugins.length) profile.plugins = byType.plugins;
  if (byType.agents.length) profile.agents = byType.agents;
  if (byType.commands.length) profile.commands = byType.commands;

  return JSON.stringify(profile, null, 2);
}

function buildBundleManifest(cart: CartItem[], name: string): string {
  return JSON.stringify(
    {
      name,
      description: `Custom bundle with ${cart.length} components`,
      dependencies: cart.map((item) => item.name),
    },
    null,
    2
  );
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CartManager() {
  const appearance = useThemeAppearance();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [config, setConfig] = useState<ProfileConfig>({
    name: "my-profile",
    registryUrl: "https://registry.slurpyb.workers.dev",
  });
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Load initial state
  useEffect(() => {
    setCart(getCart());
    setConfig(getProfileConfig());

    // Listen for external updates
    const handler = () => setCart(getCart());
    window.addEventListener("cart-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("cart-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const removeItem = useCallback((name: string) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.name !== name);
      saveCart(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setCart([]);
    saveCart([]);
    setClearDialogOpen(false);
  }, []);

  const updateConfig = useCallback((updates: Partial<ProfileConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      saveProfileConfig(next);
      return next;
    });
  }, []);

  const exportProfile = useCallback(() => {
    const content = buildProfileConfig(config, cart);
    downloadFile(content, `${config.name}.jsonc`);
  }, [config, cart]);

  const exportBundle = useCallback(() => {
    const content = buildBundleManifest(cart, config.name);
    downloadFile(content, `${config.name}-bundle.json`);
  }, [cart, config.name]);

  // Group items by type
  const byType = cart.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, CartItem[]>
  );

  return (
    <Theme accentColor="blue" grayColor="slate" radius="medium" appearance="light">
      <Flex gap="6" direction={{ initial: "column", md: "row" }}>
        {/* Cart Items */}
        <Box flexGrow="1" style={{ minWidth: 0 }}>
          <Heading size="5" mb="4">
            Your Cart
          </Heading>

          {cart.length === 0 ? (
            <Card>
              <Flex direction="column" align="center" py="9" gap="3">
                <Text color="gray" size="4">
                  Your cart is empty
                </Text>
                <Button asChild variant="soft">
                  <a href="/browse">
                    Browse components <ExternalLinkIcon />
                  </a>
                </Button>
              </Flex>
            </Card>
          ) : (
            <Flex direction="column" gap="4">
              {Object.entries(byType).map(([type, items]) => (
                <Card key={type}>
                  <Flex justify="between" align="center" mb="3">
                    <Heading size="3">
                      {TYPE_ICONS[type]} {type}s
                    </Heading>
                    <Badge variant="soft">{items.length}</Badge>
                  </Flex>
                  <Table.Root size="1">
                    <Table.Body>
                      {items.map((item) => (
                        <Table.Row key={item.name}>
                          <Table.Cell style={{ width: 40 }}>
                            <Text size="3">{item.icon || TYPE_ICONS[item.type]}</Text>
                          </Table.Cell>
                          <Table.Cell>
                            <Flex direction="column" gap="0">
                              <Text
                                weight="medium"
                                asChild
                                style={{ cursor: "pointer" }}
                              >
                                <a
                                  href={`/components/${item.name}`}
                                  className="hover:underline"
                                >
                                  {item.name}
                                </a>
                              </Text>
                              <Text size="1" color="gray" truncate>
                                {item.description.slice(0, 80)}
                                {item.description.length > 80 && "..."}
                              </Text>
                            </Flex>
                          </Table.Cell>
                          <Table.Cell style={{ width: 40 }}>
                            <IconButton
                              size="1"
                              variant="ghost"
                              color="red"
                              onClick={() => removeItem(item.name)}
                            >
                              <Cross2Icon />
                            </IconButton>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Card>
              ))}
            </Flex>
          )}
        </Box>

        {/* Config Panel */}
        <Box style={{ width: 320, flexShrink: 0 }}>
          <Card>
            <Heading size="4" mb="4">
              Profile Configuration
            </Heading>

            <Flex direction="column" gap="3">
              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Profile Name
                </Text>
                <TextField.Root
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  placeholder="my-profile"
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Model (optional)
                </Text>
                <TextField.Root
                  value={config.model || ""}
                  onChange={(e) => updateConfig({ model: e.target.value || undefined })}
                  placeholder="claude-sonnet-4"
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Small Model (optional)
                </Text>
                <TextField.Root
                  value={config.smallModel || ""}
                  onChange={(e) =>
                    updateConfig({ smallModel: e.target.value || undefined })
                  }
                  placeholder="claude-haiku-4"
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="medium" mb="1">
                  Registry URL
                </Text>
                <TextField.Root
                  value={config.registryUrl}
                  onChange={(e) => updateConfig({ registryUrl: e.target.value })}
                  placeholder="https://registry.slurpyb.workers.dev"
                />
              </Box>
            </Flex>

            <Separator my="4" size="4" />

            <Flex direction="column" gap="2">
              <Button onClick={exportProfile} disabled={cart.length === 0}>
                <DownloadIcon /> Export Profile (ocx.jsonc)
              </Button>
              <Button variant="soft" onClick={exportBundle} disabled={cart.length === 0}>
                <DownloadIcon /> Export Bundle Manifest
              </Button>

              <AlertDialog.Root open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <AlertDialog.Trigger>
                  <Button variant="ghost" color="red" disabled={cart.length === 0}>
                    <TrashIcon /> Clear Cart
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Content>
                  <AlertDialog.Title>Clear Cart</AlertDialog.Title>
                  <AlertDialog.Description>
                    Are you sure you want to remove all {cart.length} items from your cart?
                  </AlertDialog.Description>
                  <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                      <Button variant="soft" color="gray">
                        Cancel
                      </Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                      <Button color="red" onClick={clearAll}>
                        Clear All
                      </Button>
                    </AlertDialog.Action>
                  </Flex>
                </AlertDialog.Content>
              </AlertDialog.Root>
            </Flex>

            <Separator my="4" size="4" />

            <Text size="2" color="gray">
              {cart.length} component{cart.length !== 1 && "s"} in cart
            </Text>
          </Card>
        </Box>
      </Flex>
    </Theme>
  );
}
