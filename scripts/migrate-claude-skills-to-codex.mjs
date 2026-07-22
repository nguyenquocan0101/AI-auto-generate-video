import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceRoot = join(projectRoot, ".claude", "skills");
// Repository skills are discovered from .agents/skills by Codex.
// Keep .codex for Codex configuration and migration support only.
const targetRoot = join(projectRoot, ".agents", "skills");
const skip = new Set([
  "create-programming-video",
  "create-template-video",
  "short-clip",
  "skill-creator",
]);

function codexName(name) {
  return name.startsWith("ck-") ? name : name;
}

function codexBody(body, name) {
  let result = body
    .replaceAll(".claude/skills/", ".agents/skills/")
    .replaceAll(".claude/rules/commands.md", "AGENTS.md")
    .replaceAll(".claude/session-data/", "plans/")
    .replace(/\/ck:([a-z0-9-]+)/g, "$ck-$1")
    .replaceAll("AskUserQuestion", "ask the user directly");

  if (name.startsWith("ck-") || name === "problem-solving" || name === "sequential-thinking" || name === "strategic-compact") {
    result += [
      "",
      "## Codex compatibility",
      "",
      "Use the currently available Codex tools and skills for this workflow. If a referenced Claude agent, hook, MCP tool, or slash command is unavailable, perform the equivalent step inline, preserve the same artifact and verification requirements, and state the fallback briefly.",
      "",
    ].join("\n");
  }
  return result;
}

function normalizeFrontmatter(content, name) {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return content;
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing < 0) return content;
  const frontmatterLines = normalized.slice(4, closing).split("\n");
  const descriptionLine = frontmatterLines.findIndex((line) => /^description:\s*/.test(line));
  let description = descriptionLine >= 0
    ? frontmatterLines[descriptionLine].replace(/^description:\s*/, "").trim()
    : "";
  if (description === ">" || description === "|") {
    const continuation = [];
    for (let index = descriptionLine + 1; index < frontmatterLines.length; index++) {
      const line = frontmatterLines[index];
      if (!/^\s+/.test(line)) break;
      continuation.push(line.trim());
    }
    description = continuation.join(" ");
  }
  for (let attempt = 0; attempt < 3 && description.startsWith('"'); attempt++) {
    try {
      const parsed = JSON.parse(description);
      if (typeof parsed !== "string") break;
      description = parsed;
    } catch {
      break;
    }
  }
  if (description.startsWith('"') && description.endsWith('"')) {
    description = description.slice(1, -1);
  }
  description = description.replace(/\/ck:([a-z0-9-]+)/g, "$ck-$1");
  const body = normalized.slice(closing + "\n---\n".length);
  const frontmatter = [
    "---",
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
    "---",
    "",
  ].join("\n");
  return `${frontmatter}${codexBody(body, name)}`;
}

async function normalizeSkillFiles(directory, name, rootDirectory = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await normalizeSkillFiles(path, name, rootDirectory);
      continue;
    }
    if (entry.name !== "SKILL.md") continue;
    const content = await readFile(path, "utf8");
    const nestedName = directory === rootDirectory
      ? name
      : content.match(/^name:\s*([^\r\n]+)/m)?.[1]?.trim() ?? name;
    await writeFile(path, normalizeFrontmatter(content, nestedName), "utf8");
  }
}

await mkdir(targetRoot, { recursive: true });
const entries = await readdir(sourceRoot, { withFileTypes: true });
for (const entry of entries.filter((item) => item.isDirectory())) {
  if (skip.has(entry.name)) {
    const existingTarget = join(targetRoot, entry.name);
    try {
      await normalizeSkillFiles(existingTarget, entry.name);
      console.log(`KEEP existing Codex skill: ${entry.name}`);
    } catch {
      const source = join(sourceRoot, entry.name);
      await cp(source, existingTarget, { recursive: true, force: false, errorOnExist: false });
      await normalizeSkillFiles(existingTarget, entry.name);
      console.log(`MIGRATED ${entry.name} -> .agents/skills/${entry.name}`);
    }
    continue;
  }
  const name = codexName(entry.name);
  const source = join(sourceRoot, entry.name);
  const target = join(targetRoot, name);
  await cp(source, target, { recursive: true, force: false, errorOnExist: false });
  await normalizeSkillFiles(target, name);
  console.log(`MIGRATED ${entry.name} -> .agents/skills/${name}`);
}
