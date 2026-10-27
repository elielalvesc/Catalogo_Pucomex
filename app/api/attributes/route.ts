import { getSchema } from '@/lib/attributes-server';
export async function GET(request:Request) {
 const url=new URL(request.url);
 try {return Response.json(await getSchema(url.searchParams.get('ncm')||'',url.searchParams.get('refresh')==='1'));}
 catch(e) {return Response.json({error:e instanceof Error?e.message:'Falha na consulta.'},{status:400});}
}
