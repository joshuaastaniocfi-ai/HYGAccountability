const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const ItemHistory = require('../models/ItemHistory');
const InventoryBatch = require('../models/InventoryBatch');

// Helper: Determine next unique sequence of itemNumbers (e.g. ['ITM-0013', 'ITM-0014', ...])
async function getNextItemNumberSequence(countNeeded = 1) {
  const allItems = await Item.find({}, { itemNumber: 1 }).lean();
  let maxSeq = 0;
  allItems.forEach((it) => {
    if (it.itemNumber) {
      const match = it.itemNumber.match(/\d+/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxSeq) maxSeq = num;
      }
    }
  });
  if (allItems.length > maxSeq) {
    maxSeq = allItems.length;
  }
  const generated = [];
  for (let i = 1; i <= countNeeded; i++) {
    generated.push(`ITM-${String(maxSeq + i).padStart(4, '0')}`);
  }
  return generated;
}

// Helper: Determine next unique batch number (e.g. 'BATCH-2026-0001')
async function getNextBatchNumber() {
  const currentYear = new Date().getFullYear();
  const allBatches = await InventoryBatch.find({}, { batchNumber: 1 }).lean();
  let maxNum = allBatches.length;
  allBatches.forEach((b) => {
    if (b.batchNumber) {
      const parts = b.batchNumber.split('-');
      const last = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(last) && last > maxNum) maxNum = last;
    }
  });
  return `BATCH-${currentYear}-${String(maxNum + 1).padStart(4, '0')}`;
}

// GET /api/inventory/next-batch-info - Preview next batch number and starting item number
router.get('/next-batch-info', async (req, res) => {
  try {
    const nextBatchNumber = await getNextBatchNumber();
    const [nextItemNumber] = await getNextItemNumberSequence(1);
    const totalBatches = await InventoryBatch.countDocuments();
    const totalItems = await Item.countDocuments();

    res.json({
      nextBatchNumber,
      nextItemNumber,
      totalBatches,
      totalItems,
    });
  } catch (err) {
    console.error('Error fetching batch info:', err);
    res.status(500).json({ message: 'Failed to fetch batch info', error: err.message });
  }
});

