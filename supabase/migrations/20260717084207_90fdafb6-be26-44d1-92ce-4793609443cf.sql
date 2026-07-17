
CREATE TABLE public.assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, client_id)
);

CREATE INDEX assignments_employee_id_idx ON public.assignments(employee_id);
CREATE INDEX assignments_client_id_idx ON public.assignments(client_id);

GRANT SELECT, INSERT, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can view assignments"
  ON public.assignments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can create assignments"
  ON public.assignments FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'superadmin') AND created_by = auth.uid());

CREATE POLICY "Superadmins can delete assignments"
  ON public.assignments FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'));
