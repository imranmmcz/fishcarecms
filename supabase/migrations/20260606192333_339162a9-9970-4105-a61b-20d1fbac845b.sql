
CREATE POLICY "Partners can read own partner docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'partner-documents'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Partners can upload own partner docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'partner-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Partners can update own partner docs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'partner-documents'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Partners can delete own partner docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'partner-documents'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);
