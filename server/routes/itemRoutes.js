const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const ItemHistory = require('../models/ItemHistory');
const AccountabilityRecord = require('../models/AccountabilityRecord');
const InventoryBatch = require('../models/InventoryBatch');
const inventoryRouter = require('./inventoryRoutes');

// Helper: infer equipment type if not explicitly provided
function inferEquipmentType(desc, brand) {
  const full = ((desc || '') + ' ' + (brand || '')).toLowerCase();
  if (full.includes('battery')) return 'UPS Battery';
  if (full.includes('ups') || full.includes('back-ups')) return 'UPS';
  if (full.includes('mouse')) return 'Mouse';
  if (
    full.includes('laptop') ||
    full.includes('macbook') ||
    full.includes('thinkpad') ||
    full.includes('probook') ||
    full.includes('latitude')
  )
    return 'Laptop';
  if (full.includes('scanner') || full.includes('barcode')) return 'Barcode Scanner';
  if (full.includes('printer')) return 'Printer';
  if (full.includes('tablet') || full.includes('ipad') || full.includes('tab active'))
    return 'Tablet';
  if (full.includes('pos') || full.includes('terminal')) return 'POS Terminal';
  if (full.includes('keyboard')) return 'Keyboard';
  if (full.includes('refractometer') || full.includes('thermometer') || full.includes('qa'))
    return 'Laboratory & QA Tool';
  return 'Other';
}

