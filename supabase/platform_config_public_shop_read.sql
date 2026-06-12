-- ════════════════════════════════════════════════════════════════════
-- ONE TWO — Leitura pública das configurações da LOJA
-- ════════════════════════════════════════════════════════════════════
-- Problema: platform_config só permitia SELECT para role='admin'.
-- A loja pública (/produto, /checkout) roda sem usuário autenticado e
-- precisa ler flags como shop_enable_cart / shop_enable_whatsapp_button /
-- shop_whatsapp para decidir o que exibir. Com a policy antiga,
-- getPlatformConfig() retornava null no contexto público → a sacola e o
-- botão de WhatsApp nunca apareciam para a cliente.
--
-- Solução: permitir SELECT público APENAS para chaves com prefixo 'shop_'.
-- Chaves sensíveis (ex.: openai_api_key) continuam restritas ao admin.
-- O valor segue criptografado (value_enc); estas flags não são segredo.
--
-- Executar no Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════════

drop policy if exists "public read shop config" on public.platform_config;

create policy "public read shop config"
  on public.platform_config for select
  using ( key like 'shop\_%' );
