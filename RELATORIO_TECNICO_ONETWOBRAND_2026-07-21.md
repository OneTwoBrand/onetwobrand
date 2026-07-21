# Relatorio tecnico da plataforma OneTwoBrand

Data da revisao: 21/07/2026
Repositorio analisado: `C:\ONETWOBRAND\one-two`
Branch: `main`

## 1. Resumo executivo

A OneTwoBrand e uma plataforma web integrada para gestao de atelier e operacao de loja. O sistema cobre producao, bordagem, catalogo, estoque, clientes, vendas, financeiro, relatorios, negociacoes por WhatsApp, usuarios, configuracoes, assistente com IA e uma vitrine publica com carrinho, checkout e acompanhamento de pedidos.

A base usa Next.js 16 com App Router, React 19, TypeScript, Supabase/PostgreSQL, Stripe, Mercado Pago, Resend, OpenAI e Vercel. A revisao encontrou riscos importantes nos fluxos de pagamento, autorizacao, dados de clientes, webhooks, conteudo HTML e endpoints publicos. As correcoes de codigo foram implementadas e a verificacao automatizada terminou sem erros.

## 2. Arquitetura atual

- Frontend e backend web: Next.js App Router, Server Components, Client Components, Server Actions e Route Handlers.
- Persistencia e autenticacao: Supabase Auth, PostgreSQL, RLS e Storage.
- Pagamentos: Stripe para cartao e Mercado Pago para PIX e boleto.
- Comunicacao: Resend para convites, recuperacao de senha e notificacoes transacionais.
- Inteligencia artificial: OpenAI para chat, voz e refinamento de imagens.
- Estado local da loja: Zustand para carrinho e favoritos.
- Processamento visual: Sharp para normalizacao e conversao de imagens.
- Hospedagem prevista: Vercel, com endpoint protegido para consumo da fila de e-mails.

## 3. Modulos funcionais

- Atelier: dashboard, ordens de producao, historico, anexos e fluxo operacional.
- Bordagem: remessas, profissionais, prazos, valores e vinculos com OPs.
- Catalogo e estoque: colecoes, produtos, SKUs, imagens, saldos e movimentacoes.
- Comercial: clientes, vendas, negociacoes originadas pela loja e WhatsApp.
- Financeiro: contas a pagar, contas a receber, receitas, despesas e indicadores.
- Relatorios: vendas, producao, bordagem, estoque e resultados financeiros.
- Administracao: usuarios, funcoes, permissoes de navegacao e configuracoes.
- Loja: vitrine, colecoes, produto, carrinho, checkout, pagamento e conta da cliente.
- Fanpage institucional: apresentacao temporaria da marca com carrossel, canais de contato e modo publico controlado pelo painel.
- Assistente: consultas operacionais por texto e voz e tratamento de imagens.

## 4. Correcoes implementadas

### Pagamentos e pedidos

- O navegador nao define mais preco, desconto, frete ou total oficial do pedido.
- Produtos, estoque, cupom, desconto PIX e frete sao recalculados no servidor.
- Stripe e Mercado Pago recebem apenas um `orderId` pertencente a sessao da cliente.
- A funcao publica que permitia marcar um pedido como pago foi removida.
- Pagamentos passam a ser confirmados exclusivamente por webhooks assinados.
- Webhooks validam moeda, valor, pedido e identificador do pagamento.
- Foi adicionada idempotencia para impedir processamento repetido do mesmo evento.
- A tela de sucesso distingue pagamento aprovado de pagamento ainda pendente.

### Dados de clientes

- Foi criada sessao de cliente em cookie `HttpOnly`, `SameSite=Lax`, assinada com HMAC e validade de 30 dias.
- Pedidos, detalhes, progresso, perfil e enderecos agora exigem a sessao assinada.
- O e-mail editavel em `sessionStorage` deixou de ser credencial de acesso a dados.
- A assinatura da sessao usa `SHOP_SESSION_SECRET` ou `ENCRYPTION_SECRET`, com minimo de 32 caracteres.

### Autenticacao e autorizacao

- Convites usam um unico envio: Supabase gera o token e Resend entrega o link real.
- Recuperacao de senha segue o mesmo modelo, sem segundo e-mail ou link ficticio.
- Respostas de recuperacao nao revelam se o e-mail esta cadastrado.
- O parametro `next` do callback foi limitado a caminhos internos, bloqueando open redirect.
- O perfil padrao de novos cadastros passou de `admin` para `viewer`.
- A migration remove politicas RLS que davam CRUD completo a qualquer autenticado.
- Escrita operacional foi limitada a `admin` e `atelier`; `viewer` e somente leitura.
- `vendedora` recebeu escrita apenas nos dominios comerciais previstos.
- Alteracao de perfis e papeis ficou reservada a administradores.
- Uploads e refinamento de imagens agora validam a funcao do usuario.

