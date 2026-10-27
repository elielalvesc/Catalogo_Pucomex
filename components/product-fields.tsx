"use client";
import {Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Attribute,Values} from '@/lib/catalog';
export function Choice({id,value,onChange,items,placeholder='Selecione uma opção',allowClear=false}:{id:string;value:string;onChange:(v:string)=>void;items:{codigo:string;descricao:string}[];placeholder?:string;allowClear?:boolean}) {
 return <Select value={value||''} onValueChange={v=>onChange(v==='__clear__'?'':v)}><SelectTrigger id={id} className="field-select"><SelectValue placeholder={placeholder}/></SelectTrigger><SelectContent position="popper">{allowClear?<SelectItem value="__clear__">Limpar resposta</SelectItem>:null}{items.map(d=><SelectItem key={d.codigo} value={d.codigo}>{d.descricao} <span className="choice-code">{d.codigo}</span></SelectItem>)}</SelectContent></Select>;
}
export function AttributeField({a,values,onChange,idPrefix=''}:{a:Attribute;values:Values;onChange:(key:string,v:string|string[])=>void;idPrefix?:string}) {
 const controlId=idPrefix+a.codigo;
 const raw=values[a.codigo];const val=typeof raw==='string'?raw:'';const chosen=Array.isArray(raw)?raw.filter(x=>typeof x==='string') as string[]:val?[val]:[];
 const hint=a.orientacaoPreenchimento||a.definicao;
 const field=(value:string,change:(v:string)=>void,id:string)=>a.formaPreenchimento==='LISTA_ESTATICA'?<Choice allowClear id={id} value={value} onChange={change} items={a.dominio||[]}/>:a.formaPreenchimento==='BOOLEANO'?<Choice allowClear id={id} value={value} onChange={change} items={[{codigo:'true',descricao:'Sim'},{codigo:'false',descricao:'Não'}]}/>:<Input id={id} value={value} onChange={e=>change(e.target.value)} maxLength={Math.min(a.tamanhoMaximo||100,100)} type={a.formaPreenchimento==='DATA'?'date':'text'} inputMode={a.formaPreenchimento.includes('NUMERO')?'decimal':'text'} placeholder={a.formaPreenchimento==='NUMERO_REAL'?'Ex.: 2.50':'Informe o valor'}/>;
 return <div className="attribute"><div className="attribute-top"><label htmlFor={a.multivalorado?`${controlId}-0`:controlId}>{a.nomeApresentacao}{a.obrigatorio?<span className="required"> *</span>:<span className="optional"> opcional</span>}</label><code>{a.codigo}</code></div>
 {a.formaPreenchimento==='COMPOSTO'?<p className="notice warning">Atributo composto: o preenchimento deste tipo ainda não está disponível.</p>:a.multivalorado?<div className="multi-values">{(chosen.length?chosen:['']).map((v,i)=><div key={i} className="multi-row">{field(v,newValue=>{const next=[...(chosen.length?chosen:[''])];next[i]=newValue;onChange(a.codigo,next);},`${controlId}-${i}`)}<Button variant="ghost" type="button" onClick={()=>onChange(a.codigo,chosen.filter((_,j)=>j!==i))} aria-label={`Remover valor ${i+1} de ${a.nomeApresentacao}`}>Remover</Button></div>)}<Button type="button" variant="outline" onClick={()=>onChange(a.codigo,[...chosen,''])}><Plus size={15}/> Adicionar valor</Button></div>:field(val,v=>onChange(a.codigo,v),controlId)}
 {hint?<p className="field-hint">{hint}</p>:null}{a.orgaos?.length?<p className="organs">{a.orgaos.join(' · ')}</p>:null}</div>;
}
