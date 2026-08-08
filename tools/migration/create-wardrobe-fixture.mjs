import { mkdir,rm,writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'./tmp/wardrobe-fixture');
await rm(root,{recursive:true,force:true});await mkdir(path.join(root,'imported'),{recursive:true});await mkdir(path.join(root,'outfit-images'),{recursive:true});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+X2NDWQAAAABJRU5ErkJggg==','base64');
for(const name of ['top-garment.png','top-modeled.png','bottom-garment.png'])await writeFile(path.join(root,'imported',name),png);
for(const name of ['look-editorial.png','look-flatlay.png'])await writeFile(path.join(root,'outfit-images',name),png);
const library=[
 {id:'fixture-top',name:'Fixture Top',part:'upperbody',bodyArea:'upperbody',category:'tops',garmentType:'shirt',color:'#ffffff',season:['all-season'],occasion:['office'],tags:['fixture'],fieldProvenance:{name:'human_confirmed'},review:{status:'approved'},image:'/api/import/library/top-garment.png',thumbnail:'/api/import/library/top-garment.png',modeledImage:'/api/import/library/top-modeled.png'},
 {id:'fixture-bottom',name:'Fixture Bottom',part:'lowerbody',bodyArea:'lowerbody',category:'bottoms',garmentType:'trousers',color:'#111111',season:['all-season'],occasion:['office'],tags:['fixture'],fieldProvenance:{name:'human_confirmed'},review:{status:'approved'},image:'/api/import/library/bottom-garment.png',thumbnail:'/api/import/library/bottom-garment.png'}
];
const outfits={version:1,outfits:[{id:'fixture-look',name:'Fixture Look',description:'Migration fixture',garmentIds:['fixture-top','fixture-bottom'],occasion:['office'],season:['all-season'],style:'smart-casual',tags:['fixture'],status:'approved',source:'fixture',image:'outfit-images/look-editorial.png',flatLayImage:'outfit-images/look-flatlay.png'}]};
await writeFile(path.join(root,'library.json'),JSON.stringify(library,null,2));await writeFile(path.join(root,'outfits.json'),JSON.stringify(outfits,null,2));console.log(root);
