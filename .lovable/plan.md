## Ziel
Ranking-Filter neben dem Status-Filter ergänzen und Pagination (10 Bewerbungen pro Seite) einbauen.

## Umsetzung in `src/pages/superadmin/Bewerbungen.tsx`

1. **Ranking-Filter**
   - Neuer State `rankingFilter` mit Default `"all"`.
   - Zweites `Select` neben dem Status-Filter mit Optionen: „Alle Rankings", „Ohne Ranking" (`none`) und den vier `RANKING_OPTIONS`.
   - `filtered`-Memo erweitern: bei `rankingFilter !== "all"` filtern (`none` = `r.ranking == null`, sonst exakter Match).

2. **Pagination**
   - Konstante `PAGE_SIZE = 10`.
   - Neuer State `page` (Default 1).
   - `totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))`.
   - `paged = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)` in der Tabelle rendern.
   - `useEffect`: bei Änderung von `search`, `statusFilter`, `rankingFilter` → `page = 1`; falls `page > totalPages` → auf `totalPages` clampen.
   - Footer unter der Tabelle: „Zeige X–Y von Z" links, rechts Buttons „Zurück" / „Weiter" plus „Seite X / Y". Ausblenden, wenn nur eine Seite.
