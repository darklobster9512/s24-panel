CREATE POLICY "Employees can read their assigned template"
  ON public.contract_templates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.employee_contracts ec
      JOIN public.employees e ON e.id = ec.employee_id
      WHERE ec.template_id = contract_templates.id
        AND e.user_id = auth.uid()
    )
  );