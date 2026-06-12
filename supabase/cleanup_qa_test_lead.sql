-- Remove o lead de teste inserido durante a validação do fluxo de negociação por sacola.
-- Executar uma vez no Supabase SQL Editor e depois pode apagar este arquivo.

DELETE FROM public.whatsapp_leads
WHERE tipo = 'sacola'
  AND cliente_email = 'qa@test.com'
  AND cliente_nome  = 'Teste QA';
