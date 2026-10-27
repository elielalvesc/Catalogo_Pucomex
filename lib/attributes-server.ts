import { unzipSync, strFromU8 } from 'fflate';
import bundled from './data/production.json';
import { Attribute, Schema, inForce, today } from './catalog';
type Database={versao:string;date:string;attrs:Record<string,Attribute>;ncms:Record<string,Partial<Attribute>[]>};
let cached:Database|null=null;let expires=0;let retryAt=0;let loading:Promise<Database>|null=null;
const source='https://portalunico.siscomex.gov.br/cadatributos/api/atributo-ncm/download/json';
async function load():Promise<Database> {
 const response=await fetch(source,{signal:AbortSignal.timeout(18000),redirect:'follow'});
 if(!response.ok) throw new Error('Base oficial indisponível');
 const bytes=new Uint8Array(await response.arrayBuffer());
 if(bytes.length>8000000) throw new Error('Base excede o limite de leitura');
 const zip=unzipSync(bytes);const filename=Object.keys(zip).find(k=>k.endsWith('.json'));if(!filename) throw new Error('Arquivo oficial inválido');
 const d=JSON.parse(strFromU8(zip[filename]));if(!Array.isArray(d.listaNcm)||!Array.isArray(d.detalhesAtributos)) throw new Error('Estrutura oficial não reconhecida');
 const attrs:Record<string,Attribute>={};for(const a of d.detalhesAtributos) if(a.objetivos?.some((o:{codigo:number})=>o.codigo===7)) attrs[a.codigo]=a;
 const ncms:Database['ncms']={};for(const n of d.listaNcm) ncms[n.codigoNcm.replace(/\D/g,'')]=n.listaAtributos.filter((a:Attribute&{modalidade:string})=>attrs[a.codigo]&&a.modalidade==='Importação');
 const match=filename.match(/(\d{4})_(\d{2})_(\d{2})/);if(!match) throw new Error('Data da base oficial não reconhecida');
 return {versao:String(d.versao),date:match.slice(1).join('-'),attrs,ncms};
}
export async function getSchema(ncm:string,refresh=false):Promise<Schema> {
 if(!/^\d{8}$/.test(ncm)) throw new Error('NCM deve conter 8 dígitos.');
 let db:Database;let live=true;
 try {
  if(!refresh&&Date.now()<retryAt)throw new Error('Aguardando nova tentativa de atualização');
  if(refresh||!cached||Date.now()>expires) {
   loading ||= load().then(d=>{cached=d;expires=Date.now()+3600000;retryAt=0;return d;}).finally(()=>{loading=null;});
   db=await loading;
  } else db=cached;
 } catch {retryAt=Date.now()+60000;db=(cached||bundled) as Database;live=false;}
 if(!Object.hasOwn(db.ncms,ncm)) throw new Error('NCM não encontrada na base oficial de atributos. Confira o código.');
 const attributes=db.ncms[ncm].filter(a=>inForce(a)).map(a=>({...db.attrs[a.codigo!],...a}) as Attribute);
 return {ncm,attributes,date:db.date,version:db.versao,live, ...(!live?{warning:`Não foi possível atualizar a base oficial. Usando a cópia de ${db.date}.`}:{}),...(!live&&db.date!==today()?{warning:`Base de ${db.date}. Atualize a consulta antes de exportar.`}:{})};
}
