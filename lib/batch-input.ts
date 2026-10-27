import {z} from 'zod';
import {productInput} from './product-input';
const draftProduct=productInput.extend({cpfCnpjRaiz:z.string().max(11),ncm:z.string().max(8),denominacao:z.string().max(120),codigosInterno:z.array(z.string().max(60)).max(100),id:z.string().uuid().optional()});
export const batchInput=z.object({id:z.string().uuid(),company:z.string().max(11),ncm:z.string().max(8),template:draftProduct,items:z.array(draftProduct.extend({id:z.string().uuid()})).min(1).max(100)}).superRefine((b,ctx)=>{if(new Set(b.items.map(p=>p.id)).size!==b.items.length)ctx.addIssue({code:'custom',message:'Os itens do lote devem ter identificadores diferentes.'});});
