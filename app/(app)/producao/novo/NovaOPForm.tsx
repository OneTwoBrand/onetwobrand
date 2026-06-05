'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, Textarea } from '@/components/ui/Field';
import { Card, Divider } from '@/components/ui/Primitives';
import { productionOrderSchema, type ProductionOrderForm } from '@/lib/production/schema';

type ProductOption = { id: string; name: string; color?: string | null; category?: string | null; collectionName?: string | null };

type Props = {
  seamstresses: { id: string; name: string }[];
  embroideryTypes: string[];
  sizes: string[];
  collections: string[];
  products: ProductOption[];
};

export function NovaOPForm({ seamstresses, embroideryTypes, sizes, products }: Props) {
  const [createdOrder, setCreatedOrder] = useState<{ opNumber: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductionOrderForm>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      collection: '',
      model: '',
      color: '',
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

  function handleProductSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedId = e.target.value;
    const product = products.find((p) => p.id === selectedId);
    if (product) {
      setValue('pieceId', product.id);
      setValue('productName', product.name);
      if (product.color) setValue('color', product.color);
      if (product.category) setValue('collection', product.category);
    } else {
      setValue('pieceId', '');
    }
  }

  async function onSubmit(data: ProductionOrderForm) {
    setSubmitError(null);
    setCreatedOrder(null);

    const response = await fetch('/api/production-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const payload = await response.json();

    if (!response.ok) {
      setSubmitError(payload.error ?? 'Não foi possível criar a OP.');
      return;
    }

    setCreatedOrder(payload.order);
  }

  return (
    <main className="flex-1 px-5 pb-28 pt-3 md:px-9 md:py-8">
      <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <Card pad={20}>
          <div className="mb-5">
            <p className="m-0 text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">
              Cadastro assistido
            </p>
            <h1 className="m-0 mt-2 font-serif text-[30px] font-normal leading-[1.05] text-ink">
              Dados da produção
            </h1>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Cliente"
              placeholder="Nome do cliente"
              error={errors.clientName?.message}
              {...register('clientName')}
            />

            {/* Produto — select dos cadastrados; fallback para texto livre */}
            {products.length > 0 ? (
              <div className="flex flex-col gap-1">
                <Select label="Produto" onChange={handleProductSelect} defaultValue="">
                  <option value="">Selecione o produto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.color ? ` — ${p.color}` : ''}
                    </option>
                  ))}
                </Select>
                <input type="hidden" {...register('pieceId')} />
                <input type="hidden" {...register('productName')} />
                {errors.productName && (
                  <p className="text-[11px] text-danger">{errors.productName.message}</p>
                )}
              </div>
            ) : (
              <Input
                label="Produto"
                placeholder="Ex: Vestido Lis"
                error={errors.productName?.message}
                {...register('productName')}
              />
            )}

            <Select label="Tamanho" error={errors.size?.message} {...register('size')}>
              <option value="">Selecione</option>
              {sizes.map((item) => <option key={item}>{item}</option>)}
            </Select>

            <Input
              label="Quantidade"
              type="number"
              min={1}
              error={errors.quantity?.message}
              {...register('quantity', { valueAsNumber: true })}
            />

            {/* Costureira — select com dados reais do banco */}
            {seamstresses.length > 0 ? (
              <Select label="Costureira" error={errors.seamstressName?.message} {...register('seamstressName')}>
                <option value="">Selecione</option>
                {seamstresses.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </Select>
            ) : (
              <Input
                label="Costureira"
                placeholder="Nome da costureira"
                error={errors.seamstressName?.message}
                {...register('seamstressName')}
              />
            )}

            <Select label="Tipo de bordagem" error={errors.embroideryType?.message} {...register('embroideryType')}>
              <option value="">Selecione</option>
              {embroideryTypes.map((item) => <option key={item}>{item}</option>)}
            </Select>
            <Input
              label="Prazo"
              type="date"
              error={errors.dueDate?.message}
              {...register('dueDate')}
            />
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
              {isSubmitting ? 'Criando...' : 'Criar OP'}
            </Button>
          </div>
        </Card>

        <aside className="space-y-5">
          <Card pad={18}>
            <p className="m-0 text-[10px] font-medium uppercase tracking-wide-2 text-ink-soft">Preview</p>
            <h2 className="m-0 mt-3 font-serif text-[26px] font-normal leading-[1.05] text-ink">{previewTitle}</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
              {preview.clientName || 'Cliente'} · {preview.quantity || 1} peça(s)
            </p>
            <Divider className="my-4" />
            <dl className="grid gap-3 text-[12px]">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Tamanho</dt>
                <dd className="text-right text-ink">{preview.size || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Bordagem</dt>
                <dd className="text-right text-ink">{preview.embroideryType || '-'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Prazo</dt>
                <dd className="text-right text-ink">{preview.dueDate || '-'}</dd>
              </div>
            </dl>
          </Card>

          <Card pad={18}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Sparkles size={18} strokeWidth={1.5} />
            </div>
            <h2 className="m-0 font-serif text-[22px] font-normal text-ink">Pronto para o Assistente</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">
              Este formulário já separa os campos para preenchimento assistido pela inteligência artificial do OneTwo Assistente.
            </p>
          </Card>

          {createdOrder && (
            <Card className="border-success bg-success-soft" pad={18}>
              <p className="m-0 text-[13px] font-medium text-success">OP {createdOrder.opNumber} criada com sucesso.</p>
              <p className="mt-1 text-[12px] text-ink-soft">
                A ordem foi registrada no Supabase.
              </p>
              <Link href="/producao" className="mt-3 inline-block text-[11px] font-medium uppercase tracking-wide-2 text-success">
                Ver produção →
              </Link>
            </Card>
          )}

          {submitError && (
            <Card className="border-warning bg-warning-soft" pad={18}>
              <p className="m-0 text-[13px] font-medium text-warning">Não foi possível criar a OP.</p>
              <p className="mt-1 text-[12px] text-ink-soft">{submitError}</p>
            </Card>
          )}
        </aside>
      </form>
    </main>
  );
}
