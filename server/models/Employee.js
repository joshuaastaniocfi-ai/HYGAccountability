const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
    },
    suffix: {
      type: String,
      trim: true,
      default: '',
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      default: 'Goldilocks',
      index: true,
    },
    company: {
      type: String,
      required: [true, 'Company is required'],
      trim: true,
      default: 'Chawnah Foods Inc.',
      index: true,
    },
    legalOwnerCompany: {
      type: String,
      trim: true,
      default: 'Chawnah Foods Inc.',
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive', 'Resigned'],
      default: 'Active',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Employee', EmployeeSchema);


