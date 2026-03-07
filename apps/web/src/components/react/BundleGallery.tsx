import { useState, useEffect, useCallback } from "react";
import {
  Theme,
  Table,
  Badge,
  Button,
  Flex,
  Text,
  Box,
  Card,
  Heading,
  ScrollArea,
} from "@radix-ui/themes";
import {
  PlusIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";

interface Bundle {
  name: string;
  description: string;
  dependencies: string[];
}

interface Props {
  bundles: Bundle[];
}

// Local storage helpers
function getCart(): { name: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("ocx-cart");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addManyToCart(items: { name: string; type: string; description: string }[]) {
  const cart = getCart();
  const existingNames = new Set(cart.map((i) => i.name));
  const newItems = items.filter((i) => !existingNames.has(i.name));
  const updated = [...cart, ...newItems];
  localStorage.setItem("ocx-cart", JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

export function BundleGallery({ bundles }: Props) {
  const [cart, setCart] = useState<Set<string>>(new Set());
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());
  const [addedBundles, setAddedBundles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateCart = () => {
      const items = getCart();
      setCart(new Set(items.map((i) => i.name)));
    };
    updateCart();
    window.addEventListener("cart-updated", updateCart);
    window.addEventListener("storage", updateCart);
    return () => {
      window.removeEventListener("cart-updated", updateCart);
      window.removeEventListener("storage", updateCart);
    };
  }, []);

  const toggleExpand = useCallback((name: string) => {
    setExpandedBundles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  const addBundle = useCallback((bundle: Bundle) => {
    const items = bundle.dependencies.map((name) => ({
      name,
      type: "skill",
      description: "",
    }));
    addManyToCart(items);
    setAddedBundles((prev) => new Set(prev).add(bundle.name));
    setTimeout(() => {
      setAddedBundles((prev) => {
        const next = new Set(prev);
        next.delete(bundle.name);
        return next;
      });
    }, 2000);
  }, []);

  // Count how many dependencies are already in cart
  const countInCart = (deps: string[]) => deps.filter((d) => cart.has(d)).length;

  return (
    <Theme accentColor="blue" grayColor="slate" radius="medium" appearance="light">
      <Box>
        <Heading size="6" mb="2">
          Bundles
        </Heading>
        <Text color="gray" mb="6">
          Curated collections of components for common workflows. Add an entire bundle to
          get everything you need.
        </Text>

        <Flex direction="column" gap="4">
          {bundles.map((bundle) => {
            const isExpanded = expandedBundles.has(bundle.name);
            const justAdded = addedBundles.has(bundle.name);
            const inCartCount = countInCart(bundle.dependencies);
            const allInCart = inCartCount === bundle.dependencies.length;

            return (
              <Card key={bundle.name} size="2">
                <Flex justify="between" align="start" gap="4">
                  <Box flexGrow="1">
                    <Flex align="center" gap="2" mb="1">
                      <Text size="4">📦</Text>
                      <Heading size="4">{bundle.name}</Heading>
                      <Badge variant="soft" color="purple">
                        {bundle.dependencies.length} components
                      </Badge>
                      {inCartCount > 0 && (
                        <Badge variant="outline" color="green">
                          {inCartCount} in cart
                        </Badge>
                      )}
                    </Flex>
                    <Text color="gray" size="2">
                      {bundle.description}
                    </Text>
                  </Box>

                  <Button
                    color={justAdded ? "green" : allInCart ? "gray" : "blue"}
                    variant={allInCart ? "soft" : "solid"}
                    onClick={() => addBundle(bundle)}
                    disabled={allInCart}
                  >
                    {justAdded ? (
                      <>
                        <CheckIcon /> Added
                      </>
                    ) : allInCart ? (
                      <>
                        <CheckIcon /> All in cart
                      </>
                    ) : (
                      <>
                        <PlusIcon /> Add All
                      </>
                    )}
                  </Button>
                </Flex>

                <Box mt="3">
                  <Button
                    variant="ghost"
                    size="1"
                    onClick={() => toggleExpand(bundle.name)}
                  >
                    {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    {isExpanded ? "Hide" : "Show"} components
                  </Button>

                  {isExpanded && (
                    <ScrollArea
                      style={{ maxHeight: 200 }}
                      mt="2"
                      type="auto"
                      scrollbars="vertical"
                    >
                      <Box p="2" style={{ background: "var(--gray-2)", borderRadius: 8 }}>
                        <Flex wrap="wrap" gap="2">
                          {bundle.dependencies.map((dep) => {
                            const inCart = cart.has(dep);
                            return (
                              <Badge
                                key={dep}
                                variant={inCart ? "solid" : "outline"}
                                color={inCart ? "green" : "gray"}
                                size="1"
                                asChild
                              >
                                <a href={`/components/${dep}`}>
                                  {inCart && <CheckIcon width={10} height={10} />}
                                  {dep}
                                </a>
                              </Badge>
                            );
                          })}
                        </Flex>
                      </Box>
                    </ScrollArea>
                  )}
                </Box>
              </Card>
            );
          })}
        </Flex>

        {bundles.length === 0 && (
          <Card>
            <Flex direction="column" align="center" py="9">
              <Text color="gray" size="4">
                No bundles available yet.
              </Text>
            </Flex>
          </Card>
        )}
      </Box>
    </Theme>
  );
}
