import {getBinding} from '@/db/index';
import {batchInput} from '@/lib/batch-input';
import {normalizeItems} from '@/lib/batch';
import {getSchema} from '@/lib/attributes-server';
import {serializeProduct,validateProduct,today} from '@/lib/catalog';
export async function POST(request:Request){try{
 const parsed=batchInput.safeParse(await request.json());if(!parsed.success)return Response.json({error:'O lote deve conter de 1 a 100 itens com dados válidos.'},{status:400});
 const b=parsed.data;const schema=await getSchema(b.ncm);
 if(!schema.live&&schema.date!==today())return Response.json({error:'Não foi possível obter uma base oficial atualizada. Clique em Atualizar atributos da NCM ao lado de Gerar JSON e tente novamente. Se a consulta continuar indisponível, aguarde alguns instantes. O lote permanece salvo.'},{status:422});
 const items=normalizeItems(b);const issues=items.flatMap((p,index)=>validateProduct(p,schema).map(message=>({index,message})));
 if(issues.length)return Response.json({error:'Existem pendências no lote.',issues,errors:issues.map(x=>`Item ${x.index+1}: ${x.message}`)},{status:422});
 const updatedAt=new Date().toISOString();const db=getBinding();
 await db.batch([...items.map(p=>db.prepare('INSERT INTO products (id, body, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET body=excluded.body, updated_at=excluded.updated_at').bind(p.id,JSON.stringify(p),updatedAt)),db.prepare('INSERT INTO batches (id, body, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET body=excluded.body, updated_at=excluded.updated_at').bind(b.id,JSON.stringify({...b,items}),updatedAt)]);
 return new Response(JSON.stringify(items.map((p,i)=>serializeProduct(p,schema,i+1)),null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="catalogo-${b.company}-${today()}.json"`}});
}catch(e){console.error('batch export',e);return Response.json({error:e instanceof Error&&/NCM|base oficial/.test(e.message)?e.message:'Não foi possível salvar e gerar o lote. Tente novamente.'},{status:503});}}
