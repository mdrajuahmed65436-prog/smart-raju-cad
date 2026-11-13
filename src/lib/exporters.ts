import { jsPDF } from 'jspdf';
import type { Object3D } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export interface ReportSection {
  heading: string;
  lines: string[];
}

const BLUEPRINT_PIXEL_WIDTH = 2400;

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be created.'))),
      'image/png'
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The blueprint could not be drawn as an image.'));
    img.src = src;
  });
}

async function rasteriseSvg(svg: SVGSVGElement, pixelWidth: number): Promise<HTMLCanvasElement> {
  const vb = svg.viewBox.baseVal;
  const pixelHeight = Math.round((pixelWidth * vb.height) / vb.width);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(pixelWidth));
  clone.setAttribute('height', String(pixelHeight));
  clone.removeAttribute('class');

  const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser cannot render the blueprint image.');
    ctx.drawImage(img, 0, 0, pixelWidth, pixelHeight);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function exportBlueprintPng(svg: SVGSVGElement, filename: string): Promise<void> {
  const canvas = await rasteriseSvg(svg, BLUEPRINT_PIXEL_WIDTH);
  triggerDownload(await canvasToPngBlob(canvas), filename);
}

export async function exportBlueprintPdf(svg: SVGSVGElement, filename: string): Promise<void> {
  const canvas = await rasteriseSvg(svg, BLUEPRINT_PIXEL_WIDTH);
  const pdf = new jsPDF({
    orientation: canvas.width >= canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  });
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
  triggerDownload(pdf.output('blob'), filename);
}

export async function exportCanvasPng(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  triggerDownload(await canvasToPngBlob(canvas), filename);
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
        triggerDownload(new Blob([result], { type: 'model/gltf-binary' }), filename);
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
  triggerDownload(new Blob([data], { type: 'model/stl' }), filename);
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

  triggerDownload(pdf.output('blob'), filename);
}
