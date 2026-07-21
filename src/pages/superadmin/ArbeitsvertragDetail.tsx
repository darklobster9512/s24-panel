import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSignature,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, Panel } from "@/components/superadmin/SuperadminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { renderContractHtml } from "@/lib/render-contract";

type Contract = {
  id: string;
  employee_id: string;
  template_id: string;
  status: "pending_employee" | "pending_admin" | "completed";
  employee_signature_data_url: string | null;
  signed_at: string | null;
  admin_confirmed_at: string | null;
  pdf_path: string | null;
  employee: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    login_email: string | null;
    personal_email: string | null;
    personal_phone: string | null;
    birth_date: string | null;
    birth_place: string | null;
    marital_status: string | null;
    contract_type: string | null;
    start_date: string | null;
    salary: number | null;
    iban: string | null;
    bic: string | null;
    bank_name: string | null;
    tax_id: string | null;
    social_security_number: string | null;
    health_insurance: string | null;
  } | null;
  template: {
    id: string;
    title: string;
    content_html: string;
    monthly_salary: number | null;
  } | null;
};

type Signature = {
  signer_name: string;
  signer_title: string;
  signature_url: string | null;
};

export default function ArbeitsvertragDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const previewRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const q = useQuery({
    enabled: !!id,
    queryKey: ["employee-contract", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("employee_contracts")
        .select(
          "id, employee_id, template_id, status, employee_signature_data_url, signed_at, admin_confirmed_at, pdf_path, employee:employees(*), template:contract_templates(id, title, content_html, monthly_salary)",
        )
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as Contract | null;
    },
  });

  const signatureQ = useQuery({
    queryKey: ["company-signature"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("company_signature")
        .select("signer_name, signer_title, signature_url")
        .eq("singleton", true)
        .maybeSingle();
      return (data as Signature | null) ?? null;
    },
  });

  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  useMemo(async () => {
    if (signatureQ.data?.signature_url) {
      const { data } = await supabase.storage
        .from("contract-assets")
        .createSignedUrl(signatureQ.data.signature_url, 3600);
      setSignatureUrl(data?.signedUrl ?? null);
    }
  }, [signatureQ.data?.signature_url]);

  const [pdfSignedUrl, setPdfSignedUrl] = useState<string | null>(null);
  useMemo(async () => {
    if (q.data?.pdf_path) {
      const { data } = await supabase.storage
        .from("contract-assets")
        .createSignedUrl(q.data.pdf_path, 3600);
      setPdfSignedUrl(data?.signedUrl ?? null);
    }
  }, [q.data?.pdf_path]);

  const contract = q.data;
  const emp = contract?.employee;

  const renderedHtml = useMemo(() => {
    if (!contract?.template || !emp) return "";
    return renderContractHtml(contract.template.content_html, {
      vorname: emp.first_name,
      nachname: emp.last_name,
      email: emp.personal_email ?? emp.login_email,
      telefon: emp.personal_phone,
      geburtsdatum: emp.birth_date,
      geburtsort: emp.birth_place,
      familienstand: emp.marital_status,
      beschaeftigungsart: emp.contract_type,
      startdatum: emp.start_date,
      iban: emp.iban,
      bic: emp.bic,
      bank: emp.bank_name,
      steuer_id: emp.tax_id,
      sv_nummer: emp.social_security_number,
      krankenkasse: emp.health_insurance,
      monatsgehalt: emp.salary ?? contract.template.monthly_salary,
    });
  }, [contract, emp]);

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!contract || !user) throw new Error("Nicht bereit");
      setGenerating(true);
      // Render to PDF via html2canvas
      const el = previewRef.current;
      if (!el) throw new Error("Vorschau nicht gefunden");
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 40;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = 20;
      pdf.addImage(imgData, "JPEG", 20, position, imgW, imgH);
      heightLeft -= pageH - 40;
      while (heightLeft > 0) {
        position = heightLeft - imgH + 20;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 20, position, imgW, imgH);
        heightLeft -= pageH - 40;
      }
      const blob = pdf.output("blob");
      const path = `contracts/${contract.employee_id}/${contract.id}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("contract-assets")
        .upload(path, blob, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (upErr) throw upErr;
      const { error } = await (supabase as any)
        .from("employee_contracts")
        .update({
          status: "completed",
          admin_confirmed_at: new Date().toISOString(),
          admin_confirmed_by: user.id,
          pdf_path: path,
        })
        .eq("id", contract.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Arbeitsvertrag bestätigt und PDF erstellt");
      qc.invalidateQueries({ queryKey: ["employee-contract", id] });
      qc.invalidateQueries({ queryKey: ["employee-contracts"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setGenerating(false),
  });

  if (q.isLoading) {
    return (
      <Panel>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lade…
        </div>
      </Panel>
    );
  }
  if (!contract || !emp) {
    return (
      <Panel>
        <div className="py-10 text-center text-sm text-muted-foreground">
          Nicht gefunden.
        </div>
      </Panel>
    );
  }

  const fullName = [emp.first_name, emp.last_name].filter(Boolean).join(" ") || "—";
  const canConfirm = contract.status === "pending_admin";
  const isCompleted = contract.status === "completed";

  return (
    <>
      <PageHeader
        title={`Arbeitsvertrag: ${fullName}`}
        subtitle={contract.template?.title}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/superadmin/arbeitsvertraege">
              <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel className="!p-0">
          <div className="max-h-[80vh] overflow-y-auto">
            <div
              ref={previewRef}
              className="mx-auto max-w-3xl bg-white p-10 text-black"
              style={{ minHeight: "1123px", width: "794px" }}
            >
              <div
                className="prose prose-sm max-w-none"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />

              <div className="mt-16 grid grid-cols-2 gap-8">
                <div>
                  <div className="mb-2 border-b border-black/30 pb-1 text-xs uppercase tracking-wider text-black/60">
                    Arbeitgeber
                  </div>
                  {signatureUrl ? (
                    <img
                      src={signatureUrl}
                      alt="Firmenunterschrift"
                      className="mb-1 max-h-20"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="mb-1 h-20" />
                  )}
                  <div className="text-sm font-semibold">
                    {signatureQ.data?.signer_name ?? "—"}
                  </div>
                  <div className="text-xs text-black/60">
                    {signatureQ.data?.signer_title ?? ""}
                  </div>
                </div>
                <div>
                  <div className="mb-2 border-b border-black/30 pb-1 text-xs uppercase tracking-wider text-black/60">
                    Arbeitnehmer
                  </div>
                  {contract.employee_signature_data_url ? (
                    <img
                      src={contract.employee_signature_data_url}
                      alt="Unterschrift Mitarbeiter"
                      className="mb-1 max-h-20"
                    />
                  ) : (
                    <div className="mb-1 h-20" />
                  )}
                  <div className="text-sm font-semibold">{fullName}</div>
                  <div className="text-xs text-black/60">
                    {contract.signed_at
                      ? `Unterzeichnet am ${new Date(contract.signed_at).toLocaleDateString("de-DE")}`
                      : "Noch nicht unterzeichnet"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <h3 className="mb-3 text-sm font-semibold">Status</h3>
            <Badge variant="outline">
              {contract.status === "pending_employee" && "Wartet auf Mitarbeiter"}
              {contract.status === "pending_admin" && "Wartet auf Bestätigung"}
              {contract.status === "completed" && "Abgeschlossen"}
            </Badge>
            {contract.signed_at && (
              <p className="mt-3 text-xs text-muted-foreground">
                Mitarbeiter-Signatur: {new Date(contract.signed_at).toLocaleString("de-DE")}
              </p>
            )}
            {contract.admin_confirmed_at && (
              <p className="mt-1 text-xs text-muted-foreground">
                Bestätigt: {new Date(contract.admin_confirmed_at).toLocaleString("de-DE")}
              </p>
            )}
          </Panel>

          {canConfirm && (
            <Panel>
              <h3 className="mb-2 text-sm font-semibold">Bestätigen</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                Der Mitarbeiter hat unterzeichnet. Bestätige den Vertrag — wir generieren dann
                das finale PDF mit beiden Unterschriften.
              </p>
              <Button
                onClick={() => confirmMutation.mutate()}
                disabled={confirmMutation.isPending || generating}
                className="w-full gap-2"
              >
                {confirmMutation.isPending || generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Bestätigen & PDF generieren
              </Button>
            </Panel>
          )}

          {isCompleted && pdfSignedUrl && (
            <Panel>
              <h3 className="mb-2 text-sm font-semibold">Finales PDF</h3>
              <Button asChild className="w-full gap-2">
                <a href={pdfSignedUrl} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" /> Herunterladen
                </a>
              </Button>
            </Panel>
          )}

          <Panel>
            <h3 className="mb-3 text-sm font-semibold">
              <FileSignature className="mr-2 inline h-4 w-4" />
              Ausgefüllte Daten
            </h3>
            <div className="space-y-1.5 text-xs">
              <DataRow label="E-Mail" value={emp.personal_email} />
              <DataRow label="Telefon" value={emp.personal_phone} />
              <DataRow label="Geburtsdatum" value={emp.birth_date} />
              <DataRow label="Geburtsort" value={emp.birth_place} />
              <DataRow label="Familienstand" value={emp.marital_status} />
              <DataRow label="IBAN" value={emp.iban} />
              <DataRow label="BIC" value={emp.bic} />
              <DataRow label="Bank" value={emp.bank_name} />
              <DataRow label="Steuer-ID" value={emp.tax_id} />
              <DataRow label="SV-Nummer" value={emp.social_security_number} />
              <DataRow label="Krankenkasse" value={emp.health_insurance} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

function DataRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium">
        {value ?? "—"}
      </span>
    </div>
  );
}
