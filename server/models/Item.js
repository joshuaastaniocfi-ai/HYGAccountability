const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema(
  {
    itemNumber: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    assetTag: {
      type: String,
      required: [true, 'Asset tag is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    itemDescription: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },
    brandModel: {
      type: String,
      default: 'N/A',
      trim: true,
    },
    serialNumber: {
      type: String,
      default: 'N/A',
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Laptops & Desktops',
        'Mobile & Tablets',
        'Warehouse & Barcode Scanners',
        'Laboratory & QA Equipment',
        'Production & Machinery',
        'Printers & Peripherals',
        'Office Equipment',
        'Other',
      ],
      default: 'Laptops & Desktops',
    },
    equipmentType: {
      type: String,
      trim: true,
      default: 'Other',
      index: true,
    },
    setTag: {
      type: String,
      trim: true,
      default: null, // e.g. 'Desktop Set', 'CCTV Set'
      index: true,
    },
    setEquipmentTag: {
      type: String,
      trim: true,
      default: null, // e.g. 'CFI-STR-44-SET-CCTV'
      index: true,
    },
    setItemNumber: {
      type: String,
      trim: true,
      default: null, // e.g. 'SET-S44-CCTV'
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      default: 'Goldilocks',
      index: true,
    },
    legalOwner: {
      type: String,
      trim: true,
      default: 'Chawnah Foods Inc.',
    },
    currentCondition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Damaged', 'Under Repair', 'For Disposal', 'Decommissioned'],
      default: 'Good',
    },
    status: {
      type: String,
      enum: [
        'Available',
        'Assigned',
        'Under Maintenance',
        'Decommissioned',
        'For Repair',
        'For Disposal',
      ],
      default: 'Available',
    },
    installedComponents: [
      {
        componentType: { type: String, default: 'Component' },
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
        itemNumber: String,
        itemDescription: String,
        serialNumber: String,
        installedDate: { type: Date, default: Date.now },
        installedBy: String,
        notes: String,
      },
    ],
    parentItem: {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
      itemNumber: String,
      itemDescription: String,
      installedDate: Date,
    },
    maintenanceHistory: [
      {
        date: { type: Date, default: Date.now },
        actionType: {
          type: String,
          enum: [
            'Replacement',
            'Repair',
            'Inspection',
            'Disposal',
            'Maintenance',
            'Whole Unit Replacement',
          ],
          default: 'Replacement',
        },
        componentName: String,
        oldComponent: {
          itemId: mongoose.Schema.Types.ObjectId,
          itemNumber: String,
          serialNumber: String,
          description: String,
          disposition: { type: String, enum: ['For Repair', 'For Disposal', 'Replaced'] },
          reason: String,
        },
        newComponent: {
          itemId: mongoose.Schema.Types.ObjectId,
          itemNumber: String,
          serialNumber: String,
          description: String,
        },
        performedBy: String,
        notes: String,
      },
    ],
    currentAssignment: {
      accountabilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AccountabilityRecord',
      },
      accountabilityType: {
        type: String,
        enum: ['Individual', 'Store', 'Department', 'Office'],
        default: 'Individual',
      },
      storeName: String,
      targetGroup: String,
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
      },
      employeeName: String,
      employeeId: String,
      company: String,
      department: String,
      dateIssued: Date,
      conditionAtIssuance: String,
      setTag: String,
      setEquipmentTag: String,
      setItemNumber: String,
    },
    remarks: {
      type: String,
      trim: true,
    },
    // Batch & Procurement Intake Details
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InventoryBatch',
      index: true,
    },
    batchNumber: {
      type: String,
      trim: true,
      uppercase: true,
      index: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    poNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    supplier: {
      type: String,
      trim: true,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Item', ItemSchema);

