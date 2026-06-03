import { createClient } from '@/lib/supabase/server';

export type CurrentUserDisplay = {
  name: string;
  firstName: string;
  email: string;
  greeting: string;
};

function cleanName(value?: string | null) {
  return value?.trim().replace(/\s+/g, ' ') || '';
}

function titleCaseName(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase('pt-BR') + part.slice(1).toLocaleLowerCase('pt-BR'))
    .join(' ');
}

function getGreetingPrefix() {
  const hourText = new Intl.DateTimeFormat('pt-BR', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'America/Cuiaba',
  }).format(new Date());
  const hour = Number(hourText);

  if (hour < 5) return 'Boa noite';
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export async function getCurrentUserDisplay(): Promise<CurrentUserDisplay> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const prefix = getGreetingPrefix();
      return { name: 'Usuária', firstName: 'Usuária', email: '', greeting: prefix };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const rawName = cleanName(
      profile?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0]
    );
    const name = titleCaseName(rawName || 'Usuária');
    const firstName = name.split(' ')[0] || name;
    const prefix = getGreetingPrefix();

    return {
      name,
      firstName,
      email: user.email ?? '',
      greeting: `${prefix}, ${firstName}`,
    };
  } catch {
    const prefix = getGreetingPrefix();
    return { name: 'Usuária', firstName: 'Usuária', email: '', greeting: prefix };
  }
}
