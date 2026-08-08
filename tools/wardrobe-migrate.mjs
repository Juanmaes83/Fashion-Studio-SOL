#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createPool } from '../services/platform-api/src/db.mjs';
import { inventoryWardrobe,migrateWardrobe,rollbackMigration } from './migration/wardrobe-core.mjs';
const args=process.argv.slice(2),command=args[0]||'inventory';
const option=(name,fallback)=>{const i=args.indexOf(`--${name}`);return i>=0?args[i+1]:fallback};
const required=(name,value)=>{if(!value)throw new Error(`${name} is required`);return value};
const dataDir=path.resolve(option('data-dir',process.env.WARDROBE_DATA_DIR||'../wardrobe/data'));
const projectId=option('project-id',process.env.MIGRATION_PROJECT_ID||'project-sol');
const storageRoot=path.resolve(option('storage-root',process.env.STORAGE_ROOT||'./tmp/platform-storage'));
const reportPath=path.resolve(option('report',`./tmp/wardrobe-migration-${command}.json`));
async function save(value){await writeFile(reportPath,JSON.stringify(value,null,2)+'\n');console.log(JSON.stringify({...value,reportPath},null,2))}
let pool;
try{
 if(command==='inventory'){const inventory=await inventoryWardrobe({dataDir});await save({command,dataDir,counts:inventory.counts,checksums:inventory.checksums,fingerprint:inventory.fingerprint,assets:inventory.assets.map(a=>({id:a.id,ownerType:a.ownerType,ownerId:a.ownerId,kind:a.kind,ref:a.ref,byteSize:a.byteSize,checksum:a.checksum,mimeType:a.mimeType}))});}
 else if(command==='dry-run'||command==='apply'){pool=createPool(required('DATABASE_URL',process.env.DATABASE_URL));const inventory=await inventoryWardrobe({dataDir});const result=await migrateWardrobe({pool,storageRoot,projectId,inventory,dryRun:command==='dry-run'});await save({command,projectId,dataDir,storageRoot,inventory:{counts:inventory.counts,checksums:inventory.checksums,fingerprint:inventory.fingerprint},result});}
 else if(command==='rollback'){pool=createPool(required('DATABASE_URL',process.env.DATABASE_URL));const runId=required('--run-id',option('run-id'));await save({command,projectId,result:await rollbackMigration({pool,storageRoot,runId})});}
 else throw new Error('Command must be inventory|dry-run|apply|rollback');
}catch(error){console.error(JSON.stringify({ok:false,command,error:error.message}));process.exitCode=1}finally{if(pool)await pool.end()}