// GET /api/inventory/batches - List all inventory batch records with live status
router.get('/batches', async (req, res) => {
  try {
    const batches = await InventoryBatch.find().sort({ createdAt: -1 }).lean();

    // Enrich each batch with current items status (Available, Assigned, Maintenance)
    const enriched = await Promise.all(
      batches.map(async (batch) => {
        const items = await Item.find(
          { batchId: batch._id },
          {
            status: 1,
            currentCondition: 1,
            currentAssignment: 1,
            itemNumber: 1,
            assetTag: 1,
            serialNumber: 1,
          }
        ).lean();

        const available = items.filter((i) => i.status === 'Available').length;
        const assigned = items.filter((i) => i.status === 'Assigned').length;
        const maintenance = items.filter(
          (i) => i.status === 'Under Maintenance' || i.status === 'Decommissioned'
        ).length;

        return {
          ...batch,
          statusSummary: {
            total: items.length || batch.quantity,
            available,
            assigned,
            maintenance,
          },
          itemsPreview: items.slice(0, 6),
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error('Error fetching inventory batches:', err);
    res.status(500).json({ message: 'Failed to fetch inventory batches', error: err.message });
  }
});

// GET /api/inventory/batches/:id - Get single batch receiving record with all individual items
router.get('/batches/:id', async (req, res) => {
  try {
    const batch = await InventoryBatch.findById(req.params.id).lean();
    if (!batch) {
      return res.status(404).json({ message: 'Inventory batch not found' });
    }

    const items = await Item.find({ batchId: batch._id })
      .sort({ itemNumber: 1 })
      .lean();

    res.json({
      batch,
      items,
    });
  } catch (err) {
    console.error('Error fetching batch details:', err);
    res.status(500).json({ message: 'Failed to fetch batch details', error: err.message });
  }
});

// POST /api/inventory/batches - Create a batch intake of items (e.g. 10 UPS Batteries)
// Each item receives its own unique itemNumber, assetTag, and serialNumber
router.post('/batches', async (req, res) => {
  try {
    const {
      itemDescription,
      brandModel,
      brand,
      legalOwner,
      category,
      equipmentType,
      currentCondition,
      quantity,
      tagPrefix,
      startTagNumber,
      serialPrefix,
      serialNumbers,
      poNumber,
      supplier,
      receivedBy,
      receivedDate,
      unitCost,
      remarks,
    } = req.body;

    const resolveLegalOwner = (b) => {
      const brandLower = (b || '').toLowerCase();
      if (brandLower.includes('goldilocks')) return 'Chawnah Foods Inc.';
      if (brandLower.includes('du99')) return 'DU99 Commercial Corp.';
      if (brandLower.includes('taters')) return 'Pop and Chips Specialist Inc.';
      if (brandLower.includes('iceberg')) return 'Cool Ice Food Desserts';
      if (brandLower.includes('savore')) return 'Savore Kitchen Corp';
      if (brandLower.includes('chatime')) return 'Salu-salong Saya Food Inc.';
      return 'Chawnah Foods Inc.';
    };

    const selectedBrand = brand || 'Goldilocks';
    const resolvedLegalOwner = legalOwner || resolveLegalOwner(selectedBrand);

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    if (qty > 100) {
      return res.status(400).json({ message: 'Maximum batch size is 100 items at a time' });
    }

    if (!itemDescription || !brandModel) {
      return res.status(400).json({ message: 'Item description and Brand/Model are required' });
    }

    // 1. Generate unique batch number
    const batchNumber = await getNextBatchNumber();

    // 2. Generate unique item numbers (e.g. ITM-0013 through ITM-0022)
    const itemNumbers = await getNextItemNumberSequence(qty);

    // 3. Resolve Asset Tags
    const cleanPrefix = (tagPrefix || 'CFI-AST-').trim().toUpperCase();
    let startTag = parseInt(startTagNumber, 10);
    if (isNaN(startTag) || startTag < 1) {
      // Find highest existing tag with this prefix
      const existingTags = await Item.find(
        { assetTag: new RegExp(`^${cleanPrefix}`, 'i') },
        { assetTag: 1 }
      ).lean();
      let maxTagNum = 0;
      existingTags.forEach((it) => {
        const numPart = it.assetTag.replace(new RegExp(`^${cleanPrefix}`, 'i'), '');
        const n = parseInt(numPart, 10);
        if (!isNaN(n) && n > maxTagNum) maxTagNum = n;
      });
      startTag = maxTagNum + 1;
    }

    const assetTags = [];
    for (let i = 0; i < qty; i++) {
      assetTags.push(`${cleanPrefix}${String(startTag + i).padStart(3, '0')}`);
    }

    // Check if any assetTag already exists
    const tagClashes = await Item.find({ assetTag: { $in: assetTags } }, { assetTag: 1 }).lean();
    if (tagClashes.length > 0) {
      return res.status(400).json({
        message: `Asset tag clash: ${tagClashes.map((c) => c.assetTag).join(', ')} already exists. Try changing prefix or starting number.`,
      });
    }

    // 4. Resolve Serial Numbers
    let resolvedSerials = [];
    if (Array.isArray(serialNumbers) && serialNumbers.length === qty) {
      resolvedSerials = serialNumbers.map((s) => s.trim());
    } else if (typeof serialNumbers === 'string' && serialNumbers.trim()) {
      const parsed = serialNumbers
        .split(/[\r\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parsed.length === qty) {
        resolvedSerials = parsed;
      }
    }

    // If manual serials were not provided or mismatched count, generate clean sequential serials
    if (resolvedSerials.length !== qty) {
      const cleanBrandModel = (brandModel || 'GEN').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
      const sPrefix = (serialPrefix || `SN-${cleanBrandModel}-${new Date().getFullYear()}-`).trim();
      for (let i = 1; i <= qty; i++) {
        resolvedSerials.push(`${sPrefix}${String(i).padStart(4, '0')}`);
      }
    }

    // Check if any serial number already exists in DB
    const serialClashes = await Item.find(
      { serialNumber: { $in: resolvedSerials } },
      { serialNumber: 1 }
    ).lean();
    if (serialClashes.length > 0) {
      resolvedSerials = resolvedSerials.map((s) => {
        const clash = serialClashes.some((c) => c.serialNumber === s);
        return clash
          ? `${s}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
          : s;
      });
    }

    // 5. Create InventoryBatch document
    const newBatch = new InventoryBatch({
      batchNumber,
      itemDescription: itemDescription.trim(),
      brandModel: brandModel.trim(),
      brand: selectedBrand,
      legalOwner: resolvedLegalOwner,
      category: category || 'Office Equipment',
      quantity: qty,
      currentCondition: currentCondition || 'New',
      supplier: supplier ? supplier.trim() : '',
      poNumber: poNumber ? poNumber.trim().toUpperCase() : '',
      receivedBy: receivedBy ? receivedBy.trim() : 'Inventory Officer',
      receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
      unitCost: parseFloat(unitCost) || 0,
      remarks: remarks ? remarks.trim() : '',
      itemNumbers,
      assetTags,
      items: [],
    });

    const savedBatch = await newBatch.save();

    // 6. Create the individual Item documents
    const inferEqType = (desc, cat) => {
      const d = (desc || '').toLowerCase();
      if (d.includes('battery')) return 'UPS Battery';
      if (d.includes('ups') || d.includes('back-ups') || d.includes('battery backup') || d.includes('uninterruptible')) return 'UPS';
      if (d.includes('mouse')) return 'Mouse';
      if (d.includes('keyboard')) return 'Keyboard';
      if (d.includes('monitor')) return 'Monitor';
      if (d.includes('desktop') || d.includes('optiplex') || d.includes('system unit')) return 'Desktop';
      if (d.includes('laptop') || d.includes('latitude') || d.includes('thinkpad')) return 'Laptop';
      if (d.includes('cable') || d.includes('hdmi') || d.includes('lan')) return 'Cables & Accessories';
      if (d.includes('scanner') || d.includes('barcode')) return 'Barcode Scanner';
      if (d.includes('tablet') || d.includes('ipad')) return 'Tablet';
      if (d.includes('printer')) return 'Printer';
      if (d.includes('pos') || d.includes('terminal')) return 'POS Terminal';
      if (cat === 'Laptops & Desktops') return 'Desktop';
      return 'Other';
    };

    const resolvedEquipmentType = (equipmentType && equipmentType.trim()) || inferEqType(itemDescription, category);

    const itemsToInsert = [];
    for (let i = 0; i < qty; i++) {
      itemsToInsert.push({
        itemNumber: itemNumbers[i],
        assetTag: assetTags[i],
        itemDescription: itemDescription.trim(),
        brandModel: brandModel.trim(),
        brand: selectedBrand,
        legalOwner: resolvedLegalOwner,
        serialNumber: resolvedSerials[i],
        category: category || 'Office Equipment',
        equipmentType: resolvedEquipmentType,
        currentCondition: currentCondition || 'New',
        status: 'Available',
        remarks: remarks
          ? `${remarks.trim()} [Batch: ${batchNumber}]`
          : `Received in batch ${batchNumber}.`,
        batchId: savedBatch._id,
        batchNumber: batchNumber,
        poNumber: savedBatch.poNumber,
        supplier: savedBatch.supplier,
        receivedDate: savedBatch.receivedDate,
        unitCost: savedBatch.unitCost,
      });
    }

    const createdItems = await Item.insertMany(itemsToInsert);

    // Link created item IDs back to the batch
    savedBatch.items = createdItems.map((it) => it._id);
    await savedBatch.save();

    // 7. Create ItemHistory logs for each individual item
    const historyLogs = createdItems.map((it) => ({
      item: it._id,
      action: 'REGISTERED',
      condition: it.currentCondition,
      remarks: `Intake into inventory under Batch ${batchNumber} (${qty} units received). PO: ${savedBatch.poNumber || 'N/A'}.`,
      performedBy: savedBatch.receivedBy || 'System Administrator',
      date: savedBatch.receivedDate,
    }));
    await ItemHistory.insertMany(historyLogs);

    res.status(201).json({
      success: true,
      batch: savedBatch,
      items: createdItems,
      count: createdItems.length,
      message: `Successfully added ${createdItems.length} units into inventory under Batch ${batchNumber}`,
    });
  } catch (err) {
    console.error('Error creating batch items:', err);
    res.status(500).json({ message: 'Failed to create batch items', error: err.message });
  }
});

module.exports = router;
module.exports.getNextItemNumberSequence = getNextItemNumberSequence;
module.exports.getNextBatchNumber = getNextBatchNumber;

