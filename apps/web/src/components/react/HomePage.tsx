import {
  Theme,
  Badge,
  Button,
  Flex,
  Text,
  Box,
  Card,
  Heading,
  Grid,
  Separator,
} from "@radix-ui/themes";
import {
  MagnifyingGlassIcon,
  CubeIcon,
  RocketIcon,
  DownloadIcon,
} from "@radix-ui/react-icons";

interface Stats {
  total: number;
  skills: number;
  agents: number;
  plugins: number;
  commands: number;
  bundles: number;
}

interface FeaturedComponent {
  name: string;
  type: string;
  description: string;
  icon?: string;
  domain?: string;
  quality?: number;
}

interface Props {
  stats: Stats;
  featured: FeaturedComponent[];
  domains: string[];
}

const typeColors: Record<string, "blue" | "green" | "purple" | "orange" | "pink" | "gray"> = {
  skill: "blue",
  agent: "green",
  plugin: "purple",
  command: "orange",
  bundle: "pink",
  profile: "gray",
};

const defaultIcons: Record<string, string> = {
  skill: "\u{1F6E0}\u{FE0F}",
  plugin: "\u{1F50C}",
  agent: "\u{1F916}",
  command: "\u{26A1}",
  bundle: "\u{1F4E6}",
  profile: "\u{1F464}",
};

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card variant="surface" size="2" style={{ textAlign: "center" }}>
      <Text size="6" weight="bold" style={{ color: `var(--${color}-11)` }} as="p">
        {value.toLocaleString()}
      </Text>
      <Text size="2" color="gray" as="p">
        {label}
      </Text>
    </Card>
  );
}

function QualityDots({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <Flex gap="1" align="center">
      {[1, 2, 3, 4, 5].map((i) => (
        <Box
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: i <= rating ? "var(--amber-9)" : "var(--gray-4)",
          }}
        />
      ))}
    </Flex>
  );
}

export function HomePage({ stats, featured, domains }: Props) {
  return (
    <Theme accentColor="blue" grayColor="slate" radius="medium" appearance="light">
      {/* Hero */}
      <Box py="9" style={{ textAlign: "center" }}>
        <Box style={{ maxWidth: 640, margin: "0 auto" }}>
          <Heading size="8" mb="3">
            AI Component Registry
          </Heading>
          <Text size="4" color="gray" as="p" mb="6">
            Browse {stats.total.toLocaleString()} components for AI coding assistants.
            Skills, plugins, agents, and more — all in one place.
          </Text>
          <Flex justify="center" gap="3" wrap="wrap">
            <Button size="3" asChild>
              <a href="/browse">
                <MagnifyingGlassIcon /> Browse Components
              </a>
            </Button>
            <Button size="3" variant="soft" asChild>
              <a href="/bundles">
                <CubeIcon /> View Bundles
              </a>
            </Button>
          </Flex>
        </Box>
      </Box>

      <Separator size="4" />

      {/* Stats */}
      <Box py="6">
        <Grid columns={{ initial: "2", sm: "3", md: "6" }} gap="4">
          <StatCard label="Total" value={stats.total} color="gray" />
          <StatCard label="Skills" value={stats.skills} color="blue" />
          <StatCard label="Agents" value={stats.agents} color="green" />
          <StatCard label="Plugins" value={stats.plugins} color="purple" />
          <StatCard label="Commands" value={stats.commands} color="orange" />
          <StatCard label="Bundles" value={stats.bundles} color="pink" />
        </Grid>
      </Box>

      <Separator size="4" />

      {/* Featured */}
      <Box py="7">
        <Flex justify="between" align="center" mb="4">
          <Heading size="5">Featured Components</Heading>
          <Button variant="ghost" size="2" asChild>
            <a href="/browse">View all →</a>
          </Button>
        </Flex>
        <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
          {featured.map((comp) => (
            <Card key={comp.name} size="2" asChild>
              <a
                href={`/components/${comp.name}`}
                style={{ textDecoration: "none", color: "inherit", display: "block" }}
              >
                <Flex gap="3" align="start">
                  <Text size="6">
                    {comp.icon || defaultIcons[comp.type] || "\u{1F4C4}"}
                  </Text>
                  <Box>
                    <Flex align="center" gap="2" mb="1">
                      <Text weight="bold" size="3">
                        {comp.name}
                      </Text>
                      <Badge
                        size="1"
                        variant="soft"
                        color={typeColors[comp.type] || "gray"}
                      >
                        {comp.type}
                      </Badge>
                    </Flex>
                    <Text size="2" color="gray" as="p" mb="2" style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {comp.description}
                    </Text>
                    <Flex gap="2" align="center">
                      {comp.domain && (
                        <Badge size="1" variant="outline" color="gray">
                          {comp.domain}
                        </Badge>
                      )}
                      <QualityDots rating={comp.quality} />
                    </Flex>
                  </Box>
                </Flex>
              </a>
            </Card>
          ))}
        </Grid>
      </Box>

      <Separator size="4" />

      {/* Domains */}
      <Box py="7">
        <Heading size="5" mb="4">
          Browse by Domain
        </Heading>
        <Flex wrap="wrap" gap="2">
          {domains.sort().map((domain) => (
            <Badge
              key={domain}
              size="2"
              variant="soft"
              color="gray"
              asChild
              style={{ cursor: "pointer" }}
            >
              <a href={`/browse?domain=${encodeURIComponent(domain)}`}>
                {domain}
              </a>
            </Badge>
          ))}
        </Flex>
      </Box>

      <Separator size="4" />

      {/* How it works */}
      <Box py="7">
        <Heading size="5" mb="6" style={{ textAlign: "center" }}>
          How It Works
        </Heading>
        <Grid columns={{ initial: "1", md: "3" }} gap="6" style={{ maxWidth: 800, margin: "0 auto" }}>
          <Card variant="ghost" style={{ textAlign: "center" }}>
            <Flex direction="column" align="center" gap="2">
              <MagnifyingGlassIcon width={32} height={32} />
              <Heading size="3">1. Browse</Heading>
              <Text size="2" color="gray">
                Search and filter through thousands of components by type, domain, quality, or risk.
              </Text>
            </Flex>
          </Card>
          <Card variant="ghost" style={{ textAlign: "center" }}>
            <Flex direction="column" align="center" gap="2">
              <RocketIcon width={32} height={32} />
              <Heading size="3">2. Add to Cart</Heading>
              <Text size="2" color="gray">
                Click to add components to your cart, or add an entire bundle for a complete workflow.
              </Text>
            </Flex>
          </Card>
          <Card variant="ghost" style={{ textAlign: "center" }}>
            <Flex direction="column" align="center" gap="2">
              <DownloadIcon width={32} height={32} />
              <Heading size="3">3. Export</Heading>
              <Text size="2" color="gray">
                Configure your profile settings and export an installable ocx.jsonc file.
              </Text>
            </Flex>
          </Card>
        </Grid>
      </Box>
    </Theme>
  );
}
