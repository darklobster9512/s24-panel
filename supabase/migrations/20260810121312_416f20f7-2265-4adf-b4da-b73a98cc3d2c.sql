CREATE POLICY "Managers manage onboarding appointments"
ON public.onboarding_appointments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'manager'))
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can view employees"
ON public.employees FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can view employee contracts"
ON public.employee_contracts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'manager'));