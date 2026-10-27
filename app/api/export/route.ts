import {getBinding} from '@/db/index';
import {getSchema} from '@/lib/attributes-server';
import {Product,serializeProduct,validateProduct,today} from '@/lib/catalog';
export async function POST(request:Request) {try {
 const {ids}=await request.json() as {ids:unknown[]};if(!Array.isArray(ids)||!ids.length||ids.length>100||ids.some(x=>typeof x!=='string')||new Set(ids).size!==ids.length) return Response.json({error:'Selecione de 1 a 100 produtos diferentes.'},{status:400});
 const result=await getBinding().prepare(`SELECT id, body FROM products WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids as string[]).all<{id:string;body:string}>();
 if(result.results.length!==ids.length) return Response.json({error:'Um produto selecionado não está mais disponível.'},{status:400});
 const map=new Map(result.results.map(x=>[x.id,JSON.parse(x.body) as Product]));const ps=(ids as string[]).map(id=>map.get(id)!);
 if(new Set(ps.map(p=>p.cpfCnpjRaiz)).size>1) return Response.json({error:'Exporte os produtos de cada empresa em arquivos separados.'},{status:400});
 const schemas=new Map();for(const ncm of new Set(ps.map(p=>p.ncm))) schemas.set(ncm,await getSchema(ncm));
 const errors:string[]=[];ps.forEach((p,i)=>{const s=schemas.get(p.ncm);if(!s.live&&s.date!==today()) errors.push(`Item ${i+1}: atualize a base oficial antes de exportar.`);errors.push(...validateProduct(p,s).map(e=>`Item ${i+1} (${p.denominacao}): ${e}`));});
 if(errors.length) return Response.json({error:'Existem pendências no lote.',errors},{status:422});
 const output=ps.map((p,i)=>serializeProduct(p,schemas.get(p.ncm),i+1));
 return new Response(JSON.stringify(output,null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="catalogo-${ps[0].cpfCnpjRaiz}-${today()}.json"`}});
 }catch(e){console.error('export',e);return Response.json({error:'Não foi possível gerar o JSON. Tente atualizar os atributos.'},{status:503});}}
