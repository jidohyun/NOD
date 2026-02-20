import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = resolve(import.meta.dirname, "..");
const packageJsonPath = resolve(rootDir, "package.json");
const manifestPath = resolve(rootDir, "dist/prod/manifest.json");
const prodDir = resolve(rootDir, "dist/prod");
const releaseDir = resolve(rootDir, "dist/release");

const requiredFiles = [
  "manifest.json",
  "popup.js",
  "service-worker.js",
  "content-script.js",
  "config.json",
  "src/popup/index.html",
];

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function assertBuildArtifacts() {
  if (!existsSync(prodDir)) {
    throw new Error("Missing dist/prod. Run 'bun run build:prod' first.");
  }

  for (const relativePath of requiredFiles) {
    const absolutePath = resolve(prodDir, relativePath);
    if (!existsSync(absolutePath)) {
      throw new Error(`Missing build artifact: ${relativePath}`);
    }
  }
}

function validateVersions() {
  const packageJson = readJson(packageJsonPath);
  const manifest = readJson(manifestPath);

  if (manifest.version !== packageJson.version) {
    throw new Error(
      `Manifest version (${manifest.version}) does not match package version (${packageJson.version}).`,
    );
  }

  return packageJson.version;
}

function createZip(version) {
  mkdirSync(releaseDir, { recursive: true });

  const zipFileName = `nod-extension-v${version}.zip`;
  const zipFilePath = resolve(releaseDir, zipFileName);
  rmSync(zipFilePath, { force: true });

  execFileSync("zip", ["-rq", zipFilePath, "."], {
    cwd: prodDir,
    stdio: "inherit",
  });

  return zipFilePath;
}

function main() {
  assertBuildArtifacts();
  const version = validateVersions();
  const zipPath = createZip(version);

  process.stdout.write(`Packaged extension: ${zipPath}\n`);
}

main();
