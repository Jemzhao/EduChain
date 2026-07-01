import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];

function walk(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);
    const relativePath = relative(root, absolute);
    if (
      relativePath
        .split(sep)
        .some((part) => ["node_modules", ".next", "target", ".venv", ".intlayer"].includes(part))
    )
      continue;
    const stats = statSync(absolute);
    if (stats.isDirectory()) files.push(...walk(absolute, predicate));
    else if (predicate(absolute)) files.push(absolute);
  }
  return files;
}

function source(absolute) {
  return readFileSync(absolute, "utf8");
}

function lines(absolute) {
  const content = source(absolute);
  if (content.length === 0) return 0;
  const count = content.split(/\r?\n/).length;
  return content.endsWith("\n") ? count - 1 : count;
}

function fail(message, absolute) {
  failures.push(absolute ? `${message}: ${relative(root, absolute)}` : message);
}

for (const forbidden of [
  "archive",
  "archives",
  "packages/api-contract/generated/schema.d.ts",
  "packages/api-contract/src/generated/api.d.ts",
]) {
  if (existsSync(join(root, forbidden))) fail(`forbidden project artifact exists (${forbidden})`);
}

for (const required of [
  "LICENSE",
  "NOTICE",
  "README.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "SUPPORT.md",
  "CHANGELOG.md",
  ".gitignore",
  ".github/workflows/ci.yml",
  ".github/PULL_REQUEST_TEMPLATE.md",
]) {
  if (!existsSync(join(root, required))) fail(`required repository file is missing (${required})`);
}

const ciWorkflow = join(root, ".github/workflows/ci.yml");
if (existsSync(ciWorkflow)) {
  for (const match of source(ciWorkflow).matchAll(/^\s*uses:\s*([^\s#]+)/gm)) {
    if (!/@[a-f0-9]{40}$/.test(match[1])) {
      fail(`CI action is not pinned to a full commit (${match[1]})`, ciWorkflow);
    }
  }
}

const gitIgnore = join(root, ".gitignore");
if (existsSync(gitIgnore)) {
  const ignoredPaths = source(gitIgnore).split(/\r?\n/);
  for (const requiredPattern of [
    "node_modules/",
    ".next/",
    ".intlayer/",
    "target/",
    ".venv/",
    "*.tsbuildinfo",
    ".env.*",
    "!**/.env.example",
    "apps/server/var/",
    "*.key",
  ]) {
    if (!ignoredPaths.includes(requiredPattern)) {
      fail(`Git ignore rules must include ${requiredPattern}`, gitIgnore);
    }
  }
}

const dockerIgnore = join(root, ".dockerignore");
if (!existsSync(dockerIgnore)) {
  fail("root Docker build context is missing .dockerignore");
} else {
  const ignoredPaths = source(dockerIgnore);
  for (const requiredPattern of [
    "node_modules/",
    "apps/server/",
    "apps/evidence-gateway/",
    "apps/web/.next/",
    "**/.env.*",
    "**/*.key",
    "**/*.tsbuildinfo",
  ]) {
    if (!ignoredPaths.split(/\r?\n/).includes(requiredPattern)) {
      fail(`Docker build context must ignore ${requiredPattern}`, dockerIgnore);
    }
  }
}

const webSource = join(root, "apps/web/src");
for (const absolute of walk(webSource, (file) => [".ts", ".tsx"].includes(extname(file)))) {
  const rel = relative(webSource, absolute);
  const content = source(absolute);
  if (
    rel.startsWith(`app${sep}`) &&
    /(?:^|\/)page\.tsx$/.test(rel.replaceAll(sep, "/")) &&
    lines(absolute) > 100
  ) {
    fail("route page exceeds the thin-route budget of 100 lines", absolute);
  }
  const isMock = rel.startsWith(`mocks${sep}`);
  const mockBootstrap =
    rel === "instrumentation.ts" || rel === join("components", "providers", "mock-provider.tsx");
  if (!isMock && !mockBootstrap && /from\s+["']@\/mocks\//.test(content)) {
    fail("production web module imports the mock implementation", absolute);
  }
  if (rel.startsWith(join("features", "admin", "components")) && lines(absolute) > 450) {
    fail("admin UI module exceeds the 450-line responsibility budget", absolute);
  }
  if (
    rel.startsWith(`features${sep}`) &&
    rel.includes(`${sep}components${sep}`) &&
    absolute.endsWith(".tsx") &&
    lines(absolute) > 450
  ) {
    fail("feature component exceeds the 450-line responsibility budget", absolute);
  }
  if (rel.startsWith(`mocks${sep}`) && lines(absolute) > 450) {
    fail("mock module exceeds the 450-line responsibility budget", absolute);
  }
}

const javaSource = join(root, "apps/server/src/main/java");
for (const absolute of walk(javaSource, (file) => file.endsWith(".java"))) {
  const rel = relative(javaSource, absolute);
  const content = source(absolute);
  if (rel.includes(`${sep}controller${sep}`)) {
    if (/^import\s+com\.educhain\..*\.repository\./m.test(content)) {
      fail("controller imports a repository", absolute);
    }
    if (lines(absolute) > 300) {
      fail("controller exceeds the 300-line responsibility budget", absolute);
    }
  }
  if (rel.includes(`${sep}dto${sep}`) && /^import\s+com\.educhain\..*\.entity\./m.test(content)) {
    fail("DTO imports a persistence entity package", absolute);
  }
  if (rel.includes(`${sep}service${sep}`) && lines(absolute) > 500) {
    fail("service exceeds the 500-line responsibility budget", absolute);
  }
  if (
    rel.startsWith(`com${sep}educhain${sep}shared${sep}`) &&
    /^import\s+com\.educhain\.(?!shared\.|platform\.)/m.test(content)
  ) {
    fail("shared kernel depends on a feature module", absolute);
  }
  if (
    rel.startsWith(join("com", "educhain", "knowledge")) &&
    /^import\s+com\.educhain\.evidence\.service\./m.test(content)
  ) {
    fail("knowledge module depends on an evidence service implementation", absolute);
  }
  if (
    rel.startsWith(join("com", "educhain", "evidence")) &&
    /^import\s+com\.educhain\.knowledge\.service\./m.test(content)
  ) {
    fail("evidence module depends on a knowledge service implementation", absolute);
  }
}

const gatewaySource = join(root, "apps/evidence-gateway/src");
for (const absolute of walk(gatewaySource, (file) => file.endsWith(".py"))) {
  const rel = relative(gatewaySource, absolute);
  const content = source(absolute);
  if (
    rel.includes(`${sep}application${sep}`) &&
    /(?:from|import)\s+educhain_evidence\.(?:api|adapters)(?:\.|\s|$)/m.test(content)
  ) {
    fail("gateway application layer imports delivery or adapter code", absolute);
  }
}

if (failures.length) {
  console.error("Architecture checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Architecture checks passed.");
