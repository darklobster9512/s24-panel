CREATE TABLE public.work_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'uniform',
  days jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_schedules TO authenticated;
GRANT ALL ON public.work_schedules TO service_role;

ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees manage own schedule"
  ON public.work_schedules FOR ALL TO authenticated
  USING (public.is_my_employee_row(employee_id))
  WITH CHECK (public.is_my_employee_row(employee_id));

CREATE POLICY "Admins view all schedules"
  ON public.work_schedules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER work_schedules_updated_at
  BEFORE UPDATE ON public.work_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.work_schedule_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  days jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, week_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_schedule_weeks TO authenticated;
GRANT ALL ON public.work_schedule_weeks TO service_role;

ALTER TABLE public.work_schedule_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees manage own schedule weeks"
  ON public.work_schedule_weeks FOR ALL TO authenticated
  USING (public.is_my_employee_row(employee_id))
  WITH CHECK (public.is_my_employee_row(employee_id));

CREATE POLICY "Admins view all schedule weeks"
  ON public.work_schedule_weeks FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'manager'));

CREATE TRIGGER work_schedule_weeks_updated_at
  BEFORE UPDATE ON public.work_schedule_weeks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX work_schedule_weeks_week_idx ON public.work_schedule_weeks (week_start);