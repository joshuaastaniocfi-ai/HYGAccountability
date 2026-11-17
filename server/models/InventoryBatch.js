const mongoose = require('mongoose');

const InventoryBatchSchema = new mongoose.Schema(
  {
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    itemDescription: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
    },
    brandModel: {
      type: String,
      required: [true, 'Brand and Model are required'],
      trim: true,
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
    category: {
      type: String,
      default: 'Office Equipment',
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentCondition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Damaged', 'Under Repair'],
      default: 'New',
    },
    supplier: {
      type: String,
      trim: true,
    },
    poNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    receivedBy: {
      type: String,
      trim: true,
      default: 'Inventory Officer',
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
      },
    ],
    itemNumbers: [
      {
        type: String,
      },
    ],
    assetTags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InventoryBatch', InventoryBatchSchema);

