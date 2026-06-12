'use client';

import { useTransition, useState } from 'react';
import { MessageCircle, ExternalLink, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Primitives';
import { Badge } from '@/components/ui/Badge';
import { brl } from '@/lib/utils';
import { updateLeadStatus } from './actions';

type Status = 'novo' | 'em_atendimento' | 'fechado' | 'perdido';

const STATUS_LABEL: Record<Status, string> = {
  novo:           'Novo',
  em_atendimento: 'Em atendimento',
  fechado:        'Fechado',
  perdido:        'Perdido',
};

const STATUS_TONE: Record<Status, 'primary' | 'secondary' | 'success' | 'danger' | 'neutral'> = {
  novo:           'primary',
  em_atendimento: 'secondary',
  fechado:        'success',
  perdido:        'neutral',
};

const NEXT_STATUSES: Record<Status, Status[]> = {
  novo:           ['em_atendimento', 'fechado', 'perdido'],
  em_atendimento: ['fechado', 'perdido', 'novo'],
  fechado:        ['novo', 'em_atendimento', 'perdido'],
  perdido:        ['novo', 'em_atendimento'],
};

interface SacolaItem {
  nome: string;
  tamanho: string | null;
  qty: number;
  preco: number;
}

interface Lead {
  id: string;
  tipo: 'produto' | 'sacola';
  produto_slug: string | null;
  produto_nome: string | null;
  tamanho: string | null;
  url: string | null;
  cliente_nome: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  itens: SacolaItem[] | null;
  total: number | null;
  status: Status;
  notas: string | null;
  created_at: string;
}

interface Props {
  lead: Lead;
  waHref: string | null;
}

export function LeadCard({ lead, waHref }: Props) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [notas, setNotas] = useState(lead.notas ?? '');

  const createdAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(lead.created_at));

  function handleStatus(status: Status) {
    startTransition(async () => {
      await updateLeadStatus(lead.id, status);
    });
  }

  function handleSaveNotas() {
    startTransition(async () => {
      await updateLeadStatus(lead.id, lead.status, notas);
    });
  }

  const isSacola = lead.tipo === 'sacola';

  // Mensagem de retomada: para sacola, prioriza o telefone que a própria cliente
  // informou no checkout (waHref da cliente); senão usa o número da loja.
  const clienteWaHref = lead.cliente_telefone
    ? `https://wa.me/55${lead.cliente_telefone.replace(/\D/g, '')}`
    : null;
  const waMessage = isSacola
    ? `Olá${lead.cliente_nome ? ` ${lead.cliente_nome.split(' ')[0]}` : ''}! Estou retomando o contato sobre a sua sacola no atelier ONE TWO${lead.total ? ` (total ${brl(lead.total)})` : ''}. Posso ajudar a finalizar?`
    : `Olá! Estou retomando o contato sobre a peça *${lead.produto_nome}*${lead.tamanho ? ` (tamanho ${lead.tamanho})` : ''}. Posso ajudar?`;
  const baseWaHref = clienteWaHref ?? waHref;
  const waLink = baseWaHref
    ? `${baseWaHref}?text=${encodeURIComponent(waMessage)}`
    : null;

  const title = isSacola
    ? `Sacola${lead.itens?.length ? ` · ${lead.itens.length} ${lead.itens.length === 1 ? 'item' : 'itens'}` : ''}`
    : (lead.produto_nome ?? 'Produto');

  return (
    <Card pad={16}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isSacola && (
              <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-primary">Sacola</span>
            )}
            <p className="font-serif text-[17px] text-ink leading-snug truncate">{title}</p>
          </div>
          {!isSacola && lead.tamanho && (
            <p className="mt-0.5 text-[11px] text-ink-soft">Tamanho {lead.tamanho}</p>
          )}
          {isSacola && lead.cliente_nome && (
            <p className="mt-0.5 text-[11px] text-ink-soft truncate">
              {lead.cliente_nome}
              {lead.cliente_telefone ? ` · ${lead.cliente_telefone}` : ''}
            </p>
          )}
          <p className="mt-1 text-[10px] text-ink-mute">{createdAt}</p>
        </div>
        <Badge tone={STATUS_TONE[lead.status]} size="sm">{STATUS_LABEL[lead.status]}</Badge>
      </div>

      {/* Itens da sacola */}
      {isSacola && lead.itens && lead.itens.length > 0 && (
        <div className="mt-3 rounded-[12px] border border-line bg-surface px-3 py-2.5">
          <ul className="space-y-1">
            {lead.itens.map((item, i) => (
              <li key={i} className="flex justify-between gap-2 text-[12px]">
                <span className="text-ink min-w-0 truncate">
                  {item.nome}{item.tamanho ? ` · ${item.tamanho}` : ''} × {item.qty}
                </span>
                <span className="shrink-0 text-ink-soft">{brl(item.preco * item.qty)}</span>
              </li>
            ))}
          </ul>
          {lead.total != null && (
            <div className="mt-2 flex justify-between border-t border-line pt-2 text-[12px] font-medium">
              <span className="text-ink">Total</span>
              <span className="font-serif text-[15px] text-ink">{brl(lead.total)}</span>
            </div>
          )}
          {lead.cliente_email && (
            <p className="mt-2 text-[10px] text-ink-mute truncate">{lead.cliente_email}</p>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="mt-3 flex flex-wrap gap-2">
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-ink hover:border-[#25D366] hover:text-[#25D366] transition-colors"
          >
            <MessageCircle size={13} />
            Abrir WhatsApp
          </a>
        )}
        {lead.url && (
          <a
            href={lead.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-ink-soft hover:text-ink transition-colors"
          >
            <ExternalLink size={13} />
            Ver produto
          </a>
        )}

        {/* Mudar status */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            disabled={isPending}
            className="flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-ink-soft hover:text-ink transition-colors disabled:opacity-50"
          >
            Mover para <ChevronDown size={11} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
          </button>
          {open && (
            <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-[12px] border border-line bg-paper shadow-s2">
              {NEXT_STATUSES[lead.status].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { handleStatus(s); setOpen(false); }}
                  className="flex w-full items-center px-4 py-2.5 text-left text-[12px] text-ink hover:bg-surface first:rounded-t-[12px] last:rounded-b-[12px] transition-colors"
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notas */}
      <div className="mt-3 border-t border-line pt-3 space-y-2">
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Anotações sobre esta negociação…"
          rows={2}
          className="w-full resize-none rounded-[10px] border border-line bg-surface px-3 py-2 text-[12px] text-ink placeholder:text-ink-mute focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSaveNotas}
          disabled={isPending || notas === (lead.notas ?? '')}
          className="text-[11px] font-medium text-primary disabled:opacity-40 hover:underline"
        >
          {isPending ? 'Salvando…' : 'Salvar anotação'}
        </button>
      </div>
    </Card>
  );
}
