import { useState, useMemo, useCallback, Dispatch, SetStateAction } from "react";
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
  Tooltip,
  Dialog,
  ScrollArea,
  Heading,
  Card,
  Separator,
} from "@radix-ui/themes";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CheckIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Cross2Icon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";

// Types
interface Component {
  name: string;
  type: string;
  description: string;
  domain?: string;
  subdomain?: string;
  quality?: number;
  riskLevel?: string;
  tags: string[];
  icon?: string;
  author?: string;
  capabilities: string[];
  safeToPublish?: boolean;
}

interface Props {
  components: Component[];
  initialFilters?: {
    type?: string;
    domain?: string;
    quality?: number;
    risk?: string;
    q?: string;
  };
}

type SortField = "name" | "type" | "domain" | "quality" | "riskLevel";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 50;

const TYPE_COLORS: Record<string, "blue" | "green" | "orange" | "purple" | "red"> = {
  skill: "blue",
  plugin: "green",
  agent: "purple",
  command: "orange",
  bundle: "red",
};

const RISK_COLORS: Record<string, "green" | "yellow" | "orange" | "red"> = {
  safe: "green",
  low: "green",
  medium: "yellow",
  high: "orange",
  critical: "red",
};

function QualityStars({ quality }: { quality?: number }) {
  if (!quality) return <Text color="gray">-</Text>;
  return (
    <Flex gap="0" align="center">
      {[1, 2, 3, 4, 5].map((n) => (
        <Text key={n} size="1" color={n <= quality ? "yellow" : "gray"}>
          {n <= quality ? "★" : "☆"}
        </Text>
      ))}
    </Flex>
  );
}

function RiskBadge({ risk }: { risk?: string }) {
  if (!risk) return <Text color="gray">-</Text>;
  const color = RISK_COLORS[risk] || "gray";
  return (
    <Badge color={color} variant="soft" size="1">
      {risk}
    </Badge>
  );
}

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSectionProps {
  title: string;
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterSection({ title, options, selected, onToggle }: FilterSectionProps) {
  if (!options.length) return null;
  return (
    <Box>
      <Flex justify="between" align="center" mb="2">
        <Text weight="medium">{title}</Text>
        {selected.length > 0 && (
          <Text size="1" color="gray">
            {selected.length}/{options.length}
          </Text>
        )}
      </Flex>
      <Flex direction="column" gap="1">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 text-sm text-base-600 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
              className="w-3 h-3 rounded border-base-200 text-blue-600 focus:ring-1 focus:ring-blue-500"
            />
            <Text size="2">{option.label}</Text>
          </label>
        ))}
      </Flex>
    </Box>
  );
}

