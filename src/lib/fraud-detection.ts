import FraudRule, { IFraudRule } from '@/models/FraudRule';
import ClaimsHistory from '@/models/Claim';

export interface FraudCheckInput {
  policyId: string;
  vehicleNumber?: string;
  incidentDate: Date;
  claimAmount?: number;
  claimType?: string;
}

export interface FraudCheckResult {
  isFraudulent: boolean;
  flags: string[];
  severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Array<{
    ruleCode: string;
    ruleName: string;
    message: string;
    severity: string;
  }>;
}

async function evaluateFraudRule(
  rule: IFraudRule,
  input: FraudCheckInput
): Promise<{ triggered: boolean; message: string }> {
  try {
    switch (rule.ruleType) {
      case 'VELOCITY': {
        if (!rule.windowDays || !rule.thresholdValue) {
          return { triggered: false, message: '' };
        }
        const windowStart = new Date(input.incidentDate);
        windowStart.setDate(windowStart.getDate() - rule.windowDays);

        const count = await ClaimsHistory.countDocuments({
          policyId: input.policyId,
          incidentDate: { $gte: windowStart, $lte: input.incidentDate },
        });

        if (count >= rule.thresholdValue) {
          return {
            triggered: true,
            message: rule.flagMessage.replace('{count}', String(count)),
          };
        }
        return { triggered: false, message: '' };
      }

      case 'DUPLICATE': {
        if (!rule.windowDays) return { triggered: false, message: '' };
        const winStart = new Date(input.incidentDate);
        winStart.setDate(winStart.getDate() - rule.windowDays);

        const dupQuery: Record<string, unknown> = {
          incidentDate: { $gte: winStart },
        };

        if (rule.field === 'vehicleNumber' && input.vehicleNumber) {
          dupQuery.vehicleNumber = input.vehicleNumber;
        } else if (rule.field === 'policyId') {
          dupQuery.policyId = input.policyId;
        }

        const existingCount = await ClaimsHistory.countDocuments(dupQuery);
        if (existingCount > 0) {
          return { triggered: true, message: rule.flagMessage };
        }
        return { triggered: false, message: '' };
      }

      case 'THRESHOLD': {
        if (!rule.field || !rule.thresholdValue || !rule.operator) {
          return { triggered: false, message: '' };
        }
        const fieldValue = input[rule.field as keyof FraudCheckInput] as number | undefined;
        if (fieldValue === undefined) return { triggered: false, message: '' };

        let triggered = false;
        if (rule.operator === 'GREATER_THAN') triggered = fieldValue > rule.thresholdValue;
        else if (rule.operator === 'LESS_THAN') triggered = fieldValue < rule.thresholdValue;
        else if (rule.operator === 'EQUALS') triggered = fieldValue === rule.thresholdValue;

        return { triggered, message: triggered ? rule.flagMessage : '' };
      }

      default:
        return { triggered: false, message: '' };
    }
  } catch {
    return { triggered: false, message: '' };
  }
}

const SEVERITY_RANK: Record<string, number> = {
  NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
};

export async function runFraudChecks(input: FraudCheckInput): Promise<FraudCheckResult> {
  const rules = await FraudRule.find({ isActive: true }).sort({ priority: 1 });

  const flags: string[] = [];
  const details: FraudCheckResult['details'] = [];
  let maxSeverityRank = 0;

  for (const rule of rules) {
    const { triggered, message } = await evaluateFraudRule(rule, input);
    if (triggered) {
      flags.push(rule.ruleCode);
      details.push({
        ruleCode: rule.ruleCode,
        ruleName: rule.ruleName,
        message,
        severity: rule.severity,
      });
      const rank = SEVERITY_RANK[rule.severity] ?? 0;
      if (rank > maxSeverityRank) maxSeverityRank = rank;
    }
  }

  const severityMap: Record<number, FraudCheckResult['severity']> = {
    0: 'NONE', 1: 'LOW', 2: 'MEDIUM', 3: 'HIGH', 4: 'CRITICAL',
  };

  return {
    isFraudulent: flags.length > 0,
    flags,
    severity: severityMap[maxSeverityRank] ?? 'NONE',
    details,
  };
}
