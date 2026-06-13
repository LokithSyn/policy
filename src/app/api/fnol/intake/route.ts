import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db/mongodb';
import FnolIntake from '@/models/FnolIntake';
import AuditLog from '@/models/AuditLog';
import ClaimsHistory from '@/models/Claim';
import { runFnolPipeline } from '@/lib/validation/fnol-pipeline';
import { runFraudChecks } from '@/lib/fraud-detection';
import { registerClaim } from '@/lib/claim-registration';
import { getRequiredDocuments } from '@/lib/document-rules';
import { normalizeIntelliDocPayload } from '@/lib/intellidoc/normalizer';
import { sendClaimCallback } from '@/lib/intellidoc/callback';
import { generateClaimSummaryPdf } from '@/lib/pdf/claim-summary';
import { successResponse, errorResponse } from '@/lib/api-response';
import type { FnolValidationResult } from '@/lib/validation-engine';
import type { IFnolExtractedData } from '@/models/FnolIntake';

// ── Request schema ────────────────────────────────────────────────────────────

const ExtractedDataSchema = z.object({
  policyNumber:     z.string().min(1),
  insuredName:      z.string().min(1),
  dateOfLoss:       z.string().min(1),
  vehicleNumber:    z.string().optional(),
  lossDescription:  z.string().min(1),
  claimType:        z.string().optional(),
  contactNumber:    z.string().optional(),
  claimAmount:      z.number().optional(),
  incidentLocation: z.string().optional(),
});

