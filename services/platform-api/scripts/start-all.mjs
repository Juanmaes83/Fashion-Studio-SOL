import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "src");
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SUPERVISOR_SHUTDOWN_TIMEOUT_MS || 10000);

function annotate(component, rawLine) {
  try {
    const parsed = JSON.parse(rawLine);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return JSON.stringify({ ...parsed, component });
    }
    return JSON.stringify({ component, message: rawLine });
  } catch {
    return JSON.stringify({ component, message: rawLine });
  }
}

function launch(name, entry) {
  const child = spawn(process.execPath, [path.join(srcDir, entry)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => chunk.split("\n").filter(Boolean).forEach((line) => console.log(annotate(name, line))));
  child.stderr.on("data", (chunk) => chunk.split("\n").filter(Boolean).forEach((line) => console.error(annotate(name, line))));
  return child;
}

const children = { api: launch("api", "server.mjs"), worker: launch("worker", "worker.mjs") };
const exited = new Set();
let shuttingDown = false;
let exitCode = 0;
let forceKillTimer = null;

const allExited = () => exited.size === Object.keys(children).length;

function finishIfDone() {
  if (!allExited()) return;
  if (forceKillTimer) clearTimeout(forceKillTimer);
  process.exit(exitCode);
}

function beginShutdown(signal, code) {
  if (shuttingDown) return;
  shuttingDown = true;
  exitCode = code;
  console.log(JSON.stringify({ component: "supervisor", event: "shutdown_start", signal, exitCode: code }));
  for (const [name, child] of Object.entries(children)) {
    if (!exited.has(name)) child.kill("SIGTERM");
  }
  forceKillTimer = setTimeout(() => {
    for (const [name, child] of Object.entries(children)) {
      if (!exited.has(name)) {
        console.error(JSON.stringify({ component: "supervisor", event: "shutdown_force_kill", target: name }));
        child.kill("SIGKILL");
      }
    }
  }, SHUTDOWN_TIMEOUT_MS);
  forceKillTimer.unref();
}

for (const [name, child] of Object.entries(children)) {
  child.on("exit", (code, signal) => {
    exited.add(name);
    console.log(JSON.stringify({ component: "supervisor", event: "child_exit", name, code, signal }));
    if (!shuttingDown) beginShutdown("SIGTERM", code && code !== 0 ? code : 1);
    finishIfDone();
  });
}

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => beginShutdown(signal, 0));
}
