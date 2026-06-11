import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import InsuredAsset from '@/models/InsuredAsset';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(
  _request: NextRequest,
  { params }: { params: { registrationNumber: string } }
) {
  try {
    await connectDB();

    const asset = await InsuredAsset.findOne({
      registrationNumber: params.registrationNumber,
    }).populate('policy');

    if (!asset) {
      return NextResponse.json(
        errorResponse('Vehicle not found'),
        { status: 404 }
      );
    }

    const policy = asset.policy as any;

    return NextResponse.json(
      successResponse({
        assetId: asset.assetId,
        registrationNumber: asset.registrationNumber,
        chassisNumber: asset.chassisNumber,
        make: asset.make,
        modelName: asset.modelName,
        manufacturingYear: asset.manufacturingYear,
        assetType: asset.assetType,
        fuelType: asset.fuelType,
        insuredValue: asset.insuredValue,
        marketValue: asset.marketValue,
        policy: policy ? {
          policyId: policy.policyId,
          policyNumber: policy.policyNumber,
          policyStatus: policy.policyStatus,
          sumInsured: policy.sumInsured,
          expiryDate: policy.expiryDate,
        } : null,
      })
    );
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json(
      errorResponse('Internal server error'),
      { status: 500 }
    );
  }
}
