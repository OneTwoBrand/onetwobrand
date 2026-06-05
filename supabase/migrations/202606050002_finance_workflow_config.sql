-- ONE TWO — Finance workflow configuration seed
-- Adds default supplier/destination and payable category lists.

insert into public.workflow_config (key, value) values
  (
    'finance_suppliers',
    '["Bordadeira","Fornecedor de tecido","Aluguel do atelier","Correios","Marketing","Impostos","Serviços","Outros"]'::jsonb
  ),
  (
    'finance_categories',
    '["Fornecedor","Bordagem","Aluguel","Material","Transporte","Marketing","Impostos","Serviços","Outros"]'::jsonb
  )
on conflict (key) do nothing;
