import {batchInput} from '@/lib/batch-input';
import {manufacturerLinks} from '@/lib/manufacturers';
import {today} from '@/lib/catalog';

export async function POST(request:Request) {
 try {
  const parsed=batchInput.safeParse(await request.json());
  if(!parsed.success)return Response.json({error:'Confira os dados do lote e os códigos informados.'},{status:400});
  const links=manufacturerLinks(parsed.data);
  return new Response(JSON.stringify(links,null,2),{headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="vinculos-fabricantes-${parsed.data.company}-${today()}.json"`}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Não foi possível gerar os vínculos.'},{status:422});}
}
