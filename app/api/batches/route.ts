import {getBinding} from '@/db/index';
import {batchInput} from '@/lib/batch-input';
export async function GET(request:Request){try{
 const url=new URL(request.url);const db=getBinding();
 if(url.searchParams.get('list')==='1'){const r=await db.prepare("SELECT id, json_extract(body, '$.company') AS company, json_extract(body, '$.ncm') AS ncm, json_array_length(body, '$.items') AS count, updated_at AS updatedAt FROM batches ORDER BY updated_at DESC LIMIT 50").all();return Response.json(r.results);}
 const id=url.searchParams.get('id');const statement=id?db.prepare('SELECT body, updated_at FROM batches WHERE id = ?').bind(id):db.prepare('SELECT body, updated_at FROM batches ORDER BY updated_at DESC LIMIT 1');
 const r=await statement.first<{body:string;updated_at:string}>();return Response.json(r?{...JSON.parse(r.body),updatedAt:r.updated_at}:null);
 }catch(e){console.error('batch load',e);return Response.json({error:'Não foi possível carregar o lote. Tente novamente.'},{status:503});}}
export async function POST(request:Request){try{const parsed=batchInput.safeParse(await request.json());if(!parsed.success)return Response.json({error:'Confira os dados do lote. O limite é de 100 itens.'},{status:400});const b=parsed.data;const updatedAt=new Date().toISOString();await getBinding().prepare('INSERT INTO batches (id, body, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET body=excluded.body, updated_at=excluded.updated_at').bind(b.id,JSON.stringify(b),updatedAt).run();return Response.json({id:b.id,updatedAt});}catch(e){console.error('batch save',e);return Response.json({error:'Não foi possível salvar o lote. Os dados permanecem na tela.'},{status:503});}}
