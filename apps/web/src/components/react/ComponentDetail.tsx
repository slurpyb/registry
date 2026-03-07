import { useState, useEffect, useCallback } from "react";
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
  Code,
  ScrollArea,
  DataList,
} from "@radix-ui/themes";
import {
  PlusIcon,
  CheckIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  LockClosedIcon,
} from "@radix-ui/react-icons";

// Types
interface UseCase {
  targetUser: string;
  title: string;
  description: string;
}

interface PromptTemplate {
  title: string;
  scenario: string;
  prompt: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface ComponentData {
  name: string;
  type: string;
  description: string;
  domain?: string;
  subdomain?: string;
  specialty?: string;
  quality?: number;
  riskLevel?: string;
  tags: string[];
  icon?: string;
  author?: string;
  version?: string;
  license?: string;
  capabilities: string[];
  limitations: string[];
  useCases: UseCase[];
  promptTemplates: PromptTemplate[];
  bestPractices: string[];
  antiPatterns: string[];
  faq: FAQ[];
  supportedTools: string[];
  bundleHints: string[];
  securitySummary?: string;
  valueStatement?: string;
  userTitle?: string;
  sourceUrl?: string;
  sourceType?: string;
  dependencies: string[];
  safeToPublish?: boolean;
}

interface Props {
  component: ComponentData;
}

const typeColors: Record<string, "blue" | "green" | "purple" | "orange" | "pink" | "gray"> = {
  skill: "blue",
  agent: "green",
  plugin: "purple",
  command: "orange",
  bundle: "pink",
  profile: "gray",
};

const riskColors: Record<string, "green" | "yellow" | "orange" | "red" | "gray"> = {
  safe: "green",
  low: "green",
  medium: "yellow",
  high: "orange",
  critical: "red",
};

const defaultIcons: Record<string, string> = {
  skill: "\u{1F6E0}\u{FE0F}",
  plugin: "\u{1F50C}",
  agent: "\u{1F916}",
  command: "\u{26A1}",
  bundle: "\u{1F4E6}",
  profile: "\u{1F464}",
};

// Cart helpers (duplicated to avoid SSR import issues)
function getCart(): { name: string }[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("ocx-cart");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addToCartStorage(item: { name: string; type: string; description: string; icon?: string }) {
  const cart = getCart();
  if (cart.some((i) => i.name === item.name)) return;
  cart.push(item);
  localStorage.setItem("ocx-cart", JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

function QualityDots({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <Flex gap="1" align="center" title={`Quality: ${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Box
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: i <= rating ? "var(--amber-9)" : "var(--gray-4)",
          }}
        />
      ))}
      <Text size="1" color="gray" ml="1">
        {rating}/5
      </Text>
    </Flex>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box mb="5">
      <Heading size="4" mb="3">
        {title}
      </Heading>
      {children}
    </Box>
  );
}

export function ComponentDetail({ component: data }: Props) {
  return (
    <Theme accentColor="blue" grayColor="slate" radius="medium" appearance="light">
      {/* Back link */}
      <Button variant="ghost" size="2" mb="4" asChild>
        <a href="/browse">
          <ArrowLeftIcon /> Back to browse
        </a>
      </Button>

      {/* Header */}
      <Flex gap="4" align="start" mb="6" wrap="wrap">
        <Text size="8">{displayIcon}</Text>
        <Box style={{ flex: 1, minWidth: 200 }}>
          <Flex align="center" gap="3" wrap="wrap" mb="2">
            <Heading size="6">
              {data.userTitle || data.name}
            </Heading>
            <Badge size="2" variant="soft" color={typeColors[data.type] || "gray"}>
              {data.type}
            </Badge>
            {data.riskLevel && (
              <Badge size="2" variant="outline" color={riskColors[data.riskLevel] || "gray"}>
                {data.riskLevel} risk
              </Badge>
            )}
            <QualityDots rating={data.quality} />
          </Flex>

          {data.name !== data.userTitle && data.userTitle && (
            <Code size="2" color="gray" mb="1">
              {data.name}
            </Code>
          )}

          {(data.domain || data.subdomain) && (
            <Text size="2" color="gray" as="p">
              {data.domain}
              {data.subdomain && ` \u203A ${data.subdomain}`}
              {data.specialty && ` \u2022 ${data.specialty}`}
            </Text>
          )}

          {data.author && (
            <Text size="2" color="gray" as="p">
              By {data.author}
              {data.version && ` \u2022 v${data.version}`}
              {data.license && ` \u2022 ${data.license}`}
            </Text>
          )}
        </Box>

        <Button
          size="3"
          color={justAdded ? "green" : inCart ? "gray" : "blue"}
          variant={inCart && !justAdded ? "soft" : "solid"}
          onClick={handleAdd}
          disabled={inCart && !justAdded}
        >
          {justAdded ? (
            <><CheckIcon /> Added</>
          ) : inCart ? (
            <><CheckIcon /> In Cart</>
          ) : (
            <><PlusIcon /> Add to Cart</>
          )}
        </Button>
      </Flex>

      {/* Main content grid */}
      <Grid columns={{ initial: "1", md: "3" }} gap="6">
        {/* Left: main content */}
        <Box style={{ gridColumn: "span 2" }}>
          {/* Description */}
          <Section title="Description">
            <Text as="p" size="3" color="gray" style={{ lineHeight: 1.7 }}>
              {data.valueStatement || data.description}
            </Text>
          </Section>

          {/* Capabilities */}
          {hasContent(data.capabilities) && (
            <Section title="Capabilities">
              <Flex direction="column" gap="2">
                {data.capabilities.map((cap, i) => (
                  <Flex key={i} gap="2" align="start">
                    <Text color="green" style={{ flexShrink: 0 }}>{"\u2713"}</Text>
                    <Text size="2">{cap}</Text>
                  </Flex>
                ))}
              </Flex>
            </Section>
          )}

          {/* Limitations */}
          {hasContent(data.limitations) && (
            <Section title="Limitations">
              <Flex direction="column" gap="2">
                {data.limitations.map((lim, i) => (
                  <Flex key={i} gap="2" align="start">
                    <Text color="orange" style={{ flexShrink: 0 }}>{"\u26A0"}</Text>
                    <Text size="2">{lim}</Text>
                  </Flex>
                ))}
              </Flex>
            </Section>
          )}

          {/* Use Cases */}
          {hasContent(data.useCases) && (
            <Section title="Use Cases">
              <Flex direction="column" gap="3">
                {data.useCases.map((uc, i) => (
                  <Card key={i} variant="surface" size="2">
                    <Flex align="center" gap="2" mb="1">
                      {uc.targetUser && (
                        <Badge size="1" variant="outline" color="gray">
                          {uc.targetUser}
                        </Badge>
                      )}
                      <Text weight="bold" size="2">{uc.title}</Text>
                    </Flex>
                    <Text size="2" color="gray">{uc.description}</Text>
                  </Card>
                ))}
              </Flex>
            </Section>
          )}

          {/* Prompt Templates */}
          {hasContent(data.promptTemplates) && (
            <Section title="Prompt Templates">
              <Flex direction="column" gap="3">
                {data.promptTemplates.map((pt, i) => (
                  <Card key={i} variant="surface" size="2">
                    <Text weight="bold" size="2" mb="1" as="p">{pt.title}</Text>
                    <Text size="2" color="gray" mb="2" as="p">{pt.scenario}</Text>
                    <Code
                      size="2"
                      style={{
                        display: "block",
                        padding: "var(--space-3)",
                        background: "var(--gray-2)",
                        borderRadius: "var(--radius-2)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {pt.prompt}
                    </Code>
                  </Card>
                ))}
              </Flex>
            </Section>
          )}

          {/* Best Practices */}
          {hasContent(data.bestPractices) && (
            <Section title="Best Practices">
              <Flex direction="column" gap="2">
                {data.bestPractices.map((bp, i) => (
                  <Flex key={i} gap="2" align="start">
                    <Text color="blue" style={{ flexShrink: 0 }}>{"\u{1F4A1}"}</Text>
                    <Text size="2">{bp}</Text>
                  </Flex>
                ))}
              </Flex>
            </Section>
          )}

          {/* Anti-Patterns */}
          {hasContent(data.antiPatterns) && (
            <Section title="What NOT to Do">
              <Flex direction="column" gap="2">
                {data.antiPatterns.map((ap, i) => (
                  <Flex key={i} gap="2" align="start">
                    <Text color="red" style={{ flexShrink: 0 }}>{"\u2717"}</Text>
                    <Text size="2">{ap}</Text>
                  </Flex>
                ))}
              </Flex>
            </Section>
          )}

          {/* FAQ */}
          {hasContent(data.faq) && (
            <Section title="FAQ">
              <Flex direction="column" gap="4">
                {data.faq.map((item, i) => (
                  <Box key={i}>
                    <Text weight="bold" size="2" as="p" mb="1">
                      {item.question}
                    </Text>
                    <Text size="2" color="gray" as="p">
                      {item.answer}
                    </Text>
                  </Box>
                ))}
              </Flex>
            </Section>
          )}
        </Box>

        {/* Right: sidebar */}
        <Flex direction="column" gap="4">
          {/* Security */}
          {data.securitySummary && (
            <Card variant="surface" size="2">
              <Flex align="center" gap="2" mb="2">
                <LockClosedIcon />
                <Text weight="bold" size="2">Security</Text>
                {data.riskLevel && (
                  <Badge size="1" color={riskColors[data.riskLevel] || "gray"}>
                    {data.riskLevel}
                  </Badge>
                )}
              </Flex>
              <Text size="2" color="gray">{data.securitySummary}</Text>
            </Card>
          )}

          {/* Supported Tools */}
          {hasContent(data.supportedTools) && (
            <Card variant="surface" size="2">
              <Text weight="bold" size="2" mb="2" as="p">Supported Tools</Text>
              <Flex wrap="wrap" gap="2">
                {data.supportedTools.map((tool) => (
                  <Badge key={tool} size="1" variant="outline" color="gray">
                    {tool}
                  </Badge>
                ))}
              </Flex>
            </Card>
          )}

          {/* Tags */}
          {hasContent(data.tags) && (
            <Card variant="surface" size="2">
              <Text weight="bold" size="2" mb="2" as="p">Tags</Text>
              <Flex wrap="wrap" gap="2">
                {data.tags.map((tag) => (
                  <Badge key={tag} size="1" variant="soft" color="gray" asChild>
                    <a href={`/browse?q=${encodeURIComponent(tag)}`}>
                      {tag}
                    </a>
                  </Badge>
                ))}
              </Flex>
            </Card>
          )}

          {/* Bundle Hints */}
          {hasContent(data.bundleHints) && (
            <Card variant="surface" size="2">
              <Text weight="bold" size="2" mb="2" as="p">Often Bundled With</Text>
              <Flex wrap="wrap" gap="2">
                {data.bundleHints.map((hint) => (
                  <Badge key={hint} size="1" variant="outline" color="gray">
                    {hint}
                  </Badge>
                ))}
              </Flex>
            </Card>
          )}

          {/* Source */}
          {data.sourceUrl && (
            <Card variant="surface" size="2">
              <Text weight="bold" size="2" mb="2" as="p">Source</Text>
              <Button variant="ghost" size="1" asChild>
                <a
                  href={data.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ wordBreak: "break-all" }}
                >
                  <ExternalLinkIcon /> View source
                </a>
              </Button>
              {data.sourceType && (
                <Text size="1" color="gray" as="p" mt="1">
                  {data.sourceType}
                </Text>
              )}
            </Card>
          )}

          {/* Dependencies (for bundles) */}
          {hasContent(data.dependencies) && (
            <Card variant="surface" size="2">
              <Text weight="bold" size="2" mb="2" as="p">
                Dependencies ({data.dependencies.length})
              </Text>
              <ScrollArea style={{ maxHeight: 200 }} type="auto" scrollbars="vertical">
                <Flex direction="column" gap="1">
                  {data.dependencies.map((dep) => (
                    <Button key={dep} variant="ghost" size="1" asChild style={{ justifyContent: "flex-start" }}>
                      <a href={`/components/${dep}`}>{dep}</a>
                    </Button>
                  ))}
                </Flex>
              </ScrollArea>
            </Card>
          )}
        </Flex>
      </Grid>
    </Theme>
  );
}