### Endpoints, conteudo e infraestrutura

- Leads de WhatsApp agora usam Zod, limites de tamanho, total recalculado e rate limiting.
- O cron de notificacoes falha fechado sem `CRON_SECRET` e nao aceita segredo na URL.
- A fila de e-mails ganhou claim exclusivo para reduzir envios concorrentes duplicados.
- Chat, voz e imagem com IA ganharam limites de entrada, arquivo e frequencia de uso.
- Download de imagem para IA aceita apenas HTTPS no bucket conhecido do Supabase, mitigando SSRF.
- Conteudo editavel e JSON-LD passaram a escapar HTML e protocolos perigosos, mitigando XSS.
- Foram adicionados `nosniff`, `DENY`, HSTS, politica de referer, permissoes e CSP basica.
- Dados demonstrativos foram desativados em producao; em desenvolvimento exigem `ALLOW_DEMO_DATA=true`.
- Foi criado o modo publico `institucional`, que desativa a vitrine comercial e publica uma fanpage independente em `/apresentacao`.
- O ESLint passou a ignorar artefatos `.vercel` e todos os warnings antigos do fonte foram corrigidos.

## 5. Banco de dados

A migration `202607210001_security_hardening.sql` cria ou ajusta:

- funcoes auxiliares de papel do usuario e rate limiting;
- politicas RLS por funcao nos modulos operacionais;
- politicas de Storage por papel e pasta;
- tabela `payment_webhook_events` para idempotencia;
- claim da fila `shop_email_queue` por `processing_at`;
- tabela `api_rate_limits` e funcao atomica de controle;
- revogacao da funcao publica de progresso de pedidos;
- remocao das politicas abertas de escrita de pedidos e leads.

Esta migration foi criada e validada pelo build, mas nao foi aplicada ao Supabase remoto porque o repositorio local nao possui `supabase/config.toml` nem vinculacao de projeto. O deploy do codigo deve ocorrer somente depois da aplicacao dessa migration e da configuracao dos novos segredos.

## 6. Qualidade e validacao

- `npm run test`: 6 testes aprovados.
- `npm run lint`: zero erros e zero warnings.
- `npm run build`: compilacao, TypeScript e prerender das 63 paginas aprovados.
- `npm audit`: zero vulnerabilidades conhecidas em producao e desenvolvimento.
- `git diff --check`: sem erros de whitespace.
- Smoke test local: `/login`, `/loja` e `/conta/favoritos` responderam HTTP 200.
- Cabecalhos `X-Content-Type-Options` e `X-Frame-Options` confirmados no servidor local.

## 7. Configuracao obrigatoria antes do deploy

- Aplicar `supabase/migrations/202607210001_security_hardening.sql`.
- Configurar `SHOP_SESSION_SECRET`, `CRON_SECRET`, segredos Stripe e Mercado Pago.
- Registrar os webhooks de Stripe e Mercado Pago nas URLs de producao.
- Confirmar `NEXT_PUBLIC_SITE_URL`, remetente verificado do Resend e chaves Supabase.
- Executar uma compra de homologacao por cartao, PIX e boleto.
- Confirmar entrega de convite, recuperacao de senha e notificacao de producao.

## 8. Riscos residuais e proximos passos

- Nao foi possivel executar testes reais de gateway, e-mail ou banco remoto sem credenciais e eventos externos.
- A cobertura automatizada ainda e inicial; deve crescer para checkout, RBAC e webhooks com banco de teste.
- A reserva de estoque ocorre na confirmacao da venda. Para alto volume, recomenda-se reserva transacional com expiracao durante o pagamento para evitar disputa pela ultima unidade.
- Recomenda-se observabilidade centralizada para falhas de webhook, fila de e-mail, IA e tentativas bloqueadas.
- Recomenda-se politica de retencao e limpeza para `payment_webhook_events` e `api_rate_limits`.

## 9. Prognostico

Com a migration aplicada e os gateways homologados, a plataforma fica em condicao tecnicamente consistente para operacao controlada. A arquitetura e adequada ao porte atual e os limites entre atelier, loja e integracoes estao mais claros. O principal investimento seguinte deve ser confiabilidade operacional: testes de integracao, observabilidade, reserva transacional de estoque e rotina formal de deploy/migrations.
