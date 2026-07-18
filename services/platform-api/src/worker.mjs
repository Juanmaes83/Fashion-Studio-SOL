import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './db.mjs';
import { claimJob, heartbeat, finishJob, failJob } from './jobs.mjs';
import { createStorage } from './storage.mjs';
import { createOpenAIHandlers } from './openai-handlers.mjs';

const sleep = ms => new Promise(resolveSleep => setTimeout(resolveSleep, ms));

export const handlers = {
  async test_echo(job, ctx) {
    for (const progress of [20, 60, 100]) {
      await sleep(40);
      if (await ctx.progress(progress)) {
        throw Object.assign(new Error('Cancelled'), { code: 'JOB_CANCELLED' });
      }
    }
    return { output: { echo: job.input }, summary: { handler: 'test_echo' } };
  },

  async test_fail_once(job, ctx) {
    await ctx.progress(25);
    if (job.attempt_count === 1) {
      throw Object.assign(new Error('Intentional first-attempt failure'), { code: 'TEST_FAIL_ONCE' });
    }
    await ctx.progress(100);
    return { output: { recovered: true }, summary: { attempt: job.attempt_count } };
  }
};

export async function runWorker({
  pool,
  workerId = randomUUID(),
  pollMs = 500,
  leaseSeconds = 15,
  once = false,
  registry = handlers
} = {}) {
  let stopped = false;
  const stop = () => { stopped = true; };

  do {
    const job = await claimJob(pool, workerId, leaseSeconds);
    if (!job) {
      if (once) break;
      await sleep(pollMs);
      continue;
    }

    try {
      const handler = registry[job.job_type];
      if (!handler) {
        throw Object.assign(new Error(`Unsupported job type: ${job.job_type}`), { code: 'JOB_TYPE_UNSUPPORTED' });
      }
      const result = await handler(job, {
        progress: async progress => (await heartbeat(pool, job.id, workerId, progress, leaseSeconds)).cancelRequested
      });
      await finishJob(pool, job.id, workerId, result);
    } catch (error) {
      await failJob(pool, job.id, workerId, error);
    }
  } while (!stopped && !once);

  return { workerId, stop };
}

function isExecutedDirectly() {
  if (!process.argv[1]) return false;
  return resolve(fileURLToPath(import.meta.url)) === resolve(process.argv[1]);
}

async function startWorkerProcess() {
  const pool = createPool(process.env.DATABASE_URL);
  const storage = createStorage({
    root: process.env.STORAGE_ROOT || './tmp/platform-storage',
    signingSecret: process.env.STORAGE_SIGNING_SECRET
  });
  const registry = {
    ...handlers,
    ...createOpenAIHandlers({
      pool,
      storage,
      key: process.env.OPENAI_API_KEY,
      baseUrl: process.env.OPENAI_API_BASE_URL,
      visionModel: process.env.OPENAI_VISION_MODEL,
      imageModel: process.env.OPENAI_IMAGE_MODEL,
      quality: process.env.OPENAI_IMAGE_QUALITY
    })
  };
  const workerId = process.env.WORKER_ID || `worker-${process.pid}`;
  const pollMs = Number(process.env.WORKER_POLL_MS || 500);
  const leaseSeconds = Number(process.env.WORKER_LEASE_SECONDS || 15);
  let stopping = false;

  const shutdown = async signal => {
    if (stopping) return;
    stopping = true;
    console.log(JSON.stringify({ level: 'info', event: 'worker_stopping', workerId, signal }));
    await pool.end();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  console.log(JSON.stringify({
    level: 'info',
    event: 'worker_started',
    workerId,
    pollMs,
    leaseSeconds,
    openAIEnabled: Boolean(process.env.OPENAI_API_KEY)
  }));

  while (!stopping) {
    await runWorker({ pool, workerId, once: true, registry, pollMs, leaseSeconds });
    await sleep(pollMs);
  }
}

if (isExecutedDirectly()) {
  startWorkerProcess().catch(error => {
    console.error(JSON.stringify({
      level: 'error',
      event: 'worker_crashed',
      code: error?.code || 'WORKER_CRASHED',
      message: String(error?.message || error)
    }));
    process.exit(1);
  });
}
