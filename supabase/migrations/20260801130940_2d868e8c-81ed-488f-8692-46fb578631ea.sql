CREATE POLICY "Superadmin manages call scripts"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'call-scripts' AND public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (bucket_id = 'call-scripts' AND public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Employees read assigned call scripts"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'call-scripts'
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.call_script_path = storage.objects.name
      AND public.is_client_assigned_to_me(c.id)
  )
);