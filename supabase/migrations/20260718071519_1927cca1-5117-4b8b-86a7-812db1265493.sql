
-- Helper: prüft ob ein Kunde dem aktuell eingeloggten Mitarbeiter zugewiesen ist
CREATE OR REPLACE FUNCTION public.is_client_assigned_to_me(_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.employees e ON e.id = a.employee_id
    WHERE a.client_id = _client_id
      AND e.user_id = auth.uid()
  )
$$;

-- Mitarbeiter darf zugewiesene Kunden lesen
CREATE POLICY "Employees can view assigned clients"
ON public.clients
FOR SELECT
TO authenticated
USING (public.is_client_assigned_to_me(id));

-- Mitarbeiter darf seine eigenen Assignment-Zeilen sehen
CREATE POLICY "Employees can view own assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = assignments.employee_id
      AND e.user_id = auth.uid()
  )
);

-- Mitarbeiter darf seinen eigenen employees-Datensatz sehen
CREATE POLICY "Employees can view own record"
ON public.employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
