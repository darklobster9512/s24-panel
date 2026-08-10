# Onboarding-Termine für Manager freigeben

Manager-Konten sollen den Reiter "Onboarding-Termine" im Panel sehen und nutzen können.

## Was geändert wird

1. **Sidebar**: Für Manager wird neben "Bewerbungsgespräche" und "Livechat" auch "Onboarding-Termine" (inkl. Tages-Badge) angezeigt.
2. **Route**: `/superadmin/onboarding-termine` wird aus der reinen Superadmin-Gruppe in die Gruppe verschoben, die Superadmin und Manager erlaubt.
3. **Datenbank-Zugriff**: Aktuell darf laut Policies nur Superadmin auf `onboarding_appointments` zugreifen — ohne Anpassung sieht ein Manager eine leere Seite. Zusätzlich braucht die Seite Lesezugriff auf Mitarbeiter- und Arbeitsvertragsdaten für die Status-Spalten (Konto / AV / Onboarding), die derzeit ebenfalls nur Superadmin lesen darf.

## Technische Details

- `src/App.tsx`: Route `onboarding-termine` in den `RequireRole allow={["superadmin","manager"]}`-Block verschieben.
- `src/components/superadmin/AppSidebar.tsx`: Manager-Zweig um den Onboarding-Termine-Eintrag ergänzen.
- Migration: Policies ergänzen
  - `onboarding_appointments`: Manager dürfen ansehen, anlegen, ändern, löschen.
  - `employees`: Manager dürfen lesen (nur lesend, für Status-Spalten).
  - `employee_contracts`: Manager dürfen lesen (nur lesend, für AV-Status).

## Offen

Falls Manager Onboarding-Termine nur ansehen (nicht anlegen/ändern) sollen, sag Bescheid — dann werden die Policies auf reines Lesen beschränkt und die Bearbeiten-Aktionen ausgeblendet.
