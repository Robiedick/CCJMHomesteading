#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const killPort = require("kill-port");
const { spawn } = require("child_process");

const PORTS_TO_CLEAR = [3000, 5555];
const CHILD_PROCESSES = [];
let shuttingDown = false;

async function freePorts() {
  for (const port of PORTS_TO_CLEAR) {
    try {
      await killPort(port, "tcp");
      console.log(`[dev] Cleared port ${port}`);
    } catch (error) {
      const message = typeof error?.message === "string" ? error.message : "";
      if (
        message.includes("not found") ||
        message.includes("not running") ||
        message.includes("not in use")
      ) {
        console.log(`[dev] Port ${port} was already free`);
      } else {
        console.warn(`[dev] Could not verify port ${port}: ${message || error}`);
      }
    }
  }
}

function spawnProcess(command, args, label) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  CHILD_PROCESSES.push({ child, label });

  child.on("exit", (code, signal) => {
    if (!shuttingDown) {
      shuttingDown = true;
      if (code !== 0) {
        console.error(`[dev] ${label} exited with code ${code ?? "unknown"}`);
        process.exitCode = code ?? 1;
      } else if (signal) {
        console.log(`[dev] ${label} exited due to signal ${signal}`);
      } else {
        console.log(`[dev] ${label} stopped`);
      }
      cleanup();
    }
  });

  return child;
}

function cleanup() {
  for (const { child, label } of CHILD_PROCESSES) {
    if (!child.killed) {
      console.log(`[dev] Stopping ${label}`);
      child.kill("SIGTERM");
    }
  }
}

process.on("SIGINT", () => {
  if (!shuttingDown) {
    shuttingDown = true;
    console.log("\n[dev] Caught SIGINT, shutting down…");
    cleanup();
  }
});

process.on("SIGTERM", () => {
  if (!shuttingDown) {
    shuttingDown = true;
    console.log("\n[dev] Caught SIGTERM, shutting down…");
    cleanup();
  }
});

(async function start() {
  await freePorts();
  console.log("[dev] Starting frontend and backend processes…");

  spawnProcess("npm", ["run", "dev:frontend"], "frontend");
  spawnProcess("npm", ["run", "dev:backend"], "backend");
})();
