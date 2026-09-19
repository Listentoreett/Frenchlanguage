import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, "..");
const sourcesPath = resolve(root, "data/audio-sources.json");
const audioDir = resolve(root, "assets/audio");
const manifestPath = resolve(audioDir, "manifest.csv");
const userAgent = "FrenchLearningPlan/1.0 (audio fetch for local learning project)";

function csv(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function download(source) {
  const response = await fetch(source.downloadUrl, {
    headers: { "User-Agent": userAgent }
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const target = resolve(audioDir, source.localFilename);
  await writeFile(target, buffer);
  return buffer.length;
}

async function main() {
  const sources = JSON.parse(await readFile(sourcesPath, "utf8"));
  await mkdir(audioDir, { recursive: true });

  const rows = [
    [
      "phrase_id",
      "local_filename",
      "source_url",
      "author_or_speaker",
      "license",
      "date_downloaded",
      "attribution"
    ].join(",")
  ];

  let failures = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const source of sources) {
    try {
      const bytes = await download(source);
      console.log(`Downloaded ${source.localFilename} (${bytes} bytes)`);
      rows.push([
        source.phraseId,
        source.localFilename,
        source.sourcePage,
        source.authorOrSpeaker,
        source.license,
        today,
        source.attribution
      ].map(csv).join(","));
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 1500));
    } catch (error) {
      failures += 1;
      console.warn(`Skipped ${source.localFilename}: ${error.message}`);
    }
  }

  if (rows.length > 1) {
    await writeFile(manifestPath, `${rows.join("\n")}\n`, "utf8");
    console.log(`Wrote ${manifestPath}`);
  }

  if (failures) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
