
-- Insert default invoice print settings if they don't exist
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES 
  ('invoice_template', 'modern', 'Default invoice template: minimal, modern, pos, detailed'),
  ('invoice_language_mode', 'bn', 'Invoice language: bn, en, dual'),
  ('invoice_paper_size', 'a4', 'Paper size: a4, pos80'),
  ('invoice_logo_position', 'left', 'Logo position: left, center, right'),
  ('invoice_show_qr', 'false', 'Show QR code on invoice'),
  ('invoice_show_payment_method', 'true', 'Show payment method'),
  ('invoice_show_product_image', 'false', 'Show product images'),
  ('invoice_show_tax', 'false', 'Show tax/VAT'),
  ('invoice_footer_text', '', 'Custom footer text'),
  ('invoice_footer_text_bn', '', 'Custom footer text in Bengali'),
  ('invoice_primary_color', '#167850', 'Invoice primary color'),
  ('invoice_social_facebook', '', 'Facebook link for invoice'),
  ('invoice_social_youtube', '', 'YouTube link for invoice')
ON CONFLICT (setting_key) DO NOTHING;
