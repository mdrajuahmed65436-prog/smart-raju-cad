import { jsPDF } from 'jspdf';
import type { Object3D } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export interface RasterImage {
  dataUrl: string;
  width: number;
  height: number;
}

export interface ReportSection {
  heading: string;
  lines: string[];
}

function triggerDownload(href: string, filename: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function svgToPng(svg: SVGSVGElement, pixelWidth = 2400): Promise<RasterImage> {
  const vb = svg.viewBox.baseVal;
  const pixelHeight = Math.round((pixelWidth * vb.height) / vb.width);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(pixelWidth));
  clone.setAttribute('height', String(pixelHeight));
  const xml = new XMLSerializer().serializeToString(clone);
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot render the blueprint image.');
  ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
  return { dataUrl: canvas.toDataURL('image/png'), width: pixelWidth, height: pixelHeight };
}

export function downloadPng(image: RasterImage, filename: string): void {
  triggerDownload(image.dataUrl, filename);
}

export function downloadBlueprintPdf(image: RasterImage, filename: string): void {
  const pdf = new jsPDF({
    orientation: image.width >= image.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [image.width, image.height],
  });
  pdf.addImage(image.dataUrl, 'PNG', 0, 0, image.width, image.height);
  pdf.save(filename);
}

export function exportGlb(root: Object3D, filename: string): Promise<void> {
  root.updateMatrixWorld(true);
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(
      root,
      (result) => {
        if (!(result instanceof ArrayBuffer)) {
          reject(new Error('The 3D model could not be packaged.'));
          return;
        }
        downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), filename);
        resolve();
      },
      () => reject(new Error('The 3D model could not be exported.')),
      { binary: true }
    );
  });
}

export function exportStl(root: Object3D, filename: string): void {
  root.updateMatrixWorld(true);
  const data = new STLExporter().parse(root, { binary: true }) as DataView;
  downloadBlob(new Blob([data], { type: 'model/stl' }), filename);
}

export function downloadReportPdf(title: string, sections: ReportSection[], filename: string): void {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 48;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text(title, margin, y);
  y += 28;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(`Generated ${new Date().toLocaleDateString()} by Smart Raju CAD`, margin, y);
  y += 28;

  for (const section of sections) {
    ensureSpace(40);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text(section.heading, margin, y);
    y += 18;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    for (const line of section.lines) {
      const wrapped = pdf.splitTextToSize(line, pageWidth - margin * 2) as string[];
      ensureSpace(wrapped.length * 14);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 14;
    }
    y += 12;
  }

  pdf.save(filename);
}
