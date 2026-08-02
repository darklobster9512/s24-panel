/**
 * Standard-Gesprächsleitfaden für Recruitment-Kunden.
 * Wird im Kunden-Wizard (Schritt "Konfiguration") per Button in den Editor eingefügt.
 */
export const CALL_SCRIPT_TEMPLATE = `
<h1>Bewerber-Onboarding – Gesprächsleitfaden</h1>

<h2>1. Begrüßung</h2>
<p>Hallo Herr/Frau [Name],</p>
<p>mein Name ist [Name] von [Firmenname].</p>
<p>Vielen Dank für Ihre Bewerbung und dafür, dass Sie sich heute Zeit für unser Gespräch nehmen.</p>
<p>Bevor wir starten, hätte ich noch eine kurze Frage:</p>
<p><strong>Wäre es für Sie in Ordnung, wenn wir uns duzen?</strong> Bei uns im Unternehmen sprechen wir uns alle mit „Du“ an – das macht die Zusammenarbeit meist etwas persönlicher und unkomplizierter.</p>
<p><em>(Falls Zustimmung)</em></p>
<p>Perfekt, danke dir! Dann lass uns direkt loslegen.</p>

<h2>2. Kennenlernen</h2>
<p>Bevor ich dir die Tätigkeit vorstelle, würde ich gerne kurz etwas über dich erfahren.</p>
<ul>
  <li>Was machst du aktuell beruflich?</li>
  <li>Bist du derzeit angestellt, selbstständig oder in einer anderen beruflichen Situation?</li>
  <li>Suchst du aktuell eine Teilzeit- oder Nebentätigkeit?</li>
  <li>Wie viele Stunden pro Woche möchtest du ungefähr arbeiten?</li>
  <li>Ab wann könntest du starten?</li>
</ul>

<h2>3. Vorstellung der Tätigkeit</h2>
<p>Dann möchte ich dir kurz erklären, worum es bei der Tätigkeit geht.</p>
<p>Du unterstützt Unternehmen dabei, ihre Webseiten, Apps und digitalen Prozesse aus der Sicht eines normalen Nutzers zu testen.</p>
<p>Ziel ist es herauszufinden, wie benutzerfreundlich die Anwendungen sind und an welchen Stellen Verbesserungen möglich sind.</p>
<p>Zu deinen Aufgaben gehören beispielsweise:</p>
<ul>
  <li>Webseiten testen</li>
  <li>Apps testen</li>
  <li>Registrierungsprozesse testen</li>
  <li>Identitäts- und Verifizierungsprozesse testen</li>
  <li>Dein Feedback dokumentieren</li>
</ul>
<p>Du benötigst dafür <strong>keine technischen Vorkenntnisse.</strong></p>
<p>Alles, was du brauchst, ist:</p>
<ul>
  <li>ein Smartphone,</li>
  <li>optional einen Laptop oder Computer,</li>
  <li>eine Internetverbindung und</li>
  <li>für bestimmte Testaufträge ein gültiges Ausweisdokument.</li>
</ul>
<p>Die meisten neuen Mitarbeiter können nach einer kurzen Einführung direkt mit den ersten Testaufträgen beginnen.</p>
<p><strong>Klingt das grundsätzlich nach einer Tätigkeit, die du dir vorstellen kannst?</strong></p>

<h2>4. Registrierung</h2>
<p>Super. Dann begleite ich dich jetzt durch die Registrierung.</p>
<p>Du erhältst gleich eine E-Mail mit deinem persönlichen Zugang zum Mitarbeiterportal.</p>
<p>Sobald die E-Mail angekommen ist, öffne bitte den darin enthaltenen Link. Dieser führt dich direkt zur Registrierung.</p>
<p>Ich warte kurz, bis du alles abgeschlossen hast.</p>
<p><em>(Warten.)</em></p>
<p>Perfekt.</p>

<h2>5. Das Mitarbeiterportal</h2>
<p>Du befindest dich jetzt im Mitarbeiterportal. Hier findest du zukünftig alle verfügbaren Testaufträge.</p>
<p>Oben siehst du deinen aktuellen Bearbeitungsstand. Unten rechts findest du unseren Support-Chat.</p>
<p>Solltest du später Fragen haben oder Hilfe benötigen, kannst du dich jederzeit dort melden.</p>
<p>Zum Einstieg stehen dir zwei Probeaufgaben zur Verfügung. Diese dienen dazu,</p>
<ul>
  <li>dich mit unserem System vertraut zu machen,</li>
  <li>den Ablauf kennenzulernen und</li>
  <li>zu sehen, wie du bei der Durchführung solcher Prozesstests arbeitest.</li>
</ul>
<p>Klicke dafür einfach auf „Start“ und folge den einzelnen Anweisungen.</p>
<p>Im Rahmen der Probeaufgaben testest du zwei Webseiten und dokumentierst anschließend dein Feedback.</p>
<p>Der Zeitaufwand beträgt ungefähr <strong>30 Minuten</strong>. Die Probeaufgaben sollten innerhalb von <strong>48 Stunden</strong> abgeschlossen werden.</p>

<h2>6. Wichtige Hinweise</h2>
<p>Während der Probeaufgaben kann es vorkommen, dass Testkonten oder Testzugänge erstellt werden. Diese dienen ausschließlich der Durchführung unserer internen Prozesstests.</p>
<p>Es handelt sich <strong>nicht</strong> um reale Kontoeröffnungen oder tatsächliche Vertragsabschlüsse. Alle dabei entstehenden Unterlagen gehören zum jeweiligen Testauftrag.</p>
<p>Je nach Aufgabe bitten wir dich zusätzlich, einige Informationen zu dokumentieren, zum Beispiel:</p>
<ul>
  <li>wie lange der Versand gedauert hat,</li>
  <li>ob Briefe oder Unterlagen unbeschädigt angekommen sind,</li>
  <li>oder wie der gesamte Ablauf aus deiner Sicht funktioniert hat.</li>
</ul>
<p>Diese Rückmeldungen sind ein wichtiger Bestandteil unserer Qualitätsprüfung.</p>
<p>Nach Abschluss eines entsprechenden Testauftrags erhältst du von uns eine schriftliche Bestätigung, dass der jeweilige Testzugang wieder gelöscht wurde. Damit ist der Vorgang vollständig abgeschlossen.</p>

<h2>7. Die nächsten Schritte</h2>
<p>Sobald du beide Probeaufgaben abgeschlossen hast, werden diese von unserem Team geprüft.</p>
<p>Anschließend melden wir uns telefonisch oder per E-Mail bei dir und informieren dich über das Ergebnis sowie die weiteren Schritte.</p>
<p>Bitte achte darauf, dass du in den nächsten Tagen sowohl telefonisch als auch per E-Mail gut erreichbar bist.</p>

<h2>8. Verbindlicher Abschluss</h2>
<p>Wann planst du ungefähr, die beiden Probeaufgaben abzuschließen?</p>
<p><em>(Antwort notieren.)</em></p>
<p>Perfekt, ich habe mir das notiert.</p>
<p>Die Probeaufgaben sollten möglichst innerhalb der nächsten <strong>48 Stunden</strong> erledigt werden.</p>
<p>Falls du aus irgendeinem Grund mehr Zeit benötigst oder etwas dazwischenkommt, gib mir einfach kurz Bescheid. Dann können wir das entsprechend vermerken.</p>
<p>Sobald deine Probeaufgaben erfolgreich geprüft wurden, informieren wir dich über die nächsten Schritte.</p>

<h2>9. Abschluss</h2>
<p>Hast du im Moment noch Fragen?</p>
<p>Falls später noch etwas unklar sein sollte, kannst du dich selbstverständlich jederzeit bei uns melden.</p>
<p>Dann bedanke ich mich herzlich für deine Zeit und dein Interesse.</p>
<p>Ich wünsche dir viel Erfolg bei den Probeaufgaben und freue mich auf die weitere Zusammenarbeit.</p>
<p>Herzlich willkommen bei [Firmenname]!</p>
`.trim();
