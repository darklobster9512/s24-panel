
CREATE TABLE public.call_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  sipgate_call_id uuid REFERENCES public.sipgate_calls(id) ON DELETE SET NULL,
  anrufer_name text,
  anrufer_nummer text,
  anrufer_email text,
  anliegen text NOT NULL,
  kategorie text,
  prioritaet text NOT NULL DEFAULT 'normal',
  weitergeleitet_an text,
  rueckruf_gewuenscht boolean NOT NULL DEFAULT false,
  rueckruf_zeit text,
  ticket_erstellen boolean NOT NULL DEFAULT false,
  dauer_sekunden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_notes TO authenticated;
GRANT ALL ON public.call_notes TO service_role;

ALTER TABLE public.call_notes ENABLE ROW LEVEL SECURITY;

-- Owner (Mitarbeiter) darf lesen
CREATE POLICY "Employee reads own notes" ON public.call_notes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = call_notes.employee_id AND e.user_id = auth.uid()
  )
);

-- Superadmin darf alles lesen
CREATE POLICY "Superadmin reads all notes" ON public.call_notes
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- Insert: eigene employee_id UND Zuweisung auf Kunde
CREATE POLICY "Employee inserts own notes" ON public.call_notes
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = call_notes.employee_id AND e.user_id = auth.uid()
  )
  AND public.is_client_assigned_to_me(call_notes.client_id)
);

-- Superadmin insert
CREATE POLICY "Superadmin inserts notes" ON public.call_notes
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Update: eigener Mitarbeiter
CREATE POLICY "Employee updates own notes" ON public.call_notes
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = call_notes.employee_id AND e.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = call_notes.employee_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Superadmin updates notes" ON public.call_notes
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

-- Delete
CREATE POLICY "Employee deletes own notes" ON public.call_notes
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = call_notes.employee_id AND e.user_id = auth.uid()
  )
);

CREATE POLICY "Superadmin deletes notes" ON public.call_notes
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_call_notes_updated_at
BEFORE UPDATE ON public.call_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX call_notes_employee_created_idx ON public.call_notes (employee_id, created_at DESC);
CREATE INDEX call_notes_client_idx ON public.call_notes (client_id);