const IntakeSchema = z.object({
  documentId:  z.string().min(1, 'documentId is required'),
  source:      z.string().min(1, 'source is required'),
  /** Optional: override the default IntelliDoc callback URL for this request */
  callbackUrl: z.string().url().optional(),
  /** Mode A — raw IntelliDoc output, any field names */
  rawPayload:    z.record(z.unknown()).optional(),
  /** Mode B — already-structured FNOL data (backward-compatible) */
  extractedData: ExtractedDataSchema.optional(),
}).refine(d => d.rawPayload || d.extractedData, {
  message: 'Provide either rawPayload (raw IntelliDoc output) or extractedData (structured FNOL fields)',
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateIntakeId(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
  return `FNOL-${year}-${rand}`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Parse JSON
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(errorResponse('Request body is not valid JSON'), { status: 400 });
    }

    // Schema validation
    const parsed = IntakeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')),
        { status: 400 }
      );
    }

    const { documentId, source, callbackUrl, rawPayload, extractedData: preStructured } = parsed.data;

    // ── Idempotency check ─────────────────────────────────────────────────────
    const existing = await FnolIntake.findOne({ documentId });
    if (existing) {
      const existingClaim = existing.claimId
        ? await ClaimsHistory.findOne({ claimId: existing.claimId }).select('claimStatus workflowStatus')
        : null;
      return NextResponse.json(
        successResponse({
          idempotent: true,
          success: !!existing.claimId,
          intakeId: existing.intakeId,
          claimNumber: existing.claimNumber ?? null,
          claimStatus: existingClaim?.workflowStatus ?? null,
          pdfUrl: existing.claimId ? `/api/fnol/${existing.intakeId}/summary` : null,
          status: existing.validationStatus,
          message: existing.claimId
            ? 'FNOL already processed — returning existing claim'
            : 'FNOL already processed — validation had failed',
        }),
        { status: 200 }
      );
    }

    // ── Normalization (Mode A — rawPayload) ───────────────────────────────────
    let extractedData: IFnolExtractedData;
    let normalizationReport: unknown = null;
    let storedRawPayload: Record<string, unknown> | undefined;
    let storedNormalizedPayload: Record<string, unknown> | undefined;

    if (rawPayload) {
      storedRawPayload = rawPayload;
      const normResult = normalizeIntelliDocPayload(rawPayload);
      normalizationReport = {
        mappingReport:        normResult.mappingReport,
        unmappedSourceFields: normResult.unmappedSourceFields,
        errors:               normResult.errors,
      };

      if (!normResult.success) {
        // Send failure callback to IntelliDoc immediately
        const intakeId = generateIntakeId();
        await sendClaimCallback({
          documentId,
          intakeId,
          status: 'NORMALIZATION_FAILED',
          errors: normResult.errors.map(e => ({ field: 'mapping', message: e })),
          processedAt: new Date().toISOString(),
        }, callbackUrl);

        return NextResponse.json(
          successResponse({
            success: false,
            status: 'NORMALIZATION_FAILED',
            errors: normResult.errors,
            unmappedFields: normResult.unmappedSourceFields,
            mappingReport: normResult.mappingReport,
          }),
          { status: 422 }
        );
      }

      const nd = normResult.normalizedData;
      storedNormalizedPayload = nd as Record<string, unknown>;
      extractedData = {
        policyNumber:    nd.policyNumber!,
        insuredName:     nd.insuredName!,
        dateOfLoss:      nd.dateOfLoss!,
        vehicleNumber:   nd.vehicleNumber,
        lossDescription: nd.lossDescription!,
        claimType:       nd.claimType,
        contactNumber:   nd.contactNumber,
        claimAmount:     nd.claimAmount,
        incidentLocation: nd.incidentLocation,
      };
    } else {
      // Mode B — already structured
      extractedData = { ...preStructured!, dateOfLoss: new Date(preStructured!.dateOfLoss) };
    }

    // ── Create intake record (PENDING) ────────────────────────────────────────
    const intakeId = generateIntakeId();
    const intake = await FnolIntake.create({
      intakeId,
      documentId,
      source,
      rawPayload:        storedRawPayload,
      normalizedPayload: storedNormalizedPayload,
      extractedData,
      validationStatus: 'PENDING',
      validationSteps:  [],
    });

    // ── Run 5-step validation pipeline ────────────────────────────────────────
    const pipeline = await runFnolPipeline(extractedData);
    intake.validationStatus = pipeline.status;
    intake.validationSteps  = pipeline.steps;

    const stepSummary = pipeline.steps.map(s => ({
      step: s.step, name: s.name, status: s.status,
    }));

    // ── Validation failed — callback + persist ────────────────────────────────
    if (!pipeline.passed) {
      await intake.save();

      await AuditLog.create({
        userId:   'SYSTEM',
        action:   'FNOL_VALIDATION_FAILED',
        entity:   'FnolValidation',
        entityId: intakeId,
        newValue: { documentId, errorCount: pipeline.allErrors.length, source },
        timestamp: new Date(),
      });

      // Notify IntelliDoc: validation failed
      const cbResult = await sendClaimCallback({
        documentId,
        intakeId,
        status:          'VALIDATION_FAILED',
        errors:          pipeline.allErrors,
        warnings:        pipeline.allWarnings,
        validationSteps: stepSummary,
        processedAt:     new Date().toISOString(),
      }, callbackUrl);

      return NextResponse.json(
        successResponse({
          success: false,
          intakeId,
          status: 'VALIDATION_FAILED',
          errors:          pipeline.allErrors,
          warnings:        pipeline.allWarnings,
          normalizationReport,
          validationSteps: pipeline.steps.map(s => ({
            step: s.step, name: s.name, status: s.status,
            errors: s.errors, warnings: s.warnings,
          })),
          callback: cbResult,
        }),
        { status: 422 }
      );
    }

    // ── Fraud detection ───────────────────────────────────────────────────────
    const fraudResult = await runFraudChecks({
      policyId:      pipeline.policy!.policyId,
      vehicleNumber: extractedData.vehicleNumber,
      incidentDate:  extractedData.dateOfLoss,
      claimAmount:   extractedData.claimAmount,
      claimType:     extractedData.claimType,
    });

    // ── Register claim ────────────────────────────────────────────────────────
    const validationResult: FnolValidationResult = {
      valid:             true,
      policyId:          pipeline.policy!.policyId,
      policyStatus:      pipeline.policy!.policyStatus,
      customerId:        pipeline.policy!.customerId,
      coverageAvailable: Number(pipeline.enrichedData.activeCoverages ?? 0) > 0,
      assetMatched:      pipeline.enrichedData.assetMatched !== false,
      violations:        [],
      warnings: pipeline.allWarnings.map(w => ({
        ruleCode: w.field, ruleName: w.field, field: w.field,
        message: w.message, severity: 'WARNING' as const,
      })),
      details: pipeline.enrichedData,
    };

    const registration = await registerClaim({
      fnolId:           intakeId,
      fnolNumber:       `FNOL-${documentId}`,
      policyId:         pipeline.policy!.policyId,
      claimType:        extractedData.claimType ?? 'OWN_DAMAGE',
      incidentDate:     extractedData.dateOfLoss,
      vehicleNumber:    extractedData.vehicleNumber,
      description:      extractedData.lossDescription,
      incidentLocation: extractedData.incidentLocation,
      claimAmount:      extractedData.claimAmount ?? 0,
      validation:       validationResult,
      fraud:            fraudResult,
      registeredBy:     'SYSTEM',
    });

    if (!registration.success || !registration.claimId) {
      await intake.save();

      await sendClaimCallback({
        documentId,
        intakeId,
        status:          'CLAIM_REGISTRATION_FAILED',
        errors:          [{ field: 'claim', message: registration.error ?? 'Claim registration failed' }],
        validationSteps: stepSummary,
        processedAt:     new Date().toISOString(),
      }, callbackUrl);

      return NextResponse.json(
        errorResponse(registration.error ?? 'Claim registration failed'),
        { status: 500 }
      );
    }

    // ── Update intake ─────────────────────────────────────────────────────────
    intake.claimId     = registration.claimId;
    intake.claimNumber = registration.claimNumber;
    intake.policyId    = pipeline.policy!.policyId;
    intake.processedAt = new Date();
    await intake.save();

    // ── Generate PDF ──────────────────────────────────────────────────────────
    const claim = await ClaimsHistory.findOne({ claimId: registration.claimId });
    let pdfBase64: string | undefined;
    let pdfFileName: string | undefined;

    if (claim) {
      try {
        const pdfBuffer = await generateClaimSummaryPdf({
          intake: intake.toObject(),
          claim:  claim.toObject(),
          fraudFlags: fraudResult.flags,
        });
        pdfBase64   = pdfBuffer.toString('base64');
        pdfFileName = `${registration.claimNumber}-summary.pdf`;
      } catch (pdfErr) {
        console.error('[FNOL Intake] PDF generation failed (non-critical):', pdfErr);
      }
    }

    // ── Send callback to IntelliDoc ───────────────────────────────────────────
    const pdfUrl = `/api/fnol/${intakeId}/summary`;
    const cbResult = await sendClaimCallback({
      documentId,
      intakeId,
      status:       'CLAIM_CREATED',
      claimNumber:  registration.claimNumber,
      claimId:      registration.claimId,
      claimStatus:  registration.workflowStatus,
      policyNumber: extractedData.policyNumber,
      policyId:     pipeline.policy!.policyId,
      isFraudulent: fraudResult.isFraudulent,
      fraudFlags:   fraudResult.flags,
      fraudSeverity: fraudResult.severity,
      pdfBase64,
      pdfFileName,
      pdfMimeType:  'application/pdf',
      pdfUrl,
      validationSteps: stepSummary,
      warnings:     pipeline.allWarnings,
      processedAt:  new Date().toISOString(),
    }, callbackUrl);

    // ── Audit log ─────────────────────────────────────────────────────────────
    await AuditLog.create({
      userId:   'SYSTEM',
      action:   'FNOL_CLAIM_CREATED',
      entity:   'FnolValidation',
      entityId: intakeId,
      newValue: {
        claimId:          registration.claimId,
        claimNumber:      registration.claimNumber,
        policyId:         pipeline.policy!.policyId,
        isFraudulent:     fraudResult.isFraudulent,
        callbackSent:     cbResult.sent,
        callbackUrl:      cbResult.callbackUrl,
        callbackStatus:   cbResult.statusCode,
      },
      timestamp: new Date(),
    });

    // ── Required documents ────────────────────────────────────────────────────
    let requiredDocuments: unknown[] = [];
    try {
      const docCheck = await getRequiredDocuments(
        registration.claimId!,
        extractedData.claimType ?? 'OWN_DAMAGE',
        pipeline.policy!.policyType
      );
      requiredDocuments = docCheck.requiredDocuments ?? [];
    } catch { /* document rules may not be seeded yet */ }

    // ── Response to IntelliDoc (HTTP response for the original POST) ──────────
    return NextResponse.json(
      successResponse({
        success:        true,
        intakeId,
        claimNumber:    registration.claimNumber,
        claimStatus:    registration.workflowStatus,
        pdfUrl,
        policyId:       pipeline.policy!.policyId,
        policyNumber:   extractedData.policyNumber,
        normalizationReport,
        fraud: {
          isFraudulent: fraudResult.isFraudulent,
          severity:     fraudResult.severity,
          flags:        fraudResult.flags,
        },
        warnings:        pipeline.allWarnings,
        validationSteps: stepSummary,
        requiredDocuments,
        /** Callback delivery status — IntelliDoc can check if the push was received */
        callback: {
          sent:       cbResult.sent,
          url:        cbResult.callbackUrl,
          statusCode: cbResult.statusCode,
          error:      cbResult.error,
          skipped:    cbResult.skipped,
          skipReason: cbResult.skipReason,
        },
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('[FNOL Intake] Unhandled error:', error);
    return NextResponse.json(errorResponse('Internal server error'), { status: 500 });
  }
}
