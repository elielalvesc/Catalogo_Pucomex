import type {Batch} from './batch';

/** Portal Único FabricanteIntegracaoDTO, exported separately from ProdutoIntegracaoDTO. */
export function manufacturerLinks(batch:Batch) {
 if(!/^\d{8}$|^\d{11}$/.test(batch.company))throw new Error('Informe a raiz do CNPJ ou CPF do lote.');
 if(!batch.items.length||batch.items.length>100)throw new Error('O arquivo de vínculos aceita de 1 a 100 itens.');
 const errors:string[]=[];
 const links:{seq:number;cpfCnpjRaiz:string;codigoProduto:number;codigoPais:string;codigoOperadorEstrangeiro:string;conhecido:boolean;vincular:boolean}[]=[];
 const used=new Set<string>();
 batch.items.forEach((item,index)=>{
  const code=item.manufacturer?.code.trim()||'';
  const country=item.manufacturer?.country.trim().toUpperCase()||'';
  if(!code&&!country)return;
  const prefix=`Item ${index+1}: `;
  if(!code||code.length>35)errors.push(prefix+'informe o código do fabricante já cadastrado (até 35 caracteres).');
  if(!/^[A-Z]{2}$/.test(country)||country==='BR')errors.push(prefix+'informe o país do operador estrangeiro em duas letras, por exemplo CN.');
  const portalCode=item.portalProductCode?.trim()||'';
  if(!/^\d{1,10}$/.test(portalCode)||Number(portalCode)<1)errors.push(prefix+'informe o código do produto no Portal Único após importar os produtos. Não use o número da linha ou o código interno.');
  const key=`${Number(portalCode)}:${country}:${code}`;
  if(used.has(key))errors.push(prefix+'vínculo repetido para o mesmo produto e fabricante. Confira os códigos do Portal.');
  used.add(key);
  links.push({seq:links.length+1,cpfCnpjRaiz:batch.company,codigoProduto:Number(portalCode),codigoPais:country,codigoOperadorEstrangeiro:code,conhecido:true,vincular:true});
 });
 if(errors.length)throw new Error(errors.join('\n'));
 if(!links.length)throw new Error('Informe código e país do fabricante em pelo menos um item.');
 return links;
}
