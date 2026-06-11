import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  customerId: string;
  customerType: 'Individual' | 'Corporate';
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  mobile: string;
  aadhaarMasked: string;
  panMasked: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    customerType: { type: String, enum: ['Individual', 'Corporate'], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    email: { type: String, required: true, index: true },
    mobile: { type: String, required: true, index: true },
    aadhaarMasked: { type: String },
    panMasked: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
