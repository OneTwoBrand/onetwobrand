'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { HeroConfigForm, StoreSettingsForm } from '../ShopConfigForm';

type Tab = 'vitrine' | 'frete' | 'comunicacao' | 'seo';

const TABS: { id: Tab; label: string }[] = [
  { id: 'vitrine',     label: 'Vitrine' },
  { id: 'frete',       label: 'Frete' },
  { id: 'comunicacao', label: 'Comunicação' },
  { id: 'seo',         label: 'SEO' },
];

export function LojaConfigTabs({ config }: { config: Record<string, string> }) {
  const [active, setActive] = useState<Tab>('vitrine');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-line mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              'shrink-0 px-4 py-2.5 text-[11px] font-medium tracking-[0.14em] uppercase transition-colors border-b-2 -mb-px',
              active === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-soft hover:text-ink'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === 'vitrine' && (
        <HeroConfigForm config={config} />
      )}

      {active === 'frete' && (
        <StoreSettingsForm config={config} section="frete" />
      )}

      {active === 'comunicacao' && (
        <StoreSettingsForm config={config} section="comunicacao" />
      )}

      {active === 'seo' && (
        <StoreSettingsForm config={config} section="seo" />
      )}
    </div>
  );
}
