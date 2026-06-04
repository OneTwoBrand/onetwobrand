-- ONE TWO — Embroidery type configuration seed
-- Adds default option list for the embroidery shipment form.

insert into public.workflow_config (key, value) values
  ('embroidery_types', '["Ponto cruz","Richelieu","Floral à mão","Aplicação","Personalizada"]'::jsonb)
on conflict (key) do nothing;
