'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type ExportType = 'vendas' | 'producao' | 'bordagem' | 'estoque-baixo';

const LABELS: Record<ExportType, string> = {
  'vendas':        'Vendas do mês',
  'producao':      'Produção',
  'bordagem':      'Bordagem',
  'estoque-baixo': 'Estoque crítico',
};

export function ExportButton({ tipo }: { tipo: ExportType }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/export/relatorio?tipo=${tipo}`);
      if (!res.ok) { setLoading(false); return; }

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] ?? `${tipo}.csv`;

      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="soft"
      icon={<Download size={13} />}
      disabled={loading}
      onClick={handleExport}
    >
      {loading ? 'Exportando…' : `Exportar ${LABELS[tipo]}`}
    </Button>
  );
}
