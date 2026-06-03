'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { AppBar, Topbar } from '@/components/layout/Navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, Textarea } from '@/components/ui/Field';
import { Card, Divider } from '@/components/ui/Primitives';

const productionOrderSchema = z.object({
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

type ProductionOrderForm = z.infer<typeof productionOrderSchema>;

const collections = ['Premium', 'Bordados', 'Casual', 'Verão', 'Inverno'];
const sizes = ['PP', 'P', 'M', 'G', 'GG'];
const embroideryTypes = ['Sem bordagem', 'Frontal', 'Floral à mão', 'Personalizada', 'Aplicação'];

export default function NewProductionOrderPage() {
  const [createdOrder, setCreatedOrder] = useState<ProductionOrderForm | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProductionOrderForm>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      collection: '',
      size: '',
      embroideryType: '',
      quantity: 1,
    },
  });

  const preview = useWatch({ control });
  const previewTitle = useMemo(() => {
    const name = preview.productName || 'Nova peça';
    const color = preview.color ? ` — ${preview.color}` : '';
    return `${name}${color}`;
  }, [preview.productName, preview.color]);

  function onSubmit(data: ProductionOrderForm) {
    setCreatedOrder(data);
  }

  return (
    <>
      <AppBar title="Nova OP" back action={<Link href="/producao" className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">Cancelar</Link>} />
      <Topbar
        eyebrow="Produção"
        title="Nova ordem"
        action={<Link href="/producao"><Button size="sm" variant="ghost" icon={<ArrowLeft size={14} />}>Voltar</Button></Link>}
      />

      <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <Card pad={20}>
            <div className="mb-5">
              <p className="m-0 text-[10px] font-medium uppercase tracking-[0.24em] text-ink-soft">
                Cadastro assistido
              </p>
              <h1 className="m-0 mt-2 font-serif text-[30px] font-normal leading-[1.05] text-ink">
                Dados da produção
              </h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Cliente" placeholder="Clara Bianchi" error={errors.clientName?.message} {...register('clientName')} />
              <Input label="Produto" placeholder="Vestido Lis" error={errors.productName?.message} {...register('productName')} />
              <Select label="Coleção" error={errors.collection?.message} {...register('collection')}>
                <option value="">Selecione</option>
                {collections.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Input label="Modelo" placeholder="Oversized, midi, cropped..." error={errors.model?.message} {...register('model')} />
              <Input label="Cor" placeholder="Preta, linho cru..." error={errors.color?.message} {...register('color')} />
              <Select label="Tamanho" error={errors.size?.message} {...register('size')}>
                <option value="">Selecione</option>
                {sizes.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Input label="Quantidade" type="number" min={1} error={errors.quantity?.message} {...register('quantity', { valueAsNumber: true })} />
              <Input label="Costureira" placeholder="Maria Helena" error={errors.seamstressName?.message} {...register('seamstressName')} />
              <Select label="Tipo de bordagem" error={errors.embroideryType?.message} {...register('embroideryType')}>
                <option value="">Selecione</option>
                {embroideryTypes.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Input label="Prazo" type="date" error={errors.dueDate?.message} {...register('dueDate')} />
              <Textarea
                className="md:col-span-2"
                label="Observações"
                placeholder="Detalhes de tecido, acabamento, bordagem, prova ou entrega."
                error={errors.observations?.message}
                {...register('observations')}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link href="/producao">
                <Button type="button" variant="secondary" block>Cancelar</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} iconRight={<Check size={16} />}>
                Criar OP
              </Button>
            </div>
          </Card>

          <aside className="space-y-5">
            <Card pad={18}>
              <p className="m-0 text-[10px] font-medium uppercase tracking-[0.24em] text-ink-soft">Preview</p>
              <h2 className="m-0 mt-3 font-serif text-[26px] font-normal leading-[1.05] text-ink">{previewTitle}</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                {preview.clientName || 'Cliente'} · {preview.quantity || 1} peça(s)
              </p>
              <Divider className="my-4" />
              <dl className="grid gap-3 text-[12px]">
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Coleção</dt><dd className="text-right text-ink">{preview.collection || '-'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Tamanho</dt><dd className="text-right text-ink">{preview.size || '-'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Bordagem</dt><dd className="text-right text-ink">{preview.embroideryType || '-'}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-ink-soft">Prazo</dt><dd className="text-right text-ink">{preview.dueDate || '-'}</dd></div>
              </dl>
            </Card>

            <Card pad={18}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Sparkles size={18} strokeWidth={1.5} />
              </div>
              <h2 className="m-0 font-serif text-[22px] font-normal text-ink">Preparado para IA</h2>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
                Este formulário já separa os campos para futuro preenchimento assistido pelo OneTwo Assistant.
              </p>
            </Card>

            {createdOrder && (
              <Card className="border-success bg-success-soft" pad={18}>
                <p className="m-0 text-[13px] font-medium text-success">OP preparada com sucesso.</p>
                <p className="mt-1 text-[12px] text-ink-soft">
                  Integração com Supabase será ativada quando o ambiente oficial estiver configurado.
                </p>
              </Card>
            )}
          </aside>
        </form>
      </main>
    </>
  );
}
