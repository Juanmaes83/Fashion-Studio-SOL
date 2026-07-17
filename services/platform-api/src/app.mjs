import { randomUUID } from "node:crypto";
import { ApiError,toErrorBody } from "./errors.mjs";
import { requireAdmin } from "./auth.mjs";
import { mapDatabaseError } from "./db.mjs";
import * as repo from "./repository.mjs";
import * as assets from "./assets.mjs";
import * as jobs from "./jobs.mjs";
import { opsHtml } from "./ops.mjs";
import { studioHtml } from "./studio.mjs";
import { getStudioSnapshot } from "./studio-repository.mjs";
const json=(res,status,body,id)=>{res.writeHead(status,{"content-type":"application/json; charset=utf-8","x-request-id":id});res.end(status===204?undefined:JSON.stringify(body))};
const html=(res,body,id)=>{res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","content-security-policy":"default-src 'self'; img-src 'self' data: blob:; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'","x-request-id":id});res.end(body)};
const binary=(res,row,body,id)=>{res.writeHead(200,{"content-type":row.mime_type,"content-length":body.length,"cache-control":row.visibility==="public"?"public, max-age=31536000, immutable":"private, no-store","x-content-type-options":"nosniff","x-request-id":id});res.end(body)};
async function readJson(req,max){let size=0,chunks=[];for await(const c of req){size+=c.length;if(size>max)throw new ApiError(413,"PAYLOAD_TOO_LARGE","Payload exceeds configured limit");chunks.push(c)}if(!chunks.length)return{};try{return JSON.parse(Buffer.concat(chunks).toString("utf8"))}catch{throw new ApiError(400,"INVALID_JSON","Request body must be valid JSON")}}
const match=(p,pattern)=>{const keys=[];const source=pattern.replace(/:[^/]+/g,t=>(keys.push(t.slice(1)),"([^/]+)"));const r=p.match(new RegExp(`^${source}$`));return r?Object.fromEntries(keys.map((k,i)=>[k,decodeURIComponent(r[i+1])])):null};
export function createApp({pool,storage,adminToken,localDemoNoAuth=false,version="dev",allowedOrigins=[],maxBodyBytes=262144,maxAssetBytes=15000000,uploadTtlSeconds=900}){return async function app(req,res){const id=typeof req.headers["x-request-id"]==="string"?req.headers["x-request-id"].slice(0,100):randomUUID();const origin=req.headers.origin;if(origin&&allowedOrigins.includes(origin))res.setHeader("access-control-allow-origin",origin);res.setHeader("vary","origin");res.setHeader("access-control-allow-headers","authorization,content-type,if-match,idempotency-key,x-request-id");res.setHeader("access-control-allow-methods","GET,PUT,POST,PATCH,DELETE,OPTIONS");if(req.method==="OPTIONS")return json(res,204,{},id);try{const url=new URL(req.url,"http://api.local"),path=url.pathname;let p;
 if(req.method==="GET"&&path==="/health")return json(res,200,{status:"ok"},id);
 if(req.method==="GET"&&path==="/ready"){await pool.query("SELECT 1");return json(res,200,{status:"ready",database:"ok",storage:"ok",localDemoNoAuth},id)}
 if(req.method==="GET"&&path==="/version")return json(res,200,{service:"platform-api",version,contract:"phase-2f/v1",localDemoNoAuth},id);
 if(req.method==="GET"&&path==="/ops")return html(res,opsHtml,id);
 if(req.method==="GET"&&path==="/studio")return html(res,studioHtml,id);
 if((p=match(path,"/uploads/:assetId"))&&req.method==="PUT"){storage.verifySignedPath({method:"PUT",assetId:p.assetId,expires:url.searchParams.get("expires"),signature:url.searchParams.get("signature")});const row=await assets.getUploadTarget(pool,p.assetId);await storage.putAtomic({key:row.storage_key,body:req,expectedSize:Number(row.byte_size),expectedChecksum:row.checksum_sha256,mimeType:row.mime_type});return json(res,200,{uploaded:true,assetId:row.id},id)}
 if((p=match(path,"/assets/:assetId"))&&req.method==="GET"){storage.verifySignedPath({method:"GET",assetId:p.assetId,expires:url.searchParams.get("expires"),signature:url.searchParams.get("signature")});const row=await assets.getReadableAsset(pool,p.assetId);return binary(res,row,await storage.read(row.storage_key),id)}
 if((p=match(path,"/public/assets/:assetId"))&&req.method==="GET"){const row=await assets.getReadableAsset(pool,p.assetId,true);return binary(res,row,await storage.read(row.storage_key),id)}
 if((p=match(path,"/public/projects/:projectSlug/catalog"))&&req.method==="GET")return json(res,200,await repo.getPublicCatalog(pool,p.projectSlug),id);
 if((p=match(path,"/public/projects/:projectSlug/saved-looks"))&&req.method==="POST")return json(res,201,await repo.createSavedLook(pool,p.projectSlug,await readJson(req,maxBodyBytes)),id);
 if((p=match(path,"/public/saved-looks/:token"))&&req.method==="GET")return json(res,200,await repo.getSavedLook(pool,p.token),id);
 if(path.startsWith("/admin/"))requireAdmin(req,adminToken,{allowLocalDemo:localDemoNoAuth});
 if((p=match(path,"/admin/projects/:projectId/studio"))&&req.method==="GET")return json(res,200,await getStudioSnapshot(pool,storage,p.projectId),id);
 if((p=match(path,"/admin/projects/:projectId/ops/summary"))&&req.method==="GET")return json(res,200,await jobs.opsSummary(pool,p.projectId),id);
 if((p=match(path,"/admin/projects/:projectId/jobs"))&&req.method==="POST")return json(res,201,await jobs.createJob(pool,p.projectId,await readJson(req,maxBodyBytes),req.headers["idempotency-key"]),id);
 if((p=match(path,"/admin/projects/:projectId/jobs"))&&req.method==="GET")return json(res,200,{items:await jobs.listJobs(pool,p.projectId,{status:url.searchParams.get("status"),limit:url.searchParams.get("limit")})},id);
 if((p=match(path,"/admin/projects/:projectId/jobs/:jobId"))&&req.method==="GET")return json(res,200,await jobs.getJob(pool,p.projectId,p.jobId),id);
 if((p=match(path,"/admin/projects/:projectId/jobs/:jobId/cancel"))&&req.method==="POST")return json(res,200,await jobs.requestCancel(pool,p.projectId,p.jobId),id);
 if((p=match(path,"/admin/projects/:projectId/jobs/:jobId/retry"))&&req.method==="POST")return json(res,201,await jobs.retryJob(pool,p.projectId,p.jobId,req.headers["idempotency-key"]),id);
 if((p=match(path,"/admin/projects/:projectId/assets/upload-intent"))&&req.method==="POST")return json(res,201,await assets.createUploadIntent(pool,storage,p.projectId,await readJson(req,maxBodyBytes),req.headers["idempotency-key"],{maxAssetBytes,uploadTtlSeconds}),id);
 if((p=match(path,"/admin/projects/:projectId/assets/:assetId/complete"))&&req.method==="POST")return json(res,200,await assets.completeAsset(pool,storage,p.projectId,p.assetId),id);
 if((p=match(path,"/admin/projects/:projectId/assets/:assetId/promote"))&&req.method==="POST")return json(res,200,await assets.promoteAsset(pool,storage,p.projectId,p.assetId,await readJson(req,maxBodyBytes)),id);
 if((p=match(path,"/admin/projects/:projectId/assets/:assetId/withdraw"))&&req.method==="POST")return json(res,200,await assets.withdrawAsset(pool,storage,p.projectId,p.assetId),id);
 if((p=match(path,"/admin/projects/:projectId/assets/:assetId"))&&req.method==="GET")return json(res,200,await assets.getAsset(pool,storage,p.projectId,p.assetId),id);
 if((p=match(path,"/admin/projects/:projectId/assets/:assetId"))&&req.method==="DELETE")return json(res,200,await assets.deleteAsset(pool,storage,p.projectId,p.assetId),id);
 if((p=match(path,"/admin/projects/:projectId/garments"))&&req.method==="GET")return json(res,200,{items:await repo.listGarments(pool,p.projectId)},id);
 if((p=match(path,"/admin/projects/:projectId/garments/:garmentId"))&&req.method==="GET")return json(res,200,await repo.getGarment(pool,p.projectId,p.garmentId),id);
 if((p=match(path,"/admin/projects/:projectId/garments"))&&req.method==="POST")return json(res,201,await repo.createGarment(pool,p.projectId,await readJson(req,maxBodyBytes)),id);
 if((p=match(path,"/admin/projects/:projectId/garments/:garmentId"))&&req.method==="PATCH")return json(res,200,await repo.updateGarment(pool,p.projectId,p.garmentId,await readJson(req,maxBodyBytes),Number(String(req.headers["if-match"]||"").replaceAll('"',""))),id);
 if((p=match(path,"/admin/projects/:projectId/outfits"))&&req.method==="GET")return json(res,200,{items:await repo.listOutfits(pool,p.projectId)},id);
 if((p=match(path,"/admin/projects/:projectId/outfits"))&&req.method==="POST")return json(res,201,await repo.createOutfit(pool,p.projectId,await readJson(req,maxBodyBytes)),id);
 if((p=match(path,"/admin/projects/:projectId/outfits/:outfitId/transitions"))&&req.method==="POST"){const b=await readJson(req,maxBodyBytes);return json(res,200,await repo.transitionOutfit(pool,p.projectId,p.outfitId,b.action),id)}
 if((p=match(path,"/admin/projects/:projectId/publications"))&&req.method==="POST")return json(res,201,await repo.createPublication(pool,p.projectId),id);
 if((p=match(path,"/admin/projects/:projectId/publications/:publicationId/withdraw"))&&req.method==="POST")return json(res,200,await repo.withdrawPublication(pool,p.projectId,p.publicationId),id);
 if((p=match(path,"/admin/projects/:projectId/saved-looks/:savedLookId"))&&req.method==="DELETE")return json(res,200,await repo.revokeSavedLook(pool,p.projectId,p.savedLookId),id);
 throw new ApiError(404,"NOT_FOUND","Route not found")
 }catch(error){const safe=toErrorBody(mapDatabaseError(error),id);json(res,safe.status,safe.body,id)}}}
