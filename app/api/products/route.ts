import {getBinding} from '@/db/index';
import {productInput} from '@/lib/product-input';
export async function GET() {try {const result=await getBinding().prepare('SELECT id, body, updated_at FROM products ORDER BY updated_at DESC').all<{id:string;body:string;updated_at:string}>();return Response.json(result.results.map(x=>({...JSON.parse(x.body),id:x.id,updatedAt:x.updated_at})));}catch(e){console.error('products load',e);return Response.json({error:'Não foi possível carregar os produtos. Tente novamente.'},{status:503});}}
export async function POST(request:Request) {try {
 const parsed=productInput.safeParse(await request.json());if(!parsed.success) return Response.json({error:'Confira os dados básicos do produto.'},{status:400});
 const p=parsed.data;const id=p.id||crypto.randomUUID();const updatedAt=new Date().toISOString();
 await getBinding().prepare('INSERT INTO products (id, body, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET body=excluded.body, updated_at=excluded.updated_at').bind(id,JSON.stringify({...p,id}),updatedAt).run();
 return Response.json({...p,id,updatedAt});
 }catch(e){console.error('products save',e);return Response.json({error:'Não foi possível salvar. Seus dados continuam no formulário.'},{status:503});}}
