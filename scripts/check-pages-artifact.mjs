import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = join(root, "apps/web/out");
const expectedBasePath = process.env.EDUCHAIN_PAGES_BASE_PATH ?? "/EduChain";
const failures = [];
const files = [];

function artifactPath(path) {
  return join(outputDirectory, ...path.split("/"));
}

function fail(message) {
  failures.push(message);
}

function walk(directory) {
  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);
    const stats = lstatSync(absolute);
    const artifactName = relative(outputDirectory, absolute).split(sep).join("/");

    if (stats.isSymbolicLink()) {
      fail(`symbolic link is not allowed (${artifactName})`);
      continue;
    }
    if (stats.isDirectory()) {
      walk(absolute);
      continue;
    }
    if (!stats.isFile()) {
      fail(`unsupported artifact entry (${artifactName})`);
      continue;
    }
    if (stats.nlink > 1) {
      fail(`hard link is not allowed (${artifactName})`);
    }
    files.push({ absolute, artifactName, size: stats.size });
  }
}

if (!existsSync(outputDirectory)) {
  fail("static output directory is missing (apps/web/out)");
} else {
  walk(outputDirectory);
}

for (const required of [
  ".nojekyll",
  "index.html",
  "icon.svg",
  "mockServiceWorker.js",
  "zh-CN/index.html",
  "en/index.html",
  "zh-CN/resources/view/index.html",
  "zh-CN/evidence/view/index.html",
  "zh-CN/ledger/block/index.html",
  "zh-CN/ledger/transaction/index.html",
  "zh-CN/studio/resources/edit/index.html",
]) {
  if (!existsSync(artifactPath(required))) {
    fail(`required Pages artifact is missing (${required})`);
  }
}

const unwantedPath =
  /(^|\/)(?:\.DS_Store|Thumbs\.db|\.env(?:\.[^/]*)?|node_modules|\.git)(?:\/|$)|\.(?:key|pem|p12|pfx|jks|keystore|log|tmp)$/i;
for (const file of files) {
  if (unwantedPath.test(file.artifactName)) {
    fail(`unwanted file is present (${file.artifactName})`);
  }
}

for (const file of files.filter(({ artifactName }) => artifactName.endsWith(".html"))) {
  const html = readFileSync(file.absolute, "utf8");
  for (const match of html.matchAll(/\b(?:href|src|action)="(\/[^"]*)"/g)) {
    const url = match[1];
    if (url !== expectedBasePath && !url.startsWith(`${expectedBasePath}/`)) {
      fail(`absolute URL escapes ${expectedBasePath} in ${file.artifactName} (${url})`);
      continue;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(url, "https://pages.invalid").pathname);
    } catch {
      fail(`invalid local URL in ${file.artifactName} (${url})`);
      continue;
    }

    const outputName = pathname.slice(expectedBasePath.length).replace(/^\/+/, "");
    const candidates = outputName
      ? extname(outputName)
        ? [outputName]
        : [join(outputName, "index.html"), `${outputName}.html`]
      : ["index.html"];
    if (!candidates.some((candidate) => existsSync(artifactPath(candidate)))) {
      fail(`broken local URL in ${file.artifactName} (${url})`);
    }
  }
}

const totalBytes = files.reduce((total, file) => total + file.size, 0);
const maximumArtifactBytes = 10 * 1024 * 1024 * 1024;
if (totalBytes >= maximumArtifactBytes) {
  fail(`artifact is too large (${totalBytes} bytes; limit is below 10 GB)`);
}

if (failures.length) {
  console.error("GitHub Pages artifact checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `GitHub Pages artifact checks passed (${files.length} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB).`,
);
