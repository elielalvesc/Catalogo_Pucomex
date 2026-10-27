export type Condition = { operador: string; valor: string; composicao?: string; condicao?: Condition };
export type Attribute = {
  codigo: string; nome?: string; nomeApresentacao: string; formaPreenchimento: string;
  obrigatorio?: boolean; multivalorado?: boolean; tamanhoMaximo?: number; casasDecimais?: number;
  dataInicioVigencia?: string; dataFimVigencia?: string; orientacaoPreenchimento?: string; definicao?: string;
  dominio?: {codigo: string; descricao: string}[]; objetivos?: {codigo:number; descricao:string}[];
  orgaos?: string[]; listaSubatributos?: Attribute[];
  condicionados?: {atributo:Attribute; condicao:Condition; obrigatorio:boolean; multivalorado:boolean; dataInicioVigencia?:string; dataFimVigencia?:string}[];
};
export type Values = Record<string, string | string[] | Record<string,string>[] >;
export type Product = {id?:string; cpfCnpjRaiz:string; ncm:string; denominacao:string; descricao:string; codigosInterno:string[]; situacao:'ATIVADO'|'RASCUNHO'; codigo?:number; versao?:string; values:Values; updatedAt?:string};
export type Schema = {ncm:string; attributes:Attribute[]; date:string; version:string; live:boolean; warning?:string};
export function today() { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date()); }
export function inForce(x:{dataInicioVigencia?:string;dataFimVigencia?:string}, date=today()) {return (!x.dataInicioVigencia || x.dataInicioVigencia<=date) && (!x.dataFimVigencia || x.dataFimVigencia>=date);}
export function conditionMatches(c:Condition, value:string):boolean {
  if (!value) return false;
  const result=c.operador==='==' ? value===c.valor : c.operador==='!=' ? value!==c.valor : (()=>{throw new Error('Operador de condição não suportado: '+c.operador)})();
  if (!c.condicao) return result;
  if(c.composicao==='||') return result || conditionMatches(c.condicao,value);
  if(c.composicao==='&&') return result && conditionMatches(c.condicao,value);
  throw new Error('Composição de condição não suportada');
}
export function activeAttributes(attrs:Attribute[], values:Values):Attribute[] {
  const result=new Map<string,Attribute>();
  function visit(a:Attribute) {
    if(!inForce(a)) return;
    const previous=result.get(a.codigo); result.set(a.codigo,{...a,obrigatorio:a.obrigatorio||previous?.obrigatorio});
    const raw=values[a.codigo]; const vals=typeof raw==='string' ? [raw] : Array.isArray(raw) && typeof raw[0]==='string' ? raw as string[] : [];
    for(const c of a.condicionados||[]) if(inForce(c) && vals.some(v=>conditionMatches(c.condicao,v))) visit({...c.atributo,obrigatorio:c.obrigatorio,multivalorado:c.multivalorado});
  }
  attrs.forEach(visit);return [...result.values()];
}
export function validateValue(a:Attribute,v:string) {
  const name=a.nomeApresentacao;
  if (!v.trim()) return a.obrigatorio ? `${name}: preenchimento obrigatório.` : null;
  if(v.length>Math.min(a.tamanhoMaximo||100,100)) return `${name}: limite de ${Math.min(a.tamanhoMaximo||100,100)} caracteres.`;
  if(a.formaPreenchimento==='LISTA_ESTATICA' && !a.dominio?.some(d=>d.codigo===v)) return `${name}: selecione uma opção válida.`;
  if(a.formaPreenchimento==='BOOLEANO' && !['true','false'].includes(v)) return `${name}: informe sim ou não.`;
  if(a.formaPreenchimento==='NUMERO_INTEIRO' && !/^-?\d+$/.test(v)) return `${name}: informe um número inteiro.`;
  if(a.formaPreenchimento==='NUMERO_REAL' && !/^-?\d+(\.\d+)?$/.test(v)) return `${name}: use ponto para os decimais.`;
  if(a.formaPreenchimento==='NUMERO_REAL' && a.casasDecimais!==undefined && (v.split('.')[1]?.length||0)>a.casasDecimais) return `${name}: máximo de ${a.casasDecimais} casas decimais.`;
  if(a.formaPreenchimento==='DATA' && (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(Date.parse(v)) || new Date(v).toISOString().slice(0,10)!==v)) return `${name}: data inválida.`;
  if(!['LISTA_ESTATICA','BOOLEANO','TEXTO','NUMERO_INTEIRO','NUMERO_REAL','DATA'].includes(a.formaPreenchimento)) return `${name}: este tipo de atributo ainda exige tratamento específico.`;
  return null;
}
export function validateProduct(p:Product,s:Schema):string[] {
 const errors:string[]=[];
 if(!/^\d{8}$|^\d{11}$/.test(p.cpfCnpjRaiz)) errors.push('Informe a raiz do CNPJ (8 dígitos) ou CPF (11 dígitos).');
 if(!/^\d{8}$/.test(p.ncm)||s.ncm!==p.ncm) errors.push('Consulte os atributos da NCM informada.');
 if(!p.denominacao.trim()||p.denominacao.length>120) errors.push('Denominação: preencha até 120 caracteres.');
 if(p.descricao.length>3700) errors.push('Descrição: máximo de 3.700 caracteres.');
 if(p.codigosInterno.some(x=>!x.trim()||x.length>60)) errors.push('Código interno: preencha até 60 caracteres por código.');
 if(p.codigo!==undefined && (!Number.isInteger(p.codigo)||p.codigo<1||p.codigo>9999999999)) errors.push('Código PUCOMEX inválido.');
 if(p.versao && (!p.codigo || !/^\d+(\.\d+)?$/.test(p.versao)||p.versao.length>8)) errors.push('Retificação: informe o código e uma versão válida.');
 for(const a of activeAttributes(s.attributes,p.values)) {
  const raw=p.values[a.codigo];
  if(a.formaPreenchimento==='COMPOSTO') {errors.push(`${a.nomeApresentacao}: atributo composto ainda não suportado.`);continue;}
  const vals=typeof raw==='string'?[raw]:Array.isArray(raw)&&raw.every(x=>typeof x==='string')?raw as string[]:[];
  if(!vals.length && a.obrigatorio) errors.push(`${a.nomeApresentacao}: preenchimento obrigatório.`);
  for(const v of vals) {const err=validateValue(a,v);if(err) errors.push(err);}
 }
 return errors;
}
export function serializeProduct(p:Product,s:Schema,seq:number) {
 const attrs=activeAttributes(s.attributes,p.values);
 const attributes=attrs.filter(a=>!a.multivalorado).flatMap(a=>{const v=p.values[a.codigo];return typeof v==='string'&&v.trim()?[{atributo:a.codigo,valor:v}]:[];});
 const multi=attrs.filter(a=>a.multivalorado).flatMap(a=>{const v=p.values[a.codigo];const vals=Array.isArray(v)?v.filter(x=>typeof x==='string'&&x.trim()) as string[]:typeof v==='string'&&v.trim()?[v]:[];return vals.length?[{atributo:a.codigo,valores:[...new Set(vals)]}]:[];});
 return {seq,denominacao:p.denominacao.trim(),descricao:p.descricao.trim(),cpfCnpjRaiz:p.cpfCnpjRaiz,situacao:p.situacao,modalidade:'IMPORTACAO',ncm:p.ncm,...(p.codigo?{codigo:p.codigo}:{}),...(p.versao?{versao:p.versao}:{}),atributos:attributes,atributosMultivalorados:multi,atributosCompostos:[],atributosCompostosMultivalorados:[],codigosInterno:p.codigosInterno};
}
