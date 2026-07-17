
CREATE POLICY "Superadmins read contract-assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contract-assets' AND public.has_role(auth.uid(),'superadmin'));

CREATE POLICY "Superadmins insert contract-assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contract-assets' AND public.has_role(auth.uid(),'superadmin'));

CREATE POLICY "Superadmins update contract-assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contract-assets' AND public.has_role(auth.uid(),'superadmin'));

CREATE POLICY "Superadmins delete contract-assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contract-assets' AND public.has_role(auth.uid(),'superadmin'));
