'use client';

import { useActionState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SectionHead } from '@/components/ui/Primitives';
import {
  saveOpStatuses,
  saveProductionSteps,
  savePaymentMethods,
  saveSeamstressRoles,
} from './workflow-actions';
import type { WorkflowConfig } from '@/lib/workflow-config';

type State = { error?: string; success?: string };

function ConfigField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint: string;
  defaultValue: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-ink-soft uppercase tracking-[0.16em]">
        {label}
      </label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={5}
        className="w-full rounded-[12px] border border-line bg-surface px-3.5 py-3 text-[13px] text-ink resize-none focus:outline-none focus:border-primary transition-colors"
      />
      <p className="text-[10px] text-ink-soft leading-relaxed">{hint}</p>
    </div>
  );
}

function FormFeedback({ state }: { state: State }) {
  if (state.error) return <p className="text-[12px] text-danger">{state.error}</p>;
  if (state.success) return (
    <p className="flex items-center gap-1.5 text-[12px] text-success">
      <Check size={13} /> {state.success}
    </p>
  );
  return null;
}

export function OpStatusesForm({ config }: { config: WorkflowConfig }) {
  const [state, action, pending] = useActionState<State, FormData>(saveOpStatuses, {});
  return (
    <form action={action} className="space-y-4">
      <SectionHead eyebrow="Status" title="Status de ordem de produção" />
      <ConfigField
        name="op_statuses"
        label="Um status por linha"
        hint="Define os status disponíveis no kanban e no dropdown de alteração de status das OPs."
        defaultValue={config.op_statuses.join('\n')}
      />
      <FormFeedback state={state} />
      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Salvando…' : 'Salvar status'}
      </Button>
    </form>
  );
}

export function ProductionStepsForm({ config }: { config: WorkflowConfig }) {
  const [state, action, pending] = useActionState<State, FormData>(saveProductionSteps, {});
  return (
    <form action={action} className="space-y-4">
      <SectionHead eyebrow="Etapas" title="Etapas de produção" />
      <ConfigField
        name="production_steps"
        label="Uma etapa por linha"
        hint="Etapas exibidas no detalhe da OP (linha do tempo de progresso)."
        defaultValue={config.production_steps.join('\n')}
      />
      <FormFeedback state={state} />
      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Salvando…' : 'Salvar etapas'}
      </Button>
    </form>
  );
}

export function PaymentMethodsForm({ config }: { config: WorkflowConfig }) {
  const [state, action, pending] = useActionState<State, FormData>(savePaymentMethods, {});
  const defaultValue = config.payment_methods
    .map((m) => `${m.label}|${m.value}`)
    .join('\n');
  return (
    <form action={action} className="space-y-4">
      <SectionHead eyebrow="Pagamento" title="Formas de pagamento" />
      <ConfigField
        name="payment_methods"
        label="Uma forma por linha — formato: Nome|codigo"
        hint={'Exemplo:\nPIX|pix\nDinheiro|cash\nCrédito|credit\nO código (após |) é opcional — se omitido, é gerado automaticamente.'}
        defaultValue={defaultValue}
      />
      <FormFeedback state={state} />
      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Salvando…' : 'Salvar formas de pagamento'}
      </Button>
    </form>
  );
}

export function SeamstressRolesForm({ config }: { config: WorkflowConfig }) {
  const [state, action, pending] = useActionState<State, FormData>(saveSeamstressRoles, {});
  return (
    <form action={action} className="space-y-4">
      <SectionHead eyebrow="Costureiras" title="Funções disponíveis" />
      <ConfigField
        name="seamstress_roles"
        label="Uma função por linha"
        hint="Funções exibidas no cadastro de costureiras."
        defaultValue={config.seamstress_roles.join('\n')}
      />
      <FormFeedback state={state} />
      <Button type="submit" size="sm" disabled={pending} block>
        {pending ? 'Salvando…' : 'Salvar funções'}
      </Button>
    </form>
  );
}
