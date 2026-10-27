import type {Product,Values} from './catalog';
export type Batch={id:string;company:string;ncm:string;template:Product;items:Product[];updatedAt?:string};
export type RepeatField='denominacao'|'descricao'|'values'|'situacao';
export const emptyProduct:Product={cpfCnpjRaiz:'',ncm:'',denominacao:'',descricao:'',codigosInterno:[],situacao:'ATIVADO',values:{}};
export function newItem(template:Product,company:string,ncm:string):Product {return {...structuredClone(template),id:crypto.randomUUID(),cpfCnpjRaiz:company,ncm,codigo:undefined,versao:undefined,codigosInterno:[]};}
export function normalizeItems(batch:Batch):Product[] {return batch.items.map(p=>({...p,cpfCnpjRaiz:batch.company,ncm:batch.ncm,codigosInterno:p.codigosInterno.map(x=>x.trim()).filter(Boolean)}));}
const filled=(v:Values[string]|undefined)=>typeof v==='string'?!!v.trim():Array.isArray(v)&&v.some(x=>typeof x==='string'?!!x.trim():Object.values(x).some(Boolean));
export function repeatFields(items:Product[],template:Product,selected:Set<string>,fields:RepeatField[],overwrite:boolean):Product[] {
 return items.map(item=>{
  if(!selected.has(item.id!))return item;
  const next=structuredClone(item);
  for(const field of fields) {
   if(field==='values') {for(const [key,value] of Object.entries(template.values)) if(filled(value)&&(overwrite||!filled(next.values[key])))next.values[key]=structuredClone(value);}
   else if(field==='situacao') {if(overwrite)next.situacao=template.situacao;}
   else if(template[field].trim()&&(overwrite||!next[field].trim()))next[field]=template[field];
  }
  return next;
 });
}
export function cloneItem(item:Product):Product {return {...structuredClone(item),id:crypto.randomUUID(),codigo:undefined,versao:undefined,codigosInterno:[]};}
export function parsePaste(text:string):{code:string;name:string;description:string}[] {
 const rows:string[][]=[];let row:string[]=[];let cell='';let quoted=false;
 for(let i=0;i<text.length;i++) {const char=text[i];
  if(char==='"') {if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted||cell==='')quoted=!quoted;else cell+=char;}
  else if(!quoted&&char==='\t'){row.push(cell);cell='';}
  else if(!quoted&&(char==='\n'||char==='\r')) {if(char==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}
  else cell+=char;
 }
 if(quoted)throw new Error('Há aspas abertas no texto colado. Copie novamente as células.');
 row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.some(r=>r.length>3))throw new Error('Cole até três colunas: código interno, denominação e descrição.');
 if(rows.length&&/^(c[oó]digo|sku)/i.test(rows[0][0])&&/denomina[cç][aã]o|produto/i.test(rows[0][1]||''))rows.shift();
 if(!rows.length)throw new Error('Cole pelo menos uma linha com os dados de um produto.');
 if(rows.length>100)throw new Error('O lote aceita no máximo 100 itens.');
 const result=rows.map(r=>({code:r[0]?.trim()||'',name:r[1]?.trim()||'',description:r[2]?.trim()||''}));
 if(result.some(r=>r.code.length>60||r.name.length>120||r.description.length>3700))throw new Error('Uma célula excede o limite: código 60, denominação 120, descrição 3.700 caracteres.');
 return result;
}
