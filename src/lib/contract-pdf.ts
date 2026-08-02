import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

// A4 @ 96dpi
const PAGE_W = 794;
const PAGE_H = 1123;
const MARGIN_X = 68; // ~18mm
const MARGIN_TOP = 76; // ~20mm
const MARGIN_BOTTOM = 84; // ~22mm (Platz für Fußzeile)
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const CONTENT_H = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM;

export type ContractPdfInput = {
  /** Gerendertes Vertrags-HTML (Platzhalter bereits ersetzt) */
  contentHtml: string;
  /** HTML des Unterschriftenblocks – wird nie umbrochen */
  signatureHtml: string;
  /** Titel für die Fußzeile */
  footerLabel?: string;
};

function makeHost(): HTMLDivElement {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = `${PAGE_W}px`;
  host.style.zIndex = "-1";
  host.style.background = "#ffffff";
  document.body.appendChild(host);
  return host;
}

function makePage(): HTMLDivElement {
  const page = document.createElement("div");
  page.className = "contract-pdf";
  page.style.width = `${PAGE_W}px`;
  page.style.height = `${PAGE_H}px`;
  page.style.background = "#ffffff";
  page.style.color = "#000000";
  page.style.boxSizing = "border-box";
  page.style.padding = `${MARGIN_TOP}px ${MARGIN_X}px ${MARGIN_BOTTOM}px`;
  page.style.position = "relative";
  page.style.overflow = "hidden";
  return page;
}

function makeFlow(): HTMLDivElement {
  const flow = document.createElement("div");
  flow.style.width = `${CONTENT_W}px`;
  flow.style.boxSizing = "border-box";
  return flow;
}

/** Wartet, bis alle <img> im Element geladen (oder fehlgeschlagen) sind. */
async function waitForImages(el: HTMLElement) {
  const imgs = Array.from(el.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

/**
 * Zerlegt einen zu hohen Block in kleinere Teile (Listen-Items bzw. Absätze),
 * damit nichts abgeschnitten wird.
 */
function splitTooTall(el: HTMLElement): HTMLElement[] {
  const tag = el.tagName.toLowerCase();
  if ((tag === "ul" || tag === "ol") && el.children.length > 1) {
    return Array.from(el.children).map((li) => {
      const clone = el.cloneNode(false) as HTMLElement;
      clone.appendChild(li.cloneNode(true));
      return clone;
    });
  }
  if (el.children.length > 1) {
    return Array.from(el.children).map((c) => c.cloneNode(true) as HTMLElement);
  }
  return [el];
}

function isHeading(el: HTMLElement) {
  return /^h[1-6]$/i.test(el.tagName) || el.dataset.keepWithNext === "true";
}

export async function generateContractPdfBlob(
  input: ContractPdfInput,
): Promise<Blob> {
  const host = makeHost();

  try {
    // 1) Messen: alle Blöcke in einem Mess-Container rendern
    const measurePage = makePage();
    const measureFlow = makeFlow();
    measurePage.appendChild(measureFlow);
    host.appendChild(measurePage);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = input.contentHtml;
    const sigBlock = document.createElement("div");
    sigBlock.innerHTML = input.signatureHtml;
    sigBlock.dataset.atomic = "true";

    const rawBlocks: HTMLElement[] = [];
    Array.from(wrapper.children).forEach((c) =>
      rawBlocks.push(c as HTMLElement),
    );
    rawBlocks.push(sigBlock);

    // Höhen messen + zu hohe Blöcke splitten
    type Block = { el: HTMLElement; height: number; heading: boolean };
    const blocks: Block[] = [];

    const measure = (el: HTMLElement): number => {
      measureFlow.innerHTML = "";
      measureFlow.appendChild(el);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      measureFlow.offsetHeight;
      const style = window.getComputedStyle(el);
      const mt = parseFloat(style.marginTop) || 0;
      const mb = parseFloat(style.marginBottom) || 0;
      const h = el.getBoundingClientRect().height + mt + mb;
      measureFlow.removeChild(el);
      return h;
    };

    for (const raw of rawBlocks) {
      const el = raw.cloneNode(true) as HTMLElement;
      const h = measure(el);
      if (h > CONTENT_H && el.dataset.atomic !== "true") {
        for (const part of splitTooTall(el)) {
          blocks.push({
            el: part,
            height: Math.min(measure(part), CONTENT_H),
            heading: isHeading(part),
          });
        }
      } else {
        blocks.push({ el, height: Math.min(h, CONTENT_H), heading: isHeading(el) });
      }
    }

    host.removeChild(measurePage);

    // 2) Blöcke auf Seiten verteilen
    const pages: HTMLElement[][] = [];
    let current: HTMLElement[] = [];
    let used = 0;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      let needed = b.height;
      // Überschrift nicht allein am Seitenende lassen
      if (b.heading && blocks[i + 1]) {
        needed += Math.min(blocks[i + 1].height, 60);
      }
      if (used > 0 && used + needed > CONTENT_H) {
        pages.push(current);
        current = [];
        used = 0;
      }
      current.push(b.el);
      used += b.height;
    }
    if (current.length) pages.push(current);
    if (!pages.length) pages.push([]);

    // 3) Jede Seite einzeln rendern
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    for (let p = 0; p < pages.length; p++) {
      const page = makePage();
      const flow = makeFlow();
      pages[p].forEach((el) => flow.appendChild(el));
      page.appendChild(flow);

      const footer = document.createElement("div");
      footer.style.position = "absolute";
      footer.style.left = `${MARGIN_X}px`;
      footer.style.right = `${MARGIN_X}px`;
      footer.style.bottom = `${Math.round(MARGIN_BOTTOM / 2.5)}px`;
      footer.style.display = "flex";
      footer.style.justifyContent = "space-between";
      footer.style.fontSize = "9px";
      footer.style.color = "rgba(0,0,0,0.45)";
      footer.innerHTML = `<span>${input.footerLabel ?? ""}</span><span>Seite ${p + 1} von ${pages.length}</span>`;
      page.appendChild(footer);

      host.appendChild(page);
      await waitForImages(page);

      const canvas = await html2canvas(page, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        width: PAGE_W,
        height: PAGE_H,
        windowWidth: PAGE_W,
      });
      host.removeChild(page);

      const img = canvas.toDataURL("image/jpeg", 0.95);
      if (p > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, pdfW, pdfH);
    }

    return pdf.output("blob");
  } finally {
    if (host.parentNode) host.parentNode.removeChild(host);
  }
}
