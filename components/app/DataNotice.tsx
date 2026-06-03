import { Badge } from '@/components/ui/Badge';

export function DataNotice({ source, error }: { source: 'supabase' | 'fallback'; error?: string }) {
  if (source === 'supabase') {
    return null;
  }

  return (
    <div className="mb-4 flex flex-col gap-2 rounded-[14px] border border-line bg-paper px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="text-[12px] font-medium text-ink">Dados demonstrativos em uso</div>
        <div className="mt-1 text-[11px] text-ink-soft">
          {error ? `Supabase: ${error}` : 'Faça login para carregar dados reais do Supabase.'}
        </div>
      </div>
      <Badge tone="warning" size="sm">Fallback</Badge>
    </div>
  );
}
