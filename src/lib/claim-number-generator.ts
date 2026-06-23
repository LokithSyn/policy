import Claim from '@/models/Claim';
import { connectDB } from '@/lib/db/mongodb';

export interface ClaimNumberConfig {
  prefix: string;
  year: number;
  sequenceStart: number;
  sequencePadding: number;
}

export class ClaimNumberGenerator {
  async generateClaimNumber(config: ClaimNumberConfig): Promise<string> {
    try {
      await connectDB();

      const currentYear = new Date().getFullYear();
      const year = config.year || currentYear;
      const prefix = config.prefix || 'CLM';
      const padding = config.sequencePadding || 6;

      // Get the latest claim number for this year and prefix
      const lastClaim = await Claim.findOne({
        claimNumber: new RegExp(`^${prefix}-${year}-`),
      })
        .sort({ createdAt: -1 })
        .select('claimNumber');

      let nextSequence = config.sequenceStart || 1;

      if (lastClaim) {
        const parts = lastClaim.claimNumber.split('-');
        if (parts.length === 3) {
          const lastSequence = parseInt(parts[2], 10);
          nextSequence = lastSequence + 1;
        }
      }

      const paddedSequence = String(nextSequence).padStart(padding, '0');
      const claimNumber = `${prefix}-${year}-${paddedSequence}`;

      return claimNumber;
    } catch (error) {
      throw new Error(`Failed to generate claim number: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const claimNumberGenerator = new ClaimNumberGenerator();
