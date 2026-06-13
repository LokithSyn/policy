import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { IFnolIntake } from '@/models/FnolIntake';
import { IClaimsHistory } from '@/models/Claim';

interface PdfParams {
  intake: IFnolIntake;
  claim: IClaimsHistory;
  fraudFlags: string[];
}

const COLOR = {
  primary:  rgb(0.09, 0.29, 0.67),
  success:  rgb(0.07, 0.53, 0.17),
  danger:   rgb(0.75, 0.10, 0.10),
  muted:    rgb(0.45, 0.45, 0.45),
  divider:  rgb(0.80, 0.80, 0.80),
  black:    rgb(0.05, 0.05, 0.05),
  label:    rgb(0.30, 0.30, 0.30),
};

export async function generateClaimSummaryPdf(params: PdfParams): Promise<Buffer> {
  const { intake, claim, fraudFlags } = params;
  const data = intake.extractedData;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  const margin = 50;
  const contentWidth = width - margin * 2;

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 45;

  // ── helpers ──────────────────────────────────────────────────────────────────
  function text(str: string, x: number, opts: { font?: typeof regular; size?: number; color?: ReturnType<typeof rgb> } = {}) {
    page.drawText(str, {
      x,
      y,
      font: opts.font ?? regular,
      size: opts.size ?? 10,
      color: opts.color ?? COLOR.black,
    });
  }

  function nl(pts = 16) { y -= pts; }

  function divider() {
    nl(4);
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: COLOR.divider });
    nl(10);
  }

  function section(title: string) {
    nl(4);
    text(title, margin, { font: bold, size: 12, color: COLOR.primary });
    nl(18);
  }

  function field(label: string, value: string) {
    text(`${label}:`, margin, { font: bold, size: 10, color: COLOR.label });
    text(value || 'N/A', margin + 150, { font: regular, size: 10 });
    nl();
  }

  function wrappedText(str: string, maxWidth: number) {
    const words = str.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (regular.widthOfTextAtSize(test, 10) > maxWidth) {
        text(line, margin, { size: 10 });
        nl();
        line = word;
      } else {
        line = test;
      }
    }
    if (line) { text(line, margin, { size: 10 }); nl(); }
  }

  // ── Header ───────────────────────────────────────────────────────────────────
  text('CLAIM SUMMARY REPORT', margin, { font: bold, size: 18, color: COLOR.primary });
  nl(22);
  text('IntelliPolicy — Insurance Claims Platform', margin, { size: 11, color: COLOR.muted });
  nl(14);
  text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, { size: 9, color: COLOR.muted });
  divider();

  // ── Claim Details ─────────────────────────────────────────────────────────────
  section('CLAIM DETAILS');
  field('Claim Number', claim.claimNumber ?? '');
  field('Claim ID', claim.claimId ?? '');
  field('Claim Status', claim.claimStatus ?? '');
  field('Workflow Status', claim.workflowStatus ?? '');
  field('Claim Type', claim.claimType ?? '');
  field('Claim Amount', `INR ${(claim.claimAmount ?? 0).toLocaleString('en-IN')}`);
  field('Fraud Detected', claim.isFraudulent ? `YES — ${fraudFlags.join(', ')}` : 'No');
  divider();

  // ── Policy & Insured ──────────────────────────────────────────────────────────
  section('POLICY & INSURED');
  field('Policy Number', data.policyNumber ?? '');
  field('Policy ID', intake.policyId ?? '');
  field('Insured Name', data.insuredName ?? '');
  field('Contact Number', data.contactNumber ?? 'N/A');
  divider();

  // ── Incident Details ──────────────────────────────────────────────────────────
  section('INCIDENT DETAILS');
  field('Date of Loss', new Date(data.dateOfLoss).toDateString());
  field('Vehicle Number', data.vehicleNumber ?? 'N/A');
  field('Incident Location', data.incidentLocation ?? 'N/A');
  field('Source', intake.source ?? '');
  nl(4);
  text('Loss Description:', margin, { font: bold, size: 10, color: COLOR.label });
  nl(14);
  wrappedText(data.lossDescription ?? '', contentWidth);
  divider();

  // ── Validation Results ────────────────────────────────────────────────────────
  section('VALIDATION RESULTS');
  for (const step of intake.validationSteps) {
    const passed = step.status === 'PASS';
    const prefix = passed ? '[PASS]' : '[FAIL]';
    const color  = passed ? COLOR.success : COLOR.danger;
    text(`${prefix}  Step ${step.step}: ${step.name}`, margin, { font: passed ? regular : bold, size: 10, color });
    nl(14);
    for (const err of step.errors) {
      text(`        ${err.field}: ${err.message}`, margin, { size: 9, color: COLOR.danger });
      nl(13);
    }
    for (const warn of step.warnings) {
      text(`        ${warn.field}: ${warn.message}`, margin, { size: 9, color: COLOR.muted });
      nl(13);
    }
  }
  divider();

  // ── Footer ────────────────────────────────────────────────────────────────────
  nl(4);
  text(`FNOL Intake ID: ${intake.intakeId}`, margin, { size: 8, color: COLOR.muted });
  nl(12);
  text(`Document ID: ${intake.documentId}  |  This is a system-generated document.`, margin, { size: 8, color: COLOR.muted });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