// GET /api/items/meta/brands - Return availability statistics grouped by brand
router.get('/meta/brands', async (req, res) => {
  try {
    const brandAgg = await Item.aggregate([
      {
        $group: {
          _id: '$brand',
          total: { $sum: 1 },
          assigned: { $sum: { $cond: [{ $eq: ['$status', 'Assigned'] }, 1, 0] } },
          available: { $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] } },
          maintenance: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$status',
                    ['Under Maintenance', 'For Repair', 'For Disposal', 'Decommissioned'],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const coreBrands = ['Goldilocks', 'DU99', 'Taters', 'Icebergs', 'Savore', 'Chatime'];
    const brandMap = {};
    brandAgg.forEach((b) => {
      if (b._id) brandMap[b._id] = b;
    });

    const list = coreBrands.map((bName) => {
      const data = brandMap[bName] || { total: 0, assigned: 0, available: 0, maintenance: 0 };
      return {
        brand: bName,
        total: data.total,
        assigned: data.assigned,
        available: data.available,
        maintenance: data.maintenance,
      };
    });

    res.json(list);
  } catch (err) {
    console.error('Error fetching brand availability:', err);
    res.status(500).json({ message: 'Failed to fetch brand stats', error: err.message });
  }
});

// GET /api/items/inventory-groups - Return inventory grouped by equipment type with counts (filterable by brand)
router.get('/inventory-groups', async (req, res) => {
  try {
    const { brand } = req.query;
    const query = {};

    if (brand && brand !== 'All') {
      query.brand = brand;
    }

    const items = await Item.find(query).sort({ itemNumber: 1 }).lean();
    const groupsMap = {};

    const standardTypes = [
      'Laptop',
      'Mouse',
      'UPS',
      'UPS Battery',
      'Tablet',
      'Barcode Scanner',
      'Printer',
      'POS Terminal',
      'Laboratory & QA Tool',
      'Keyboard',
      'Other',
    ];

    items.forEach((item) => {
      const type = item.equipmentType || inferEquipmentType(item.itemDescription, item.brandModel);
      if (!groupsMap[type]) {
        groupsMap[type] = {
          equipmentType: type,
          category: item.category || 'Office Equipment',
          total: 0,
          assigned: 0,
          available: 0,
          forRepair: 0,
          forDisposal: 0,
          items: [],
        };
      }
      groupsMap[type].total += 1;
      if (item.status === 'Assigned') groupsMap[type].assigned += 1;
      else if (item.status === 'Available') groupsMap[type].available += 1;
      else if (item.status === 'For Repair' || item.status === 'Under Maintenance')
        groupsMap[type].forRepair += 1;
      else if (item.status === 'For Disposal' || item.status === 'Decommissioned')
        groupsMap[type].forDisposal += 1;
      else groupsMap[type].available += 1;

      groupsMap[type].items.push(item);
    });

    const result = Object.values(groupsMap).sort((a, b) => {
      const idxA = standardTypes.indexOf(a.equipmentType);
      const idxB = standardTypes.indexOf(b.equipmentType);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.equipmentType.localeCompare(b.equipmentType);
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching inventory groups:', err);
    res.status(500).json({ message: 'Failed to fetch inventory groups', error: err.message });
  }
});

// GET /api/items - List all items with optional search & filters
router.get('/', async (req, res) => {
  try {
    const { search, category, status, condition, brand } = req.query;
    const query = {};

    if (brand && brand !== 'All') {
      query.brand = brand;
    }

    if (search) {
      query.$or = [
        { itemDescription: { $regex: search, $options: 'i' } },
        { brandModel: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { assetTag: { $regex: search, $options: 'i' } },
        { itemNumber: { $regex: search, $options: 'i' } },
        { setTag: { $regex: search, $options: 'i' } },
        { setEquipmentTag: { $regex: search, $options: 'i' } },
        { setItemNumber: { $regex: search, $options: 'i' } },
        { 'currentAssignment.employeeName': { $regex: search, $options: 'i' } },
        { 'currentAssignment.storeName': { $regex: search, $options: 'i' } },
        { 'currentAssignment.setEquipmentTag': { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (condition && condition !== 'All') {
      query.currentCondition = condition;
    }

    if (req.query.equipmentType && req.query.equipmentType !== 'All') {
      query.equipmentType = req.query.equipmentType;
    }

    const items = await Item.find(query).sort({ updatedAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ message: 'Failed to fetch items', error: err.message });
  }
});

// GET /api/items/next-number - Get next auto-increment unique item number
router.get('/next-number', async (req, res) => {
  try {
    const count = await Item.countDocuments();
    const nextItemNumber = `ITM-${String(count + 1).padStart(4, '0')}`;
    res.json({ nextItemNumber, count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate next item number', error: err.message });
  }
});

// GET /api/items/set-history - Get aggregated history for a whole set and all its component parts
router.get('/set-history', async (req, res) => {
  try {
    let { setEquipmentTag, setItemNumber, accountabilityId, setTag, storeName, itemId, tag } = req.query;

    // If tag is provided, resolve what kind of identifier it is
    if (tag) {
      tag = tag.trim();
      if (!setEquipmentTag && !setItemNumber && !itemId) {
        let singleItem = null;
        if (tag.length === 24 && /^[0-9a-fA-F]{24}$/.test(tag)) {
          singleItem = await Item.findById(tag).lean();
        }
        if (!singleItem) {
          singleItem = await Item.findOne({
            $or: [{ itemNumber: tag }, { assetTag: tag }, { serialNumber: tag }],
          }).lean();
        }

        if (singleItem) {
          if (singleItem.setEquipmentTag) {
            setEquipmentTag = singleItem.setEquipmentTag;
          } else if (singleItem.setItemNumber) {
            setItemNumber = singleItem.setItemNumber;
          } else if (singleItem.currentAssignment?.setEquipmentTag) {
            setEquipmentTag = singleItem.currentAssignment.setEquipmentTag;
          } else if (singleItem.currentAssignment?.setItemNumber) {
            setItemNumber = singleItem.currentAssignment.setItemNumber;
          } else if (singleItem.currentAssignment?.accountabilityId && singleItem.setTag) {
            accountabilityId = singleItem.currentAssignment.accountabilityId.toString();
            setTag = singleItem.setTag;
          } else if (singleItem.currentAssignment?.storeName && singleItem.setTag) {
            storeName = singleItem.currentAssignment.storeName;
            setTag = singleItem.setTag;
          } else {
            itemId = singleItem._id.toString();
          }
        } else {
          setEquipmentTag = tag;
        }
      }
    }

    if (itemId) {
      const targetItem = await Item.findById(itemId).lean();
      if (targetItem) {
        if (targetItem.setEquipmentTag) {
          setEquipmentTag = targetItem.setEquipmentTag;
        } else if (targetItem.setItemNumber) {
          setItemNumber = targetItem.setItemNumber;
        } else if (targetItem.currentAssignment?.accountabilityId && targetItem.setTag) {
          accountabilityId = targetItem.currentAssignment.accountabilityId.toString();
          setTag = targetItem.setTag;
        } else if (targetItem.currentAssignment?.storeName && targetItem.setTag) {
          storeName = targetItem.currentAssignment.storeName;
          setTag = targetItem.setTag;
        }
      }
    }

    if (!setEquipmentTag && !setItemNumber && !accountabilityId && !storeName && !itemId) {
      return res.status(400).json({ message: 'Must provide setEquipmentTag, setItemNumber, tag, or itemId' });
    }

    // 1. Find all items belonging to this set (or standalone item)
    const itemQuery = { $or: [] };
    if (setEquipmentTag) {
      itemQuery.$or.push({ setEquipmentTag });
      itemQuery.$or.push({ 'currentAssignment.setEquipmentTag': setEquipmentTag });
    }
    if (setItemNumber) {
      itemQuery.$or.push({ setItemNumber });
      itemQuery.$or.push({ 'currentAssignment.setItemNumber': setItemNumber });
    }
    if (accountabilityId && setTag) {
      itemQuery.$or.push({
        'currentAssignment.accountabilityId': accountabilityId,
        setTag: setTag,
      });
    }
    if (storeName && setTag) {
      itemQuery.$or.push({
        'currentAssignment.storeName': storeName,
        setTag: setTag,
      });
    }
    if (itemId && itemQuery.$or.length === 0) {
      itemQuery.$or.push({ _id: itemId });
    }

    const items = await Item.find(itemQuery).sort({ itemNumber: 1 }).lean();

    if (!items || items.length === 0) {
      return res.status(404).json({ message: 'No items found for this equipment identifier' });
    }

    // 2. Identify the parent Accountability Record
    const accId = accountabilityId || items[0]?.currentAssignment?.accountabilityId;
    let record = null;
    if (accId) {
      record = await AccountabilityRecord.findById(accId).lean();
    } else if (setEquipmentTag) {
      record = await AccountabilityRecord.findOne({
        'items.setEquipmentTag': setEquipmentTag,
      }).lean();
    }

    // 3. Gather timeline histories for all items in the set
    const itemIds = items.map((i) => i._id);
    const itemHistories = await ItemHistory.find({ item: { $in: itemIds } })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // 4. Map parts with their specific histories and maintenance logs
    const parts = items.map((it) => {
      const itFormItem = record?.items?.find(
        (fi) => fi.item?.toString() === it._id.toString() || fi.itemNumber === it.itemNumber
      );

      const partHistories = itemHistories.filter(
        (h) => h.item?.toString() === it._id.toString()
      );

      return {
        _id: it._id,
        itemNumber: it.itemNumber,
        assetTag: it.assetTag,
        itemDescription: it.itemDescription,
        brandModel: it.brandModel,
        serialNumber: it.serialNumber,
        category: it.category,
        equipmentType: it.equipmentType,
        currentCondition: it.currentCondition,
        status: it.status,
        installedComponents: it.installedComponents || [],
        maintenanceHistory: it.maintenanceHistory || [],
        timelineEvents: partHistories,
        dateIssued: itFormItem?.dateIssued || it.currentAssignment?.dateIssued || it.createdAt,
        conditionAtIssuance: itFormItem?.conditionAtIssuance || it.currentAssignment?.conditionAtIssuance || 'Good',
        returnDetails: itFormItem?.returnDetails || null,
        isReturned: itFormItem?.status === 'Returned' || it.status === 'Available',
      };
    });

    // 5. Construct Whole Set Overview
    const sampleItem = items[0];
    const resolvedSetTag = setTag || sampleItem.setTag || sampleItem.currentAssignment?.setTag || 'Equipment Set';
    const resolvedSetEquipTag = setEquipmentTag || sampleItem.setEquipmentTag || sampleItem.currentAssignment?.setEquipmentTag || 'N/A';
    const resolvedSetItemNum = setItemNumber || sampleItem.setItemNumber || sampleItem.currentAssignment?.setItemNumber || 'N/A';
    const custName = sampleItem.currentAssignment?.employeeName || sampleItem.currentAssignment?.storeName || record?.employeeInfo?.name || record?.storeName || 'Custodian';
    const dept = sampleItem.currentAssignment?.department || record?.employeeInfo?.department || 'Operations';
    const comp = sampleItem.currentAssignment?.company || record?.company || sampleItem.legalOwner || 'Chawnah Foods Inc.';
    const brand = sampleItem.brand || record?.brand || 'Goldilocks';

    // 6. Build unified chronological timeline for the WHOLE SET
    const setTimeline = [];

    // Set Issuance Event
    if (record) {
      setTimeline.push({
        eventId: `issuance-${record._id}`,
        eventType: 'SET_ISSUED',
        title: `Package Issued to ${custName}`,
        date: record.issuance?.date || record.createdAt,
        formNumber: record.formNumber,
        recordId: record._id,
        actor: record.issuance?.releasedBy || 'IT Custodian',
        approvedBy: record.issuance?.approvedBy || 'Management',
        recipient: custName,
        badgeColor: 'emerald',
        badgeText: 'Set Deployed',
        description: `Official ${resolvedSetTag} package issued under Form ${record.formNumber}. Inclusions: ${items.map((i) => i.itemDescription).join(', ')}.`,
        details: {
          accountabilityType: record.accountabilityType,
          company: comp,
          department: dept,
          brand,
          inclusionsCount: items.length,
        },
      });
    } else if (items.length > 0) {
      setTimeline.push({
        eventId: `reg-${sampleItem._id}`,
        eventType: 'ITEM_REGISTERED',
        title: `${sampleItem.itemDescription} (${sampleItem.itemNumber}) Active`,
        date: sampleItem.currentAssignment?.dateIssued || sampleItem.createdAt || new Date(),
        actor: 'IT Asset Custodian',
        recipient: custName,
        badgeColor: 'emerald',
        badgeText: 'Active Gear',
        description: `Equipment unit active in fleet: ${sampleItem.itemDescription} (${sampleItem.brandModel || 'Standard'}). Assigned Custodian: ${custName}.`,
      });
    }

    // Component Maintenance & Replacement Events across the set
    items.forEach((it) => {
      // Part replacements in maintenanceHistory
      if (Array.isArray(it.maintenanceHistory)) {
        it.maintenanceHistory.forEach((mh, idx) => {
          setTimeline.push({
            eventId: `maint-${it._id}-${idx}`,
            eventType: 'PART_MAINTENANCE',
            title: `${it.itemDescription}: ${mh.actionType || 'Component Serviced'}`,
            date: mh.date || new Date(),
            partName: it.itemDescription,
            itemNumber: it.itemNumber,
            actor: mh.performedBy || 'IT Specialist',
            badgeColor: 'blue',
            badgeText: mh.actionType || 'Maintenance',
            description: mh.notes || `Maintenance action performed on ${it.itemDescription} (${it.itemNumber}).`,
            componentName: mh.componentName,
            oldComponent: mh.oldComponent,
            newComponent: mh.newComponent,
          });
        });
      }

      // Check itemHistories for this item
      const itemLogs = itemHistories.filter((h) => h.item?.toString() === it._id.toString());
      itemLogs.forEach((h, hIdx) => {
        if (h.action === 'WHOLE_UNIT_REPLACED' || h.action === 'PART_REPLACEMENT') {
          setTimeline.push({
            eventId: `log-${h._id || `${it._id}-${hIdx}`}`,
            eventType: h.action,
            title: `${it.itemDescription}: ${h.action.replace(/_/g, ' ')}`,
            date: h.date || h.createdAt,
            partName: it.itemDescription,
            itemNumber: it.itemNumber,
            actor: h.performedBy || 'IT Specialist',
            badgeColor: 'amber',
            badgeText: h.action.replace(/_/g, ' '),
            description: h.remarks || `Replacement on ${it.itemDescription}.`,
          });
        }
      });
    });

    // Check if Whole Set was returned or partially returned
    if (record?.status === 'Returned' || record?.status === 'Partially Returned') {
      const allReturned = parts.every((p) => p.isReturned);
      setTimeline.push({
        eventId: `return-${record._id}`,
        eventType: allReturned ? 'SET_RETURNED' : 'SET_PARTIALLY_RETURNED',
        title: allReturned ? 'Whole Set Returned to IT Inventory' : 'Partial Set Return Logged',
        date: record.returnSummary?.returnDate || record.updatedAt,
        actor: record.returnSummary?.inspectedBy || 'IT Inspector',
        approvedBy: record.returnSummary?.approvedBy || 'Management',
        badgeColor: allReturned ? 'purple' : 'indigo',
        badgeText: allReturned ? 'Set Returned' : 'Partial Return',
        description: record.returnSummary?.notes || (allReturned ? 'All component parts returned to Central IT Storage.' : 'Some component parts returned.'),
        conditionUponReturn: record.returnSummary?.conditionUponReturn || 'Good',
        completeness: record.returnSummary?.completeness || (allReturned ? 'Complete' : 'Incomplete'),
        chargesAssessment: record.returnSummary?.chargesAssessment || 'No charges',
      });
    }

    // Sort setTimeline chronologically descending
    setTimeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      setInfo: {
        setTag: resolvedSetTag,
        setEquipmentTag: resolvedSetEquipTag,
        setItemNumber: resolvedSetItemNum,
        custodian: custName,
        department: dept,
        company: comp,
        brand,
        status: sampleItem.status || 'Assigned',
        condition: sampleItem.currentCondition || 'Good',
        dateIssued: record?.issuance?.date || sampleItem.createdAt,
        formNumber: record?.formNumber || 'N/A',
        formId: record?._id || null,
        releasedBy: record?.issuance?.releasedBy || 'IT Department',
        approvedBy: record?.issuance?.approvedBy || 'Management',
      },
      parts,
      setTimeline,
      summary: {
        totalParts: parts.length,
        activePartsCount: parts.filter((p) => !p.isReturned).length,
        returnedPartsCount: parts.filter((p) => p.isReturned).length,
        replacedPartsCount: parts.filter((p) => p.maintenanceHistory?.length > 0).length,
      },
    });
  } catch (err) {
    console.error('Error fetching set history:', err);
    res.status(500).json({ message: 'Failed to fetch set history', error: err.message });
  }
});

// GET /api/items/:id - Get item details with full ownership history & audit notes
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Retrieve history events from ItemHistory
    const history = await ItemHistory.find({ item: item._id })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Also find all accountability records that ever referenced this item
    const records = await AccountabilityRecord.find({
      'items.item': item._id,
    })
      .populate('employee')
      .sort({ createdAt: -1 })
      .lean();

    // Build past and current ownership log
    const ownershipHistory = [];

    records.forEach((record) => {
      const formItem = record.items?.find(
        (i) => i.item && i.item.toString() === item._id.toString()
      );

      if (formItem) {
        ownershipHistory.push({
          formNumber: record.formNumber,
          recordId: record._id,
          accountabilityType: record.accountabilityType || 'Individual',
          storeName: record.storeName || '',
          targetGroup: record.targetGroup || '',
          employee: {
            id: record.employee?._id,
            name: record.employeeInfo?.name || record.employee?.name || record.storeName || 'Assigned Custodian',
            employeeId: record.employeeInfo?.employeeId || record.employee?.employeeId || 'N/A',
            jobTitle: record.employeeInfo?.jobTitle || record.employee?.jobTitle || '',
            department: record.employeeInfo?.department || record.employee?.department || '',
          },
          status: formItem.status || 'Active', // 'Active' or 'Returned'
          dateIssued: record.issuance?.date || record.createdAt,
          conditionAtIssuance: formItem.conditionAtIssuance || 'Good',
          issuanceRemarks: formItem.remarks || '',
          releasedBy: record.issuance?.releasedBy || '',
          approvedBy: record.issuance?.approvedBy || '',
          returnDetails: formItem.returnDetails || null,
        });
      }
    });

    // Enrich currentAssignment with active form details & issuance remarks
    let currentAssignment = item.currentAssignment
      ? (typeof item.currentAssignment.toObject === 'function' ? item.currentAssignment.toObject() : { ...item.currentAssignment })
      : null;

    if (currentAssignment && (currentAssignment.employeeName || currentAssignment.storeName || item.status === 'Assigned')) {
      const activeRecord = ownershipHistory.find((h) => h.status === 'Active');
      if (activeRecord) {
        currentAssignment.formNumber = currentAssignment.formNumber || activeRecord.formNumber;
        currentAssignment.issuanceRemarks = currentAssignment.issuanceRemarks || activeRecord.issuanceRemarks;
        currentAssignment.releasedBy = currentAssignment.releasedBy || activeRecord.releasedBy;
        currentAssignment.approvedBy = currentAssignment.approvedBy || activeRecord.approvedBy;
        currentAssignment.conditionAtIssuance = currentAssignment.conditionAtIssuance || activeRecord.conditionAtIssuance;
      }
    }

    res.json({
      item,
      currentAssignment,
      ownershipHistory,
      timelineEvents: history,
    });
  } catch (err) {
    console.error('Error fetching item details:', err);
    res.status(500).json({ message: 'Failed to fetch item details', error: err.message });
  }
});

// POST /api/items - Add a new item to inventory
router.post('/', async (req, res) => {
  try {
    const {
      assetTag,
      itemDescription,
      brandModel,
      serialNumber,
      category,
      currentCondition,
      remarks,
    } = req.body;

    // Check unique serial number
    const existingSerial = await Item.findOne({ serialNumber: serialNumber.trim() });
    if (existingSerial) {
      return res.status(400).json({ message: `Serial Number "${serialNumber}" already exists.` });
    }

    // Check unique asset tag
    const existingTag = await Item.findOne({ assetTag: assetTag.trim().toUpperCase() });
    if (existingTag) {
      return res.status(400).json({ message: `Asset Tag "${assetTag}" already exists.` });
    }

    // Generate next itemNumber if not provided
    let itemNum = req.body.itemNumber;
    if (!itemNum) {
      const [nextNum] = await inventoryRouter.getNextItemNumberSequence(1);
      itemNum = nextNum;
    }

    const newItem = new Item({
      itemNumber: itemNum,
      assetTag: assetTag.trim().toUpperCase(),
      itemDescription: itemDescription.trim(),
      brandModel: brandModel.trim(),
      serialNumber: serialNumber.trim(),
      category: category || 'Laptops & Desktops',
      equipmentType: req.body.equipmentType || inferEquipmentType(itemDescription, brandModel),
      currentCondition: currentCondition || 'Good',
      status: 'Available',
      remarks: remarks ? remarks.trim() : '',
      poNumber: req.body.poNumber ? req.body.poNumber.trim().toUpperCase() : '',
      supplier: req.body.supplier ? req.body.supplier.trim() : '',
    });

    const saved = await newItem.save();

    // Log creation event in ItemHistory
    await ItemHistory.create({
      item: saved._id,
      action: 'REGISTERED',
      condition: saved.currentCondition,
      remarks: remarks || 'Item entered into inventory system.',
      performedBy: 'System Administrator',
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error('Error adding item:', err);
    res.status(400).json({ message: 'Failed to add item', error: err.message });
  }
});

// PUT /api/items/equipment-type/update - Rename equipment type or update its category across all items
router.put('/equipment-type/update', async (req, res) => {
  try {
    const { oldType, newType, category } = req.body;
    if (!oldType || !newType) {
      return res.status(400).json({ message: 'oldType and newType are required' });
    }

    const updateFields = { equipmentType: newType.trim() };
    if (category) updateFields.category = category.trim();

    const result = await Item.updateMany(
      { equipmentType: oldType },
      { $set: updateFields }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error updating equipment type:', err);
    res.status(500).json({ message: 'Failed to update equipment type', error: err.message });
  }
});

// DELETE /api/items/equipment-type/delete - Delete all items of an equipment type
router.delete('/equipment-type/delete', async (req, res) => {
  try {
    const equipmentType = req.body.equipmentType || req.query.equipmentType;
    if (!equipmentType) {
      return res.status(400).json({ message: 'equipmentType is required' });
    }
    const isForce = req.body.force === true || req.query.force === 'true';

    const itemsToDelete = await Item.find({ equipmentType }).select('_id status');
    if (itemsToDelete.length === 0) {
      return res.status(404).json({ message: `No items found for equipment type "${equipmentType}"` });
    }

    const assignedCount = itemsToDelete.filter(i => i.status === 'Assigned').length;
    if (assignedCount > 0 && !isForce) {
      return res.status(400).json({
        message: `Cannot delete equipment type "${equipmentType}" because ${assignedCount} unit(s) are currently assigned. Use force delete to proceed.`,
        hasActive: true,
        assignedCount,
      });
    }

    const itemIds = itemsToDelete.map(i => i._id);
    await ItemHistory.deleteMany({ item: { $in: itemIds } });
    const deleteResult = await Item.deleteMany({ equipmentType });

    res.json({ success: true, deletedCount: deleteResult.deletedCount });
  } catch (err) {
    console.error('Error deleting equipment type:', err);
    res.status(500).json({ message: 'Failed to delete equipment type', error: err.message });
  }
});

// PUT /api/items/:id - Update item details
router.put('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const previousCondition = item.currentCondition;
    const previousStatus = item.status;

    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Check if condition or status changed, log into history
    if (req.body.currentCondition && req.body.currentCondition !== previousCondition) {
      await ItemHistory.create({
        item: updated._id,
        action: 'CONDITION_UPDATE',
        condition: req.body.currentCondition,
        remarks: `Condition changed from ${previousCondition} to ${req.body.currentCondition}. ${req.body.remarks || ''}`,
        performedBy: req.body.performedBy || 'System Administrator',
      });
    }

    if (req.body.status && req.body.status !== previousStatus) {
      await ItemHistory.create({
        item: updated._id,
        action: 'MAINTENANCE',
        condition: updated.currentCondition,
        remarks: `Status changed from "${previousStatus}" to "${req.body.status}". Notes: ${req.body.remarks || 'No notes specified.'}`,
        performedBy: req.body.performedBy || 'Maintenance / IT Officer',
      });
    }

    res.json(updated);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(400).json({ message: 'Failed to update item', error: err.message });
  }
});

// POST /api/items/:id/remarks - Append a custom remark/note to an item's record
router.post('/:id/remarks', async (req, res) => {
  try {
    const { remarks, performedBy } = req.body;
    if (!remarks) {
      return res.status(400).json({ message: 'Remarks text is required' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Append to item's own remarks and create a history record
    item.remarks = item.remarks ? `${item.remarks}\n[${new Date().toLocaleDateString()}]: ${remarks}` : remarks;
    await item.save();

    const historyEntry = await ItemHistory.create({
      item: item._id,
      action: 'NOTE_ADDED',
      remarks,
      performedBy: performedBy || 'System Administrator',
      date: new Date(),
    });

    res.json({ message: 'Remark added successfully', item, historyEntry });
  } catch (err) {
    console.error('Error adding remark:', err);
    res.status(500).json({ message: 'Failed to add remark', error: err.message });
  }
});

// POST /api/items/:id/replace-part - Replace one or multiple components (e.g. battery, RAM, screen) and set old part(s) to For Repair / For Disposal
router.post('/:id/replace-part', async (req, res) => {
  try {
    const parentItem = await Item.findById(req.params.id);
    if (!parentItem) {
      return res.status(404).json({ message: 'Parent equipment item not found' });
    }

    const actor = req.body.performedBy || 'IT Department Administrator';
    const overallNotes = req.body.notes || '';

    // Normalize replacements array
    let itemsToReplace = [];
    if (
      req.body.replacements &&
      Array.isArray(req.body.replacements) &&
      req.body.replacements.length > 0
    ) {
      itemsToReplace = req.body.replacements;
    } else if (req.body.oldComponent) {
      itemsToReplace = [
        {
          componentType: req.body.componentType || 'Component',
          oldComponent: req.body.oldComponent,
          newComponent: req.body.newComponent,
          registerOldAsItem: req.body.registerOldAsItem !== false,
          notes: req.body.notes,
        },
      ];
    } else {
      return res.status(400).json({ message: 'No replacement components specified.' });
    }

    if (!parentItem.installedComponents) parentItem.installedComponents = [];
    if (!parentItem.maintenanceHistory) parentItem.maintenanceHistory = [];

    const processedResults = [];

    for (const rep of itemsToReplace) {
      const {
        componentType = 'Component',
        oldComponent,
        newComponent,
        registerOldAsItem = true,
        notes = '',
      } = rep;

      if (!oldComponent || !oldComponent.disposition) {
        continue;
      }

      let newCompDoc = null;
      let oldCompDoc = null;

      // 1. Process New Component (if selected from inventory)
      if (newComponent?.itemId) {
        newCompDoc = await Item.findById(newComponent.itemId);
        if (newCompDoc) {
          newCompDoc.status = 'Assigned';
          newCompDoc.currentCondition = 'Good';
          newCompDoc.parentItem = {
            itemId: parentItem._id,
            itemNumber: parentItem.itemNumber,
            itemDescription: parentItem.itemDescription,
            installedDate: new Date(),
          };

          if (parentItem.currentAssignment?.accountabilityType) {
            newCompDoc.currentAssignment = {
              ...(parentItem.currentAssignment.toObject
                ? parentItem.currentAssignment.toObject()
                : parentItem.currentAssignment),
            };
          }
          await newCompDoc.save();

          await ItemHistory.create({
            item: newCompDoc._id,
            action: 'COMPONENT_INSTALLED',
            condition: newCompDoc.currentCondition,
            remarks: `Installed as replacement ${componentType} on ${parentItem.itemDescription} (${parentItem.itemNumber}). Performed by: ${actor}. Notes: ${notes || overallNotes || 'N/A'}`,
            performedBy: actor,
          });
        }
      }

      // 2. Process Old Component
      if (oldComponent.existingItemId) {
        oldCompDoc = await Item.findById(oldComponent.existingItemId);
        if (oldCompDoc) {
          oldCompDoc.status = oldComponent.disposition; // 'For Repair' or 'For Disposal'
          oldCompDoc.currentCondition =
            oldComponent.disposition === 'For Repair' ? 'Under Repair' : 'Damaged';
          oldCompDoc.parentItem = null;
          oldCompDoc.currentAssignment = null;
          oldCompDoc.remarks = `Replaced from ${parentItem.itemDescription} (${parentItem.itemNumber}). Reason: ${oldComponent.reason || 'Component replaced'}`;
          await oldCompDoc.save();

          await ItemHistory.create({
            item: oldCompDoc._id,
            action: `REPLACED_${oldComponent.disposition.toUpperCase().replace(/\s+/g, '_')}`,
            condition: oldCompDoc.currentCondition,
            remarks: `Removed from ${parentItem.itemDescription} (${parentItem.itemNumber}). Disposition: ${oldComponent.disposition}. Reason: ${oldComponent.reason || 'None specified'}. Performed by: ${actor}`,
            performedBy: actor,
          });
        }
      } else if (registerOldAsItem) {
        const count = await Item.countDocuments();
        const oldItemNumber = `ITM-${String(count + 1).padStart(4, '0')}`;
        const oldTag = `TAG-DISM-${String(count + 1).padStart(4, '0')}`;
        const createdOld = new Item({
          itemNumber: oldItemNumber,
          assetTag: oldTag,
          itemDescription:
            oldComponent.description ||
            `Old ${componentType} from ${parentItem.itemNumber}`,
          brandModel: parentItem.brandModel || 'Dismantled Component',
          serialNumber:
            oldComponent.serialNumber ||
            `SN-DISM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          category: parentItem.category || 'Office Equipment',
          equipmentType: componentType || 'Other',
          currentCondition:
            oldComponent.disposition === 'For Repair' ? 'Under Repair' : 'Damaged',
          status: oldComponent.disposition,
          remarks: `Dismantled from ${parentItem.itemDescription} (${parentItem.itemNumber}). Reason: ${oldComponent.reason || 'Part replacement'}.`,
        });
        await createdOld.save();
        oldCompDoc = createdOld;

        await ItemHistory.create({
          item: createdOld._id,
          action: `DISMANTLED_${oldComponent.disposition.toUpperCase().replace(/\s+/g, '_')}`,
          condition: createdOld.currentCondition,
          remarks: `Dismantled from ${parentItem.itemDescription} (${parentItem.itemNumber}). Set to: ${oldComponent.disposition}. Reason: ${oldComponent.reason || 'N/A'}. Performed by: ${actor}`,
          performedBy: actor,
        });
      }

      // 3. Update Parent's installedComponents (remove previous matching component if any)
      parentItem.installedComponents = parentItem.installedComponents.filter(
        (c) =>
          c.componentType !== componentType &&
          (!oldComponent.serialNumber || c.serialNumber !== oldComponent.serialNumber)
      );

      parentItem.installedComponents.push({
        componentType,
        itemId: newCompDoc?._id || null,
        itemNumber: newCompDoc?.itemNumber || newComponent?.itemNumber || '',
        itemDescription: newCompDoc?.itemDescription || newComponent?.description || '',
        serialNumber: newCompDoc?.serialNumber || newComponent?.serialNumber || '',
        installedDate: new Date(),
        installedBy: actor,
        notes: notes || overallNotes || '',
      });

      parentItem.maintenanceHistory.unshift({
        date: new Date(),
        actionType: 'Replacement',
        componentName: componentType,
        oldComponent: {
          itemId: oldCompDoc?._id || null,
          itemNumber: oldCompDoc?.itemNumber || '',
          serialNumber: oldComponent.serialNumber || '',
          description: oldComponent.description || '',
          disposition: oldComponent.disposition,
          reason: oldComponent.reason || '',
        },
        newComponent: {
          itemId: newCompDoc?._id || null,
          itemNumber: newCompDoc?.itemNumber || newComponent?.itemNumber || '',
          serialNumber: newCompDoc?.serialNumber || newComponent?.serialNumber || '',
          description: newCompDoc?.itemDescription || newComponent?.description || '',
        },
        performedBy: actor,
        notes: notes || overallNotes || '',
      });

      await ItemHistory.create({
        item: parentItem._id,
        action: 'PART_REPLACEMENT',
        condition: parentItem.currentCondition,
        remarks: `${componentType} replaced: Old component set to "${oldComponent.disposition}". New component: ${newCompDoc?.itemNumber || newComponent?.itemNumber || ''} (${newCompDoc?.itemDescription || newComponent?.description || ''}). Performed by: ${actor}. Notes: ${notes || overallNotes || 'N/A'}`,
        performedBy: actor,
      });

      processedResults.push({
        componentType,
        newComponent: newCompDoc,
        oldComponent: oldCompDoc,
      });
    }

    await parentItem.save();

    res.json({
      success: true,
      message: `Successfully processed replacement for ${processedResults.length} component(s)!`,
      parentItem,
      results: processedResults,
    });
  } catch (err) {
    console.error('Error replacing component(s):', err);
    res.status(500).json({
      message: 'Failed to process component replacement',
      error: err.message,
    });
  }
});

// POST /api/items/:id/replace-whole - Replace an entire issued equipment unit with an available unit
router.post('/:id/replace-whole', async (req, res) => {
  try {
    const { oldUnit, newReplacementItemId, performedBy, notes } = req.body;
    const actor = performedBy || 'IT Department Specialist';

    // 1. Fetch old item
    const oldItem = await Item.findById(req.params.id);
    if (!oldItem) {
      return res.status(404).json({ message: 'Equipment unit not found' });
    }

    // 2. Fetch new replacement item
    if (!newReplacementItemId) {
      return res
        .status(400)
        .json({ message: 'Please select a new replacement unit from inventory' });
    }
    const newItem = await Item.findById(newReplacementItemId);
    if (!newItem) {
      return res.status(404).json({ message: 'Replacement unit not found in inventory' });
    }
    if (newItem.status !== 'Available') {
      return res.status(400).json({
        message: `Replacement unit (${newItem.itemNumber}) is currently "${newItem.status}". Only "Available" units can be issued as replacements.`,
      });
    }

    const disposition = oldUnit?.disposition === 'For Repair' ? 'For Repair' : 'For Disposal';
    const oldCondition =
      oldUnit?.condition || (disposition === 'For Repair' ? 'Under Repair' : 'Damaged');
    const reason = oldUnit?.reason || 'Whole unit hardware replacement';

    // 3. Extract custodian context from old item
    const currentCustody = oldItem.currentAssignment || {};
    const recordId = currentCustody.accountabilityRecord || currentCustody.accountabilityId;

    let accountabilityRecord = null;
    if (recordId) {
      accountabilityRecord = await AccountabilityRecord.findById(recordId);
    } else if (currentCustody.formNumber) {
      accountabilityRecord = await AccountabilityRecord.findOne({
        formNumber: currentCustody.formNumber,
      });
    }

    // 4. Update Accountability Record if exists
    if (accountabilityRecord) {
      const formItem = accountabilityRecord.items.find(
        (i) => i.item?.toString() === oldItem._id.toString() || i.itemNumber === oldItem.itemNumber
      );

      if (formItem) {
        formItem.status = 'Returned';
        formItem.returnDetails = {
          returnDate: new Date(),
          conditionUponReturn: disposition === 'For Repair' ? 'Fair' : 'Damaged',
          completeness: 'Complete',
          notes: `Replaced with whole unit ${newItem.itemNumber} (${newItem.assetTag || ''} - ${newItem.brandModel || newItem.itemDescription}). Defect/Reason: ${reason}. Specialist: ${actor}`,
          inspectedBy: actor,
          approvedBy: actor,
        };
      }

      accountabilityRecord.items.push({
        item: newItem._id,
        itemNumber: newItem.itemNumber,
        assetTag: newItem.assetTag,
        itemDescription: newItem.itemDescription,
        brandModel: newItem.brandModel,
        serialNumber: newItem.serialNumber,
        conditionAtIssuance: newItem.currentCondition || 'Good',
        status: 'Active',
        remarks: `Replacement unit issued for defective ${oldItem.itemNumber} (${oldItem.brandModel}). Reason: ${reason}`,
      });

      const hasActive = accountabilityRecord.items.some((i) => i.status === 'Active');
      accountabilityRecord.status = hasActive ? 'Active' : 'Partially Returned';

      await accountabilityRecord.save();
    }

    // 5. Update Old Item (Set to For Repair or For Disposal, clear custody)
    oldItem.status = disposition;
    oldItem.currentCondition = oldCondition;
    oldItem.currentAssignment = null;

    const oldNote = `[WHOLE UNIT REPLACED on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}]: Swapped out and replaced with ${newItem.itemNumber} (${newItem.assetTag || ''} - ${newItem.brandModel}). Sent to ${disposition}. Defect/Reason: ${reason}. Specialist: ${actor}. ${notes ? `Notes: ${notes}` : ''}`;

    oldItem.remarks = oldItem.remarks ? `${oldItem.remarks}\n\n${oldNote}` : oldNote;

    if (!oldItem.maintenanceHistory) oldItem.maintenanceHistory = [];
    oldItem.maintenanceHistory.unshift({
      date: new Date(),
      actionType: 'Whole Unit Replacement',
      componentName: `Whole Unit (${oldItem.equipmentType || 'Equipment'})`,
      oldComponent: {
        itemId: oldItem._id,
        itemNumber: oldItem.itemNumber,
        serialNumber: oldItem.serialNumber,
        description: oldItem.itemDescription,
        disposition: disposition,
        reason: reason,
      },
      newComponent: {
        itemId: newItem._id,
        itemNumber: newItem.itemNumber,
        serialNumber: newItem.serialNumber,
        description: newItem.itemDescription,
      },
      performedBy: actor,
      notes: notes || '',
    });

    await oldItem.save();

    // 6. Update New Replacement Item (Assign to custodian)
    newItem.status = 'Assigned';
    newItem.currentAssignment = {
      accountabilityType:
        currentCustody.accountabilityType || (currentCustody.storeName ? 'Store' : 'Individual'),
      storeName: currentCustody.storeName || undefined,
      employee: currentCustody.employee || undefined,
      employeeName:
        currentCustody.employeeName || currentCustody.storeName || 'Assigned Custodian',
      employeeId: currentCustody.employeeId || 'CFI-GRP',
      department: currentCustody.department || 'Operations',
      assignedDate: new Date(),
      dateIssued: new Date(),
      accountabilityId: accountabilityRecord
        ? accountabilityRecord._id
        : currentCustody.accountabilityId || currentCustody.accountabilityRecord,
      accountabilityRecord: accountabilityRecord
        ? accountabilityRecord._id
        : currentCustody.accountabilityRecord || currentCustody.accountabilityId,
      formNumber: accountabilityRecord
        ? accountabilityRecord.formNumber
        : currentCustody.formNumber,
    };

    const newNote = `[REPLACEMENT ISSUED on ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })}]: Deployed as whole unit replacement for ${oldItem.itemNumber} (${oldItem.assetTag || ''} - ${oldItem.brandModel}). Custodian: ${currentCustody.employeeName || currentCustody.storeName || 'Custodian'}. Form: ${accountabilityRecord?.formNumber || currentCustody.formNumber || 'Direct Assignment'}. Specialist: ${actor}.`;

    newItem.remarks = newItem.remarks ? `${newItem.remarks}\n\n${newNote}` : newNote;

    await newItem.save();

    // 7. Log ItemHistory audit entries
    const historyAction =
      disposition === 'For Repair' ? 'REPLACED_FOR_REPAIR' : 'REPLACED_FOR_DISPOSAL';

    await ItemHistory.create({
      item: oldItem._id,
      action: historyAction,
      condition: oldItem.currentCondition,
      remarks: `Whole unit replaced by ${newItem.itemNumber} (${newItem.assetTag || ''} - ${newItem.brandModel}). Old unit routed to "${disposition}". Reason: ${reason}. Performed by: ${actor}. ${notes ? `Notes: ${notes}` : ''}`,
      accountabilityType: currentCustody.accountabilityType || 'Individual',
      storeName: currentCustody.storeName,
      employee: currentCustody.employee,
      employeeName: currentCustody.employeeName,
      department: currentCustody.department,
      formNumber: accountabilityRecord?.formNumber || currentCustody.formNumber,
      accountabilityId: accountabilityRecord?._id,
      performedBy: actor,
    });

    await ItemHistory.create({
      item: newItem._id,
      action: 'ASSIGNED',
      condition: newItem.currentCondition,
      remarks: `Issued as whole unit replacement for defective ${oldItem.itemNumber} (${oldItem.brandModel}). Custodian: ${currentCustody.employeeName || currentCustody.storeName || 'Custodian'}. Form: ${accountabilityRecord?.formNumber || currentCustody.formNumber || 'Direct Transfer'}. Performed by: ${actor}.`,
      accountabilityType: currentCustody.accountabilityType || 'Individual',
      storeName: currentCustody.storeName,
      employee: currentCustody.employee,
      employeeName: currentCustody.employeeName,
      department: currentCustody.department,
      formNumber: accountabilityRecord?.formNumber || currentCustody.formNumber,
      accountabilityId: accountabilityRecord?._id,
      performedBy: actor,
    });

    res.json({
      success: true,
      message: `Equipment ${oldItem.itemNumber} successfully replaced with ${newItem.itemNumber}. Old unit designated as "${disposition}".`,
      oldItem,
      newItem,
      accountabilityRecord,
    });
  } catch (err) {
    console.error('Error in replace-whole:', err);
    res.status(500).json({
      message: 'Failed to process whole unit replacement',
      error: err.message,
    });
  }
});

// DELETE /api/items/:id - Delete item (if not assigned or force=true)
router.delete('/:id', async (req, res) => {
  try {
    const isForce = req.query.force === 'true';
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    if (item.status === 'Assigned' && !isForce) {
      return res.status(400).json({
        message: 'Cannot delete item while it is currently assigned. Please process its return first, or confirm force delete.',
        hasActive: true,
      });
    }

    await ItemHistory.deleteMany({ item: item._id });
    await Item.findByIdAndDelete(req.params.id);

    res.json({ message: 'Item and its history deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ message: 'Failed to delete item', error: err.message });
  }
});

module.exports = router;

