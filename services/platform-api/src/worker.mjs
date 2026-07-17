import { createPool } from './db.mjs';
import { claimJob,heartbeat,finishJob,failJob } from './jobs.mjs';
import { randomUUID } from 'node:crypto';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export const handlers={
 async test_echo(job,ctx){for(const p of [20,60,100]){await sleep(40);if(await ctx.progress(p))throw Object.assign(new Error('Cancelled'),{code:'JOB_CANCELLED'});}return {output:{echo:job.input},summary:{handler:'test_echo'}}},
 async test_fail_once(job,ctx){await ctx.progress(25);if(job.attempt_count===1)throw Object.assign(new Error('Intentional first-attempt failure'),{code:'TEST_FAIL_ONCE'});await ctx.progress(100);return {output:{recovered:true},summary:{attempt:job.attempt_count}}}
};
export async function runWorker({pool,workerId=randomUUID(),pollMs=500,leaseSeconds=15,once=false,registry=handlers}={}){
 let stopped=false;const stop=()=>{stopped=true};
 do{
  const job=await claimJob(pool,workerId,leaseSeconds);
  if(!job){if(once)break;await sleep(pollMs);continue}
  try{
   const handler=registry[job.job_type];if(!handler)throw Object.assign(new Error(`Unsupported job type: ${job.job_type}`),{code:'JOB_TYPE_UNSUPPORTED'});
   const result=await handler(job,{progress:async p=>(await heartbeat(pool,job.id,workerId,p,leaseSeconds)).cancelRequested});
   await finishJob(pool,job.id,workerId,result);
  }catch(error){await failJob(pool,job.id,workerId,error)}
 }while(!stopped&&!once);
 return {workerId,stop};
}
if(import.meta.url===`file://${process.argv[1]}`){const pool=createPool(process.env.DATABASE_URL);const workerId=process.env.WORKER_ID||`worker-${process.pid}`;let stopping=false;const shutdown=async()=>{stopping=true;await pool.end();process.exit(0)};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);while(!stopping)await runWorker({pool,workerId,once:true,pollMs:Number(process.env.WORKER_POLL_MS||500),leaseSeconds:Number(process.env.WORKER_LEASE_SECONDS||15)}).then(async()=>sleep(Number(process.env.WORKER_POLL_MS||500)));}
