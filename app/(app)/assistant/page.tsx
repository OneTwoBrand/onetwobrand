import { AppBar, Topbar } from '@/components/layout/Navigation';
import { checkOpenAIConfigured } from '@/app/(app)/mais/actions';
import { AssistantChat } from './AssistantChat';

export default async function AssistantPage() {
  const configured = await checkOpenAIConfigured();

  return (
    <>
      <AppBar large eyebrow="Concierge digital" title="OneTwo Assistant" />
      <Topbar eyebrow="Concierge digital" title="OneTwo Assistant" />

      <main className="flex flex-1 flex-col px-5 pb-28 pt-3 md:px-9 md:py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
          <AssistantChat configured={configured} />
        </div>
      </main>
    </>
  );
}
