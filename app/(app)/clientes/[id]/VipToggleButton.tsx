'use client';

import { useTransition, useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toggleVip } from '../novo/actions';

export function VipToggleButton({ clientId, isVip }: { clientId: string; isVip: boolean }) {
  const [vip, setVip] = useState(isVip);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleVip(clientId, vip);
      if (!result.error) setVip((v) => !v);
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={vip ? 'primary' : 'secondary'}
      onClick={handleToggle}
      disabled={isPending}
      icon={<Star size={13} className={vip ? 'fill-current' : ''} />}
    >
      {isPending ? '...' : vip ? 'VIP' : 'Marcar VIP'}
    </Button>
  );
}
