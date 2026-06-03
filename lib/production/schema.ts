import { z } from 'zod';

export const productionOrderSchema = z.object({
  clientName: z.string().min(2, 'Informe a cliente.'),
  productName: z.string().min(2, 'Informe o produto.'),
  collection: z.string().min(1, 'Selecione a coleção.'),
  model: z.string().min(2, 'Informe o modelo.'),
  color: z.string().min(2, 'Informe a cor.'),
  size: z.string().min(1, 'Selecione o tamanho.'),
  quantity: z.number().int().min(1, 'Quantidade mínima: 1.').max(99, 'Quantidade máxima: 99.'),
  embroideryType: z.string().min(1, 'Selecione a bordagem.'),
  seamstressName: z.string().min(2, 'Informe a costureira.'),
  dueDate: z.string().min(1, 'Informe o prazo.'),
  observations: z.string().max(600, 'Use até 600 caracteres.').optional(),
});

export type ProductionOrderForm = z.infer<typeof productionOrderSchema>;
