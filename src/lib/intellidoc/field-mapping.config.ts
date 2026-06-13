/**
 * Configurable field mapping between IntelliDoc's raw output and IntelliPolicy's FNOL DTO.
 *
 * Each entry maps one canonical FNOL field to all known source aliases from IntelliDoc.
 * Add new aliases here whenever IntelliDoc changes its key names — no code change needed elsewhere.
 */

export type FnolFieldType = 'string' | 'number' | 'date' | 'claimType' | 'vehicleNumber';

export interface FieldMappingEntry {
  /** The canonical field name in the FNOL DTO */
  target: string;
  /** Every alias that IntelliDoc may send for this field (case-insensitive match) */
  aliases: string[];
  /** How to coerce the raw value */
  type: FnolFieldType;
  required: boolean;
}

export const FIELD_MAPPINGS: FieldMappingEntry[] = [
  {
    target: 'policyNumber',
    aliases: [
      'policyNumber', 'policy_number', 'policynumber',
      'Policy No', 'policy no', 'PolicyNo', 'policy_no',
      'Policy Number', 'PolicyNumber', 'POLICY_NUMBER',
      'pol_no', 'pol no', 'PolNo',
    ],
    type: 'string',
    required: true,
  },
  {
    target: 'insuredName',
    aliases: [
      'insuredName', 'insured_name', 'InsuredName',
      'Customer Name', 'customer_name', 'CustomerName',
      'Insured Name', 'insured name',
      'Policy Holder', 'policy_holder', 'PolicyHolder',
      'client_name', 'Client Name', 'ClientName',
      'member_name', 'Member Name', 'MemberName',
      'name', 'Name',
    ],
    type: 'string',
    required: true,
  },
  {
    target: 'dateOfLoss',
    aliases: [
      'dateOfLoss', 'date_of_loss', 'DateOfLoss',
      'Loss Date', 'loss_date', 'LossDate',
      'Date of Loss', 'date of loss',
      'Incident Date', 'incident_date', 'IncidentDate',
      'Accident Date', 'accident_date', 'AccidentDate',
      'date_of_incident', 'Date of Incident',
      'event_date', 'Event Date', 'EventDate',
      'loss_dt', 'Loss Dt',
    ],
    type: 'date',
    required: true,
  },
  {
    target: 'vehicleNumber',
    aliases: [
      'vehicleNumber', 'vehicle_number', 'VehicleNumber',
      'Vehicle No', 'vehicle_no', 'VehicleNo',
      'Vehicle Number', 'vehicle number',
      'Registration No', 'registration_no', 'RegistrationNo',
      'Registration Number', 'registration_number',
      'Reg No', 'reg_no', 'RegNo',
      'Plate No', 'plate_no', 'PlateNo',
      'vehicle_reg', 'Vehicle Reg',
    ],
    type: 'vehicleNumber',
    required: false,
  },
  {
    target: 'lossDescription',
    aliases: [
      'lossDescription', 'loss_description', 'LossDescription',
      'Description', 'description',
      'Loss Description', 'loss description',
      'Incident Description', 'incident_description', 'IncidentDescription',
      'Accident Description', 'accident_description',
      'remarks', 'Remarks',
      'loss_details', 'Loss Details', 'LossDetails',
      'claim_description', 'Claim Description',
      'narration', 'Narration',
      'details', 'Details',
    ],
    type: 'string',
    required: true,
  },
  {
    target: 'claimType',
    aliases: [
      'claimType', 'claim_type', 'ClaimType',
      'Claim Type', 'claim type',
      'Loss Type', 'loss_type', 'LossType',
      'Type of Claim', 'type_of_claim',
      'Type of Loss', 'type_of_loss',
      'coverage_type', 'Coverage Type',
    ],
    type: 'claimType',
    required: false,
  },
  {
    target: 'contactNumber',
    aliases: [
      'contactNumber', 'contact_number', 'ContactNumber',
      'Contact Number', 'contact number',
      'Mobile', 'mobile', 'Mobile No', 'mobile_no',
      'Phone', 'phone', 'Phone No', 'phone_no',
      'Mobile Number', 'mobile_number',
      'Contact', 'contact',
      'phone_number', 'Phone Number',
    ],
    type: 'string',
    required: false,
  },
  {
    target: 'claimAmount',
    aliases: [
      'claimAmount', 'claim_amount', 'ClaimAmount',
      'Claim Amount', 'claim amount',
      'Loss Amount', 'loss_amount', 'LossAmount',
      'Estimated Amount', 'estimated_amount',
      'Damage Amount', 'damage_amount', 'DamageAmount',
      'amount', 'Amount',
      'claim_value', 'Claim Value',
      'loss_value', 'Loss Value',
    ],
    type: 'number',
    required: false,
  },
  {
    target: 'incidentLocation',
    aliases: [
      'incidentLocation', 'incident_location', 'IncidentLocation',
      'Incident Location', 'incident location',
      'Loss Location', 'loss_location', 'LossLocation',
      'Accident Location', 'accident_location',
      'Location', 'location',
      'Place of Incident', 'place_of_incident',
      'Accident Place', 'accident_place',
    ],
    type: 'string',
    required: false,
  },
];

/** Lookup: normalized alias → target field name (built once at module load) */
export const ALIAS_INDEX = new Map<string, FieldMappingEntry>(
  FIELD_MAPPINGS.flatMap(entry =>
    entry.aliases.map(alias => [alias.toLowerCase().trim(), entry])
  )
);