export function RegistryBrowser({ components, initialFilters = {} }: Props) {
  // State
  const [search, setSearch] = useState(initialFilters.q || "");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialFilters.type ? [initialFilters.type] : []
  );
  const [selectedDomains, setSelectedDomains] = useState<string[]>(
    initialFilters.domain ? [initialFilters.domain] : []
  );
  const [selectedQualities, setSelectedQualities] = useState<string[]>(
    initialFilters.quality ? [initialFilters.quality.toString()] : []
  );
  const [selectedRisks, setSelectedRisks] = useState<string[]>(
    initialFilters.risk ? [initialFilters.risk] : []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("ocx-cart");
      if (stored) {
        const items = JSON.parse(stored) as { name: string }[];
        return new Set(items.map((i) => i.name));
      }
    } catch {}
    return new Set();
  });
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Derived data
  const types = useMemo(() => [...new Set(components.map((c) => c.type))].sort(), [components]);
  const domains = useMemo(
    () => [...new Set(components.map((c) => c.domain).filter(Boolean))].sort() as string[],
    [components]
  );
  const tags = useMemo(() => {
    const unique = new Set<string>();
    components.forEach((component) => {
      component.tags.forEach((tag) => {
        unique.add(tag);
      });
    });
    return [...unique].sort((a, b) => a.localeCompare(b));
  }, [components]);
  const authors = useMemo(
    () =>
      [...new Set(components.map((c) => c.author).filter(Boolean))].sort((a, b) => a.localeCompare(b)) as string[],
    [components]
  );
  const riskLevels = useMemo(() => {
    const all = [...new Set(components.map((c) => c.riskLevel).filter(Boolean))] as string[];
    const priority = ["critical", "high", "medium", "low", "safe"];
    const ordered = priority.filter((level) => all.includes(level));
    const rest = all.filter((level) => !priority.includes(level)).sort();
    return [...ordered, ...rest];
  }, [components]);
  const qualityRatings = useMemo(
    () =>
      [...new Set(components.map((c) => c.quality).filter((quality): quality is number => typeof quality === "number"))]
        .sort((a, b) => b - a),
    [components]
  );

  const typeOptions = useMemo(
    () => types.map((type) => ({ value: type, label: type })),
    [types]
  );
  const domainOptions = useMemo(
    () => domains.map((domain) => ({ value: domain, label: domain })),
    [domains]
  );
  const tagOptions = useMemo(() => tags.map((tag) => ({ value: tag, label: tag })), [tags]);
  const authorOptions = useMemo(() => authors.map((author) => ({ value: author, label: author })), [authors]);
  const riskOptions = useMemo(() => riskLevels.map((risk) => ({ value: risk, label: risk })), [riskLevels]);
  const qualityOptions = useMemo(
    () =>
      qualityRatings.map((rating) => ({
        value: rating.toString(),
        label: `${rating} star${rating === 1 ? "" : "s"}`,
      })),
    [qualityRatings]
  );

  const toggleSelection = useCallback(
    (value: string, setter: Dispatch<SetStateAction<string[]>>) => {
      setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
      setPage(1);
    },
    [setPage]
  );

  // Filter and sort
  const filtered = useMemo(() => {
    let result = components;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedTypes.length > 0) {
      result = result.filter((c) => selectedTypes.includes(c.type));
    }

    if (selectedDomains.length > 0) {
      result = result.filter((c) => c.domain && selectedDomains.includes(c.domain));
    }

    if (selectedQualities.length > 0) {
      const qualityNumbers = selectedQualities.map((value) => parseInt(value, 10));
      result = result.filter((c) => qualityNumbers.includes(c.quality || 0));
    }

    if (selectedRisks.length > 0) {
      result = result.filter((c) => c.riskLevel && selectedRisks.includes(c.riskLevel));
    }

    if (selectedTags.length > 0) {
      result = result.filter((c) => c.tags.some((tag) => selectedTags.includes(tag)));
    }

    if (selectedAuthors.length > 0) {
      result = result.filter((c) => c.author && selectedAuthors.includes(c.author));
    }

    result = [...result].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      switch (sortField) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "domain":
          aVal = a.domain || "";
          bVal = b.domain || "";
          break;
        case "quality":
          aVal = a.quality || 0;
          bVal = b.quality || 0;
          break;
        case "riskLevel":
          aVal = a.riskLevel || "";
          bVal = b.riskLevel || "";
          break;
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [
    components,
    search,
    selectedTypes,
    selectedDomains,
    selectedQualities,
    selectedRisks,
    selectedTags,
    selectedAuthors,
    sortField,
    sortDir,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const addToCart = useCallback((component: Component) => {
    setCart((prev) => {
      const next = new Set(prev);
      next.add(component.name);
      try {
        const stored = localStorage.getItem("ocx-cart");
        const items = stored ? JSON.parse(stored) : [];
        if (!items.some((i: { name: string }) => i.name === component.name)) {
          items.push({
            name: component.name,
            type: component.type,
            description: component.description,
            icon: component.icon,
          });
          localStorage.setItem("ocx-cart", JSON.stringify(items));
          window.dispatchEvent(new CustomEvent("cart-updated"));
        }
      } catch {}
      return next;
    });
  }, []);

  const removeFromCart = useCallback((name: string) => {
    setCart((prev) => {
      const next = new Set(prev);
      next.delete(name);
      try {
        const stored = localStorage.getItem("ocx-cart");
        const items = stored ? JSON.parse(stored) : [];
        const filteredItems = items.filter((i: { name: string }) => i.name !== name);
        localStorage.setItem("ocx-cart", JSON.stringify(filteredItems));
        window.dispatchEvent(new CustomEvent("cart-updated"));
      } catch {}
      return next;
    });
  }, []);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUpIcon width={12} height={12} />
    ) : (
      <ChevronDownIcon width={12} height={12} />
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedTypes([]);
    setSelectedDomains([]);
    setSelectedQualities([]);
    setSelectedRisks([]);
    setSelectedTags([]);
    setSelectedAuthors([]);
    setPage(1);
  };

  const hasFilters =
    Boolean(search) ||
    selectedTypes.length > 0 ||
    selectedDomains.length > 0 ||
    selectedQualities.length > 0 ||
    selectedRisks.length > 0 ||
    selectedTags.length > 0 ||
    selectedAuthors.length > 0;

  return (
    <Theme accentColor="blue" grayColor="slate" radius="medium" appearance="light">
      <Box>
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center" wrap="wrap" gap="2">
            <Heading size="5">Component Registry</Heading>
            <Text size="2" color="gray">
              {filtered.length.toLocaleString()} components
            </Text>
          </Flex>
          <Flex justify="end" className="lg:hidden">
            <Button variant="outline" size="1" onClick={() => setSidebarOpen((prev) => !prev)}>
              {sidebarOpen ? "Hide filters" : "Show filters"}
            </Button>
          </Flex>
          <Flex direction={{ initial: "column", lg: "row" }} gap="6">
            <Card
              size="2"
              className={`w-full lg:w-72 ${sidebarOpen ? "" : "hidden"} lg:block`}
            >
              <Flex direction="column" gap="4">
                <Heading size="5">Filters</Heading>
                <Text size="1" color="gray">
                  Refine by type, domain, quality, risk, tags, and authors.
                </Text>
                <TextField.Root
                  placeholder="Search components..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  size="2"
                >
                  <TextField.Slot>
                    <MagnifyingGlassIcon height="16" width="16" />
                  </TextField.Slot>
                  {search && (
                    <TextField.Slot>
                      <IconButton size="1" variant="ghost" onClick={() => setSearch("") }>
                        <Cross2Icon height="14" width="14" />
                      </IconButton>
                    </TextField.Slot>
                  )}
                </TextField.Root>
                {hasFilters && (
                  <Button variant="outline" size="1" onClick={clearFilters}>
                    <Cross2Icon /> Clear filters
                  </Button>
                )}
                <FilterSection
                  title="Type"
                  options={typeOptions}
                  selected={selectedTypes}
                  onToggle={(value) => toggleSelection(value, setSelectedTypes)}
                />
                <FilterSection
                  title="Domain"
                  options={domainOptions}
                  selected={selectedDomains}
                  onToggle={(value) => toggleSelection(value, setSelectedDomains)}
                />
                <FilterSection
                  title="Quality"
                  options={qualityOptions}
                  selected={selectedQualities}
                  onToggle={(value) => toggleSelection(value, setSelectedQualities)}
                />
                <FilterSection
                  title="Risk"
                  options={riskOptions}
                  selected={selectedRisks}
                  onToggle={(value) => toggleSelection(value, setSelectedRisks)}
                />
                <FilterSection
                  title="Tags"
                  options={tagOptions}
                  selected={selectedTags}
                  onToggle={(value) => toggleSelection(value, setSelectedTags)}
                />
                <FilterSection
                  title="Authors"
                  options={authorOptions}
                  selected={selectedAuthors}
                  onToggle={(value) => toggleSelection(value, setSelectedAuthors)}
                />
              </Flex>
            </Card>
            <Box flexGrow="1">
              <Flex justify="between" align="center" mb="3">
                <Text size="2" color="gray">
                  Showing {paginated.length.toLocaleString()} of {filtered.length.toLocaleString()} components
                </Text>
                <Text size="2" color="gray">
                  Page {totalPages > 0 ? page : 0} of {totalPages || 1}
                </Text>
              </Flex>
              <Card>
                <ScrollArea scrollbars="horizontal">
                  <Table.Root size="2">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleSort("name")}
                        >
                          <Flex align="center" gap="1">
                            Name <SortIcon field="name" />
                          </Flex>
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleSort("type")}
                        >
                          <Flex align="center" gap="1">
                            Type <SortIcon field="type" />
                          </Flex>
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleSort("domain")}
                        >
                          <Flex align="center" gap="1">
                            Domain <SortIcon field="domain" />
                          </Flex>
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleSort("quality")}
                        >
                          <Flex align="center" gap="1">
                            Quality <SortIcon field="quality" />
                          </Flex>
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleSort("riskLevel")}
                        >
                          <Flex align="center" gap="1">
                            Risk <SortIcon field="riskLevel" />
                          </Flex>
                        </Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ width: 80 }}></Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {paginated.map((c) => {
                        const inCart = cart.has(c.name);
                        const snippet =
                          c.description.length > 200
                            ? `${c.description.slice(0, 200).trim()}…`
                            : c.description;
                        return (
                          <Table.Row key={c.name}>
                            <Table.Cell>
                              <Flex direction="column" gap="1">
                                <Text
                                  weight="medium"
                                  style={{ cursor: "pointer" }}
                                  onClick={() => setSelectedComponent(c)}
                                  className="hover:underline"
                                >
                                  {c.name}
                                </Text>
                                {c.author && (
                                  <Text size="1" color="gray">
                                    by {c.author}
                                  </Text>
                                )}
                                <Text
                                  size="2"
                                  color="gray"
                                  as="p"
                                  style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {snippet}
                                </Text>
                              </Flex>
                            </Table.Cell>
                            <Table.Cell>
                              <Badge color={TYPE_COLORS[c.type] || "gray"} variant="soft">
                                {c.type}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              <Text size="2" color="gray">
                                {c.domain || "-"}
                                {c.subdomain && ` › ${c.subdomain}`}
                              </Text>
                            </Table.Cell>
                            <Table.Cell>
                              <QualityStars quality={c.quality} />
                            </Table.Cell>
                            <Table.Cell>
                              <RiskBadge risk={c.riskLevel} />
                            </Table.Cell>
                            <Table.Cell>
                              <Flex gap="2">
                                <Tooltip content="View details">
                                  <IconButton
                                    size="1"
                                    variant="ghost"
                                    onClick={() => setSelectedComponent(c)}
                                  >
                                    <InfoCircledIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip content={inCart ? "In cart" : "Add to cart"}>
                                  <IconButton
                                    size="1"
                                    variant={inCart ? "solid" : "soft"}
                                    color={inCart ? "green" : "blue"}
                                    onClick={() =>
                                      inCart ? removeFromCart(c.name) : addToCart(c)
                                    }
                                  >
                                    {inCart ? <CheckIcon /> : <PlusIcon />}
                                  </IconButton>
                                </Tooltip>
                              </Flex>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Root>
                </ScrollArea>
                {totalPages > 1 && (
                  <Flex justify="between" align="center" mt="4" px="2">
                    <Text size="2" color="gray">
                      Page {page} of {totalPages}
                    </Text>
                    <Flex gap="2">
                      <Button variant="soft" size="1" disabled={page === 1} onClick={() => setPage(1)}>
                        First
                      </Button>
                      <Button
                        variant="soft"
                        size="1"
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="soft"
                        size="1"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                      <Button
                        variant="soft"
                        size="1"
                        disabled={page === totalPages}
                        onClick={() => setPage(totalPages)}
                      >
                        Last
                      </Button>
                    </Flex>
                  </Flex>
                )}
              </Card>
            </Box>
          </Flex>
        </Flex>
      </Box>
      {/* Detail Dialog */}
      <Dialog.Root open={!!selectedComponent} onOpenChange={(open) => !open && setSelectedComponent(null)}>
        <Dialog.Content maxWidth="600px">
          {selectedComponent && (
            <>
              <Dialog.Title>
                <Flex align="center" gap="2">
                  <Text size="5">{selectedComponent.icon || "📦"}</Text>
                  {selectedComponent.name}
                </Flex>
              </Dialog.Title>
              <Dialog.Description size="2" color="gray">
                {selectedComponent.description}
              </Dialog.Description>

              <Separator my="3" size="4" />

              <Flex direction="column" gap="3">
                <Flex gap="2" wrap="wrap">
                  <Badge color={TYPE_COLORS[selectedComponent.type] || "gray"}>
                    {selectedComponent.type}
                  </Badge>
                  {selectedComponent.domain && (
                    <Badge variant="outline">
                      {selectedComponent.domain}
                      {selectedComponent.subdomain && ` › ${selectedComponent.subdomain}`}
                    </Badge>
                  )}
                  <QualityStars quality={selectedComponent.quality} />
                  <RiskBadge risk={selectedComponent.riskLevel} />
                </Flex>

                {selectedComponent.capabilities.length > 0 && (
                  <Box>
                    <Text size="2" weight="medium" mb="1">
                      Capabilities
                    </Text>
                    <Flex gap="1" wrap="wrap">
                      {selectedComponent.capabilities.map((cap) => (
                        <Badge key={cap} variant="soft" size="1">
                          {cap}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}

                {selectedComponent.tags.length > 0 && (
                  <Box>
                    <Text size="2" weight="medium" mb="1">
                      Tags
                    </Text>
                    <Flex gap="1" wrap="wrap">
                      {selectedComponent.tags.map((tag) => (
                        <Badge key={tag} variant="outline" size="1">
                          {tag}
                        </Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
              </Flex>

              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray">
                    Close
                  </Button>
                </Dialog.Close>
                <Button asChild>
                  <a href={`/components/${selectedComponent.name}`}>View Full Details</a>
                </Button>
                <Button
                  color={cart.has(selectedComponent.name) ? "green" : "blue"}
                  onClick={() =>
                    cart.has(selectedComponent.name)
                      ? removeFromCart(selectedComponent.name)
                      : addToCart(selectedComponent)
                  }
                >
                  {cart.has(selectedComponent.name) ? (
                    <>
                      <CheckIcon /> In Cart
                    </>
                  ) : (
                    <>
                      <PlusIcon /> Add to Cart
                    </>
                  )}
                </Button>
              </Flex>
            </>
          )}
        </Dialog.Content>
      </Dialog.Root>
    </Theme>
  );
}
