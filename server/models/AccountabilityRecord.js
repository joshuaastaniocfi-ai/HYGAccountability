const mongoose = require('mongoose');

const ReturnDetailsSchema = new mongoose.Schema(
  {
    returnDate: {
      type: Date,
    },
    conditionUponReturn: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Damaged'],
      default: 'Good',
    },
    completeness: {
      type: String,
      enum: ['Complete', 'Incomplete'],
      default: 'Complete',
    },
    incompleteNotes: {
      type: String,
      trim: true,
    },
    chargesAssessment: {
      type: String,
      enum: ['No charges', 'Charges Applicable'],
      default: 'No charges',
    },
    chargesAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: String,
      trim: true,
    },
    inspectedBy: {
      type: String,
      trim: true,
    },
    employeeSignature: {
      type: String,
      trim: true,
    },
    signatureImage: {
      type: String,
    },
  },
  { _id: false }
);

const FormItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  itemNumber: String,
  assetTag: String,
  itemDescription: {
    type: String,
    required: true,
  },
  brandModel: {
    type: String,
    required: true,
  },
  serialNumber: {
    type: String,
    required: true,
  },
  setTag: {
    type: String,
    trim: true,
    default: null, // e.g. 'Desktop Set', 'CCTV Set'
  },
  setEquipmentTag: {
    type: String,
    trim: true,
    default: null, // e.g. 'CFI-STR-44-SET-CCTV'
  },
  setItemNumber: {
    type: String,
    trim: true,
    default: null, // e.g. 'SET-S44-CCTV'
  },
  dateIssued: {
    type: Date,
    default: Date.now,
  },
  conditionAtIssuance: {
    type: String,
    enum: ['New', 'Good', 'Fair'],
    default: 'Good',
  },
  remarks: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Returned'],
    default: 'Active',
  },
  returnDetails: ReturnDetailsSchema,
});

const AccountabilityRecordSchema = new mongoose.Schema(
  {
    formNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    accountabilityType: {
      type: String,
      enum: ['Individual', 'Store', 'Department', 'Office'],
      default: 'Individual',
    },
    storeName: {
      type: String,
      trim: true,
    },
    targetGroup: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      default: 'Goldilocks',
      trim: true,
      index: true,
    },
    company: {
      type: String,
      default: 'Chawnah Foods Inc.',
      trim: true,
      index: true,
    },
    propertyOwnerCompany: {
      type: String,
      default: 'Chawnah Foods Inc.',
      trim: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: false,
    },
    employeeInfo: {
      name: { type: String, default: 'Store Custodian' },
      employeeId: { type: String, default: 'CFI-GRP' },
      jobTitle: { type: String, default: 'In-Charge' },
      department: { type: String, default: 'Operations' },
      company: { type: String, default: 'Chawnah Foods Inc.' },
    },
    items: [FormItemSchema],
    status: {
      type: String,
      enum: ['Active', 'Returned', 'Partially Returned'],
      default: 'Active',
    },
    issuance: {
      date: {
        type: Date,
        default: Date.now,
      },
      releasedBy: {
        type: String,
        required: true,
        trim: true,
      },
      approvedBy: {
        type: String,
        required: true,
        trim: true,
      },
      employeeSignatureName: {
        type: String,
        required: true,
        trim: true,
      },
      employeeSignatureImage: {
        type: String,
      },
      employeeSignatureDate: {
        type: Date,
        default: Date.now,
      },
      conditionAcknowledgment: {
        receivedInGoodCondition: {
          type: Boolean,
          default: true,
        },
        notedIssues: {
          type: String,
          trim: true,
        },
      },
    },
    returnSummary: ReturnDetailsSchema,
    companyResponsibilitiesText: {
      type: String,
      default: `By signing this form, I acknowledge and agree that:
1. The equipment listed above remains the property of Chawnah Foods Inc..
2. I am responsible for safeguarding this equipment from loss, theft, or damage.
3. I will use the equipment in accordance with company policies, including IT security and acceptable use policies.
4. I will not install unauthorized software or allow unauthorized users access.
5. I will immediately report loss, theft, or malfunction to IT or my supervisor.
6. Upon knowledge of termination of employment, at least a week before the date of resignation or upon knowledge of request by company, I will return all equipment in good working condition (normal wear and tear excepted).
7. Failure to return company property may result in payroll deductions (where legally permitted) and/or legal action.`,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AccountabilityRecord', AccountabilityRecordSchema);

