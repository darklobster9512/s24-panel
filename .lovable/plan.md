## Problem

`/mitarbeiter/arbeitsvertrag` zeigt „Vertragsvorlage wurde nicht gefunden", obwohl der Datensatz in `employee_contracts` eine gültige `template_id` hat. Ursache: Auf `public.contract_templates` existiert nur eine RLS-Policy für Superadmins. Beim eingebetteten Join (`template:contract_templates(...)`) liefert PostgREST für die Mitarbeiter-Rolle deshalb `"template": null`.

## Fix

Neue RLS-SELECT-Policy auf `public.contract_templates` anlegen, die einem Mitarbeiter Zugriff auf genau die Vorlagen erlaubt, die ihm über `employee_contracts` zugewiesen sind.

### Migration

```sql
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
```

Die bestehende Superadmin-Policy bleibt unverändert.

## Nicht Teil des Plans

- Kein Frontend-Änderung nötig — der Guard bleibt bestehen für den echten Fehlerfall (Vorlage gelöscht).
- Andere Tabellen (`company_signature` etc.) sind für diesen Bug irrelevant.
