const mongoose = require('mongoose');

const ItemHistorySchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'REGISTERED',
        'ASSIGNED',
        'RETURNED',
        'MAINTENANCE',
        'CONDITION_UPDATE',
        'NOTE_ADDED',
        'COMPONENT_INSTALLED',
        'COMPONENT_REPLACED',
        'PART_REPLACEMENT',
        'DISMANTLED_FOR_REPAIR',
        'DISMANTLED_FOR_DISPOSAL',
        'REPLACED_FOR_REPAIR',
        'REPLACED_FOR_DISPOSAL',
        'WHOLE_UNIT_REPLACED',
      ],
      required: true,
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
    department: String,
    formNumber: String,
    accountabilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccountabilityRecord',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    condition: String,
    completeness: String,
    chargesAssessment: String,
    chargesAmount: Number,
    remarks: String,
    performedBy: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ItemHistory', ItemHistorySchema);

