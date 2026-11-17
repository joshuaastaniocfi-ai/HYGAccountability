const express = require('express');
const router = express.Router();
const AccountabilityRecord = require('../models/AccountabilityRecord');
const Item = require('../models/Item');
const Employee = require('../models/Employee');
const ItemHistory = require('../models/ItemHistory');

// Utility to derive equipment type from description and category
const deriveEquipmentType = (desc, category) => {
  const d = (desc || '').toLowerCase();
  if (d.includes('laptop') || d.includes('notebook') || d.includes('macbook')) return 'Laptop';
  if (d.includes('system unit') || d.includes('desktop') || d.includes('cpu tower') || d.includes('workstation')) return 'Desktop';
  if (d.includes('monitor') || d.includes('display') || d.includes('screen')) return 'Monitor';
  if (d.includes('keyboard')) return 'Keyboard';
  if (d.includes('mouse')) return 'Mouse';
  if (d.includes('ups battery') || d.includes('battery')) return 'UPS Battery';
  if (d.includes('ups') || d.includes('apc') || d.includes('uninterruptible')) return 'UPS';
  if (d.includes('dvr') || d.includes('nvr') || d.includes('recorder')) return 'DVR';
  if (d.includes('camera') || d.includes('cctv')) return 'CCTV Camera';
  if (d.includes('printer') || d.includes('thermal')) return 'Printer';
  if (d.includes('scanner') || d.includes('barcode')) return 'Barcode Scanner';
  if (d.includes('cable') || d.includes('hdmi') || d.includes('lan') || d.includes('wire')) return 'Cables & Accessories';
  if (d.includes('power supply') || d.includes('splitter') || d.includes('adapter')) return 'Power Supplies & Adapters';
  return 'Other';
};

// Utility to generate formatted unique Form Number
const generateFormNumber = async () => {
  const count = await AccountabilityRecord.countDocuments();
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(4, '0');
  return `CFI-ACT-${year}-${sequence}`;
};

// GET /api/accountabilities - List all forms
router.get('/', async (req, res) => {
  try {
    const { status, search, employeeId, company, brand } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (company && company !== 'All') {
      query.company = company;
    }

    if (brand && brand !== 'All') {
      query.brand = brand;
    }

    if (employeeId) {
      query.employee = employeeId;
    }

    if (search) {
      query.$or = [
        { formNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { propertyOwnerCompany: { $regex: search, $options: 'i' } },
        { 'employeeInfo.name': { $regex: search, $options: 'i' } },
        { 'employeeInfo.employeeId': { $regex: search, $options: 'i' } },
        { 'employeeInfo.department': { $regex: search, $options: 'i' } },
        { 'items.serialNumber': { $regex: search, $options: 'i' } },
        { 'items.itemDescription': { $regex: search, $options: 'i' } },
      ];
    }

    const records = await AccountabilityRecord.find(query)
      .populate('employee')
      .populate('items.item')
      .sort({ createdAt: -1 })
      .lean();

    res.json(records);
  } catch (err) {
    console.error('Error fetching accountability records:', err);
    res.status(500).json({ message: 'Failed to fetch accountability records', error: err.message });
  }
});

// GET /api/accountabilities/:id - Get single form details
router.get('/:id', async (req, res) => {
  try {
    const record = await AccountabilityRecord.findById(req.params.id)
      .populate('employee')
      .populate('items.item');

    if (!record) {
      return res.status(404).json({ message: 'Accountability record not found' });
    }

    res.json(record);
  } catch (err) {
    console.error('Error fetching accountability record:', err);
    res.status(500).json({ message: 'Failed to fetch accountability record', error: err.message });
  }
});

// POST /api/accountabilities - Issue new Accountability Form
router.post('/', async (req, res) => {
  try {
    const {
      accountabilityType = 'Individual', // 'Individual' | 'Store' | 'Department' | 'Office'
      storeName,
      officeLocation,
      employeeId, // ObjectId of employee OR
      employeeInfo, // { name, employeeId, jobTitle, department }
      items, // Array of equipment items
      issuance, // { dateOfRelease, date, releasedBy, approvedBy, employeeSignatureName, employeeSignatureImage, ... }
    } = req.body;

    // Determine target group label
    let targetGroup = '';
    if (accountabilityType === 'Store') {
      targetGroup = `Store: ${storeName || 'Branch'}`;
    } else if (accountabilityType === 'Department') {
      targetGroup = `Department: ${employeeInfo?.department || 'Department'}`;
    } else if (accountabilityType === 'Office') {
      targetGroup = `Office: ${officeLocation || 'Main Office'}`;
    } else {
      targetGroup = `Individual: ${employeeInfo?.name || 'Employee'}`;
    }

    if (!items || !items.length) {
      return res.status(400).json({ message: 'At least one equipment item is required' });
    }

    // 1. Resolve or Create Employee
    let employee = null;
    if (employeeId && employeeId.length === 24) {
      employee = await Employee.findById(employeeId);
    }

    if (!employee && employeeInfo && employeeInfo.employeeId) {
      // Find by custom employee ID
      employee = await Employee.findOne({ employeeId: employeeInfo.employeeId.trim().toUpperCase() });
      if (!employee) {
        // Create new employee on the fly
        employee = new Employee({
          employeeId: employeeInfo.employeeId.trim().toUpperCase(),
          name: employeeInfo.name?.trim() || 'New Employee',
          jobTitle: employeeInfo.jobTitle?.trim() || employeeInfo.position?.trim() || 'Staff',
          department: employeeInfo.department?.trim() || 'Quality Assurance',
          status: 'Active',
        });
        await employee.save();
      } else {
        // Optionally update job title / department if provided
        if (employeeInfo.jobTitle) employee.jobTitle = employeeInfo.jobTitle;
        if (employeeInfo.department) employee.department = employeeInfo.department;
        if (employeeInfo.name) employee.name = employeeInfo.name;
        await employee.save();
      }
    } else if (!employee) {
      return res.status(400).json({ message: 'Employee information is required' });
    }

    // 2. Resolve Brand, Employer Company & Legal Property Owner
    // Rule: For Goldilocks (including all franchisees), legal owner is Chawnah Foods Inc.
    // For others, legal owner is their respective parent company.
    const employeeCompany = employee.company || req.body.company || 'Chawnah Foods Inc.';
    const employeeBrand = employee.brand || req.body.brand || 'Goldilocks';

    const resolveLegalOwner = (b, c) => {
      const bLower = (b || '').toLowerCase();
      const cLower = (c || '').toLowerCase();
      if (
        bLower.includes('goldilocks') ||
        cLower.includes('goldilocks') ||
        cLower.includes('chawnah') ||
        cLower.includes('cake haven') ||
        cLower.includes('cakes and occasions') ||
        cLower.includes('fresh berry') ||
        cLower.includes('cfi')
      ) {
        return { brand: 'Goldilocks', legalOwner: 'Chawnah Foods Inc.' };
      }
      if (bLower.includes('du99') || cLower.includes('du99')) {
        return { brand: 'DU99', legalOwner: 'DU99 Commercial Corp.' };
      }
      if (bLower.includes('taters') || cLower.includes('taters') || cLower.includes('pop and chips')) {
        return { brand: 'Taters', legalOwner: 'Pop and Chips Specialist Inc.' };
      }
      if (bLower.includes('iceberg') || cLower.includes('iceberg') || cLower.includes('cool ice')) {
        return { brand: 'Icebergs', legalOwner: 'Cool Ice Food Desserts' };
      }
      if (bLower.includes('savore') || cLower.includes('savore')) {
        return { brand: 'Savore', legalOwner: 'Savore Kitchen Corp' };
      }
      if (bLower.includes('chatime') || cLower.includes('chatime') || cLower.includes('salu-salong') || cLower.includes('saya')) {
        return { brand: 'Chatime', legalOwner: 'Salu-salong Saya Food Inc.' };
      }
      return { brand: employeeBrand, legalOwner: employeeCompany };
    };

    const { brand: resolvedBrand, legalOwner } = resolveLegalOwner(employeeBrand, employeeCompany);

    // 3. Resolve or Create Items in inventory
    const formItems = [];
    const resolvedDbItems = [];

    const totalItemCount = await Item.countDocuments();

    for (let idx = 0; idx < items.length; idx++) {
      const itemInput = items[idx];
      let dbItem = null;

      if (itemInput.itemId) {
        dbItem = await Item.findById(itemInput.itemId);
      }

      if (!dbItem && itemInput.serialNumber && itemInput.serialNumber.trim().toUpperCase() !== 'N/A') {
        dbItem = await Item.findOne({ serialNumber: itemInput.serialNumber.trim() });
      }

      const generatedNum = itemInput.itemNumber || `ITM-${String(totalItemCount + idx + 1).padStart(4, '0')}`;
      const equipmentDesc = itemInput.equipment || itemInput.itemDescription || 'General Equipment';
      const brandVal = itemInput.brand || itemInput.brandModel || 'Standard';
      const serialVal = itemInput.serialNumber || `SN-${Date.now().toString().slice(-6)}-${idx + 1}`;
      const conditionVal = itemInput.conditionAtIssuance || 'Good';
      const remarksVal = itemInput.remark || itemInput.remarks || '';

      const itemDateIssued = itemInput.dateIssued
        ? new Date(itemInput.dateIssued)
        : (issuance?.dateOfRelease ? new Date(issuance.dateOfRelease) : new Date());
      const derivedType = itemInput.equipmentType || deriveEquipmentType(equipmentDesc, itemInput.category);
      const setTagVal =
        itemInput.setTag ||
        (remarksVal.includes('Desktop Set') ? 'Desktop Set' : remarksVal.includes('CCTV Set') ? 'CCTV Set' : null);

      if (!dbItem) {
        // Create new item in inventory
        dbItem = new Item({
          itemNumber: generatedNum,
          assetTag: generatedNum,
          itemDescription: equipmentDesc,
          brandModel: brandVal,
          serialNumber: serialVal,
          category: itemInput.category || 'Office Equipment',
          equipmentType: derivedType,
          setTag: setTagVal,
          brand: resolvedBrand,
          legalOwner: legalOwner,
          currentCondition: conditionVal,
          status: 'Assigned',
          remarks: remarksVal,
        });
        await dbItem.save();

        await ItemHistory.create({
          item: dbItem._id,
          action: 'REGISTERED',
          condition: conditionVal,
          remarks: `New item registered during issuance form creation.`,
          performedBy: issuance?.releasedBy || 'IT / Asset Custodian',
        });
      } else {
        // Existing item
        if (dbItem.status === 'Assigned') {
          return res.status(400).json({
            message: `Item "${dbItem.itemDescription}" (${dbItem.serialNumber}) is already assigned to another employee.`,
          });
        }
      }

      resolvedDbItems.push(dbItem);

      formItems.push({
        item: dbItem._id,
        itemNumber: generatedNum,
        assetTag: dbItem.assetTag || generatedNum,
        itemDescription: equipmentDesc,
        brandModel: brandVal,
        serialNumber: serialVal,
        setTag: setTagVal,
        dateIssued: itemDateIssued,
        conditionAtIssuance: conditionVal,
        remarks: remarksVal,
        status: 'Active',
      });
    }

    // 4. Same Release Date Rule: Items issued to the same recipient on the same date MUST be in the same printable form!
    const releaseDate = issuance?.dateOfRelease
      ? new Date(issuance.dateOfRelease)
      : issuance?.date
      ? new Date(issuance.date)
      : new Date();

    const startOfDay = new Date(releaseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(releaseDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingFilter = {
      status: { $in: ['Active', 'Partially Returned'] },
      $or: [
        { 'issuance.date': { $gte: startOfDay, $lte: endOfDay } },
        { issuanceDate: { $gte: startOfDay, $lte: endOfDay } },
      ],
    };

    if (accountabilityType === 'Individual' && employee?._id) {
      existingFilter.accountabilityType = 'Individual';
      existingFilter.employee = employee._id;
    } else if (accountabilityType === 'Store' && storeName) {
      existingFilter.accountabilityType = 'Store';
      existingFilter.storeName = storeName.trim();
    } else if (accountabilityType === 'Department' && (employeeInfo?.department || employee?.department)) {
      existingFilter.accountabilityType = 'Department';
      existingFilter['employeeInfo.department'] = (employeeInfo?.department || employee?.department).trim();
    } else {
      existingFilter._id = null; // No match
    }

    let existingRecord = await AccountabilityRecord.findOne(existingFilter);
    let savedRecord = null;

    if (existingRecord) {
      // Append items to existing form so all equipment released on this date is in the same printable form
      existingRecord.items.push(...formItems);
      if (issuance?.releasedBy && (!existingRecord.issuance.releasedBy || existingRecord.issuance.releasedBy === 'IT / Asset Custodian')) {
        existingRecord.issuance.releasedBy = issuance.releasedBy;
      }
      savedRecord = await existingRecord.save();
    } else {
      // Generate Form Number & create new record
      const formNumber = await generateFormNumber();

      const record = new AccountabilityRecord({
        formNumber,
        accountabilityType,
        storeName: storeName || '',
        brand: resolvedBrand,
        company: employeeCompany,
        propertyOwnerCompany: legalOwner,
        targetGroup,
        employee: employee._id,
        employeeInfo: {
          name: employee.name,
          employeeId: employee.employeeId,
          jobTitle: employee.jobTitle,
          department: employee.department,
          company: employeeCompany,
          brand: resolvedBrand,
        },
        items: formItems,
        status: 'Active',
        companyResponsibilitiesText: `By signing this form, I acknowledge and agree that:
1. The equipment listed above remains the property of ${legalOwner}.
2. I am responsible for safeguarding this equipment from loss, theft, or damage.
3. I will use the equipment in accordance with company policies, including IT security and acceptable use policies.
4. I will not install unauthorized software or allow unauthorized users access.
5. I will immediately report loss, theft, or malfunction to IT or my supervisor.
6. Upon knowledge of termination of employment, at least a week before the date of resignation or upon knowledge of request by company, I will return all equipment in good working condition (normal wear and tear excepted).
7. Failure to return company property may result in payroll deductions (where legally permitted) and/or legal action.`,
        issuance: {
          date: releaseDate,
          releasedBy: issuance?.releasedBy || 'IT / Asset Custodian',
          approvedBy: issuance?.approvedBy || 'Department Head',
          employeeSignatureName: issuance?.employeeSignatureName || employee.name,
          employeeSignatureImage: issuance?.employeeSignatureImage || '',
          employeeSignatureDate: releaseDate,
          conditionAcknowledgment: {
            receivedInGoodCondition: issuance?.conditionAcknowledgment?.receivedInGoodCondition !== false,
            notedIssues: issuance?.conditionAcknowledgment?.notedIssues || '',
          },
        },
      });

      savedRecord = await record.save();
    }

    // 5. Update inventory status and assignment for each item
    for (let i = 0; i < formItems.length; i++) {
      const formItem = formItems[i];
      const dbItem = resolvedDbItems[i];
      const itemReleaseDate = formItem.dateIssued || releaseDate;

      await Item.findByIdAndUpdate(dbItem._id, {
        brand: dbItem.brand || resolvedBrand,
        legalOwner: dbItem.legalOwner || legalOwner,
        setTag: formItem.setTag || dbItem.setTag || null,
        status: 'Assigned',
        currentCondition: formItem.conditionAtIssuance,
        currentAssignment: {
          accountabilityId: savedRecord._id,
          accountabilityType,
          storeName: storeName || '',
          targetGroup,
          employee: employee._id,
          employeeName: employee.name,
          employeeId: employee.employeeId,
          brand: resolvedBrand,
          company: employeeCompany,
          department: employee.department,
          dateIssued: itemReleaseDate,
          conditionAtIssuance: formItem.conditionAtIssuance,
          setTag: formItem.setTag || null,
        },
      });

      // 6. Log history
      await ItemHistory.create({
        item: dbItem._id,
        action: 'ASSIGNED',
        accountabilityType,
        storeName: storeName || '',
        targetGroup,
        employee: employee._id,
        employeeName: employee.name,
        employeeId: employee.employeeId,
        department: employee.department,
        formNumber: savedRecord.formNumber,
        accountabilityId: savedRecord._id,
        date: itemReleaseDate,
        condition: formItem.conditionAtIssuance,
        remarks: `${accountabilityType === 'Store' ? `Issued to Store [${storeName}]` : accountabilityType === 'Department' ? `Issued to Dept [${employee.department}]` : accountabilityType === 'Office' ? `Issued to [${targetGroup}]` : 'Issued to ' + employee.name} (Custodian: ${employee.name} - ${employee.employeeId}). Remarks: ${formItem.remarks || 'None'}`,
        performedBy: issuance?.releasedBy || 'IT / Asset Custodian',
      });
    }

    res.status(201).json(savedRecord);
  } catch (err) {
    console.error('Error issuing accountability form:', err);
    res.status(500).json({ message: 'Failed to issue accountability form', error: err.message });
  }
});

// POST /api/accountabilities/:id/return-item/:itemId - Return a single item from the form
router.post('/:id/return-item/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const {
      returnDate,
      conditionUponReturn,
      completeness,
      incompleteNotes,
      chargesAssessment,
      chargesAmount,
      notes,
      approvedBy,
      inspectedBy,
      employeeSignature,
      makeAvailable,
    } = req.body;

    const record = await AccountabilityRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Accountability record not found' });
    }

    const formItem = record.items.find(
      (i) => i.item.toString() === itemId.toString() || i._id.toString() === itemId.toString()
    );

    if (!formItem) {
      return res.status(404).json({ message: 'Item not found in this accountability record' });
    }

    if (formItem.status === 'Returned') {
      return res.status(400).json({ message: 'This item has already been marked as returned' });
    }

    const actualReturnDate = returnDate ? new Date(returnDate) : new Date();
    const cond = conditionUponReturn || 'Good';

    // If makeAvailable is explicitly passed, honor it; otherwise true for Excellent, Good, Fair
    const shouldBeAvailable =
      makeAvailable !== undefined
        ? Boolean(makeAvailable)
        : cond === 'Excellent' || cond === 'Good' || cond === 'Fair';

    // Update item in the record
    formItem.status = 'Returned';
    formItem.returnDetails = {
      returnDate: actualReturnDate,
      conditionUponReturn: cond,
      makeAvailable: shouldBeAvailable,
      completeness: completeness || 'Complete',
      incompleteNotes: incompleteNotes || '',
      chargesAssessment: chargesAssessment || 'No charges',
      chargesAmount: chargesAssessment === 'Charges Applicable' ? Number(chargesAmount) || 0 : 0,
      notes: notes || '',
      approvedBy: approvedBy || 'Authorized Approver',
      inspectedBy: inspectedBy || 'IT Inspector',
      employeeSignature: employeeSignature || record.employeeInfo.name,
    };

    // Check if all items in the form are returned
    const allReturned = record.items.every((i) => i.status === 'Returned');
    record.status = allReturned ? 'Returned' : 'Partially Returned';

    // If all returned, update overall returnSummary
    if (allReturned) {
      record.returnSummary = formItem.returnDetails;
    }

    await record.save();

    // Update Item in Inventory
    const itemInDb = await Item.findById(formItem.item);
    if (itemInDb) {
      itemInDb.status = shouldBeAvailable ? 'Available' : 'Under Maintenance';
      itemInDb.currentCondition = cond;
      itemInDb.currentAssignment = null;
      if (notes) {
        itemInDb.remarks = itemInDb.remarks
          ? `${itemInDb.remarks}\n[Return ${actualReturnDate.toLocaleDateString()}]: ${notes}`
          : `[Return ${actualReturnDate.toLocaleDateString()}]: ${notes}`;
      }
      await itemInDb.save();

      // Log into ItemHistory
      await ItemHistory.create({
        item: itemInDb._id,
        action: 'RETURNED',
        employee: record.employee,
        employeeName: record.employeeInfo.name,
        employeeId: record.employeeInfo.employeeId,
        department: record.employeeInfo.department,
        formNumber: record.formNumber,
        accountabilityId: record._id,
        date: actualReturnDate,
        condition: cond,
        completeness: completeness || 'Complete',
        chargesAssessment: chargesAssessment || 'No charges',
        chargesAmount: chargesAssessment === 'Charges Applicable' ? Number(chargesAmount) || 0 : 0,
        remarks: `Returned by ${record.employeeInfo.name}. Condition: ${cond}. Inventory Status: ${shouldBeAvailable ? 'Available (Ready for issuance)' : 'Under Maintenance'}. Notes: ${notes || 'None'}. Charges: ${chargesAssessment === 'Charges Applicable' ? '₱' + chargesAmount : 'None'}`,
        performedBy: inspectedBy || 'IT Inspector',
      });
    }

    res.json({ message: 'Item returned successfully', record });
  } catch (err) {
    console.error('Error processing item return:', err);
    res.status(500).json({ message: 'Failed to process item return', error: err.message });
  }
});

// POST /api/accountabilities/:id/return-items - Return multiple items by component IDs or by set
router.post('/:id/return-items', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemIds = [], // Array of item ObjectIds or formItem _ids
      setTag, // Optional: return all items belonging to this setTag (e.g. 'Desktop Set', 'CCTV Set')
      returnDate,
      conditionUponReturn,
      completeness,
      incompleteNotes,
      chargesAssessment,
      chargesAmount,
      notes,
      approvedBy,
      inspectedBy,
      employeeSignature,
      makeAvailable,
    } = req.body;

    const record = await AccountabilityRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Accountability record not found' });
    }

    const actualReturnDate = returnDate ? new Date(returnDate) : new Date();
    const cond = conditionUponReturn || 'Good';
    const shouldBeAvailable =
      makeAvailable !== undefined
        ? Boolean(makeAvailable)
        : cond === 'Excellent' || cond === 'Good' || cond === 'Fair';

    // Target items to return
    let targetItems = [];
    if (setTag) {
      targetItems = record.items.filter(
        (i) => i.status === 'Active' && (i.setTag === setTag || (i.remarks && i.remarks.includes(setTag)))
      );
    } else if (itemIds && itemIds.length > 0) {
      const idsSet = new Set(itemIds.map((x) => x.toString()));
      targetItems = record.items.filter(
        (i) =>
          i.status === 'Active' &&
          (idsSet.has(i._id.toString()) || (i.item && idsSet.has(i.item.toString())))
      );
    } else {
      targetItems = record.items.filter((i) => i.status === 'Active');
    }

    if (targetItems.length === 0) {
      return res.status(400).json({ message: 'No active items found matching the return selection.' });
    }

    const returnDetailsObj = {
      returnDate: actualReturnDate,
      conditionUponReturn: cond,
      makeAvailable: shouldBeAvailable,
      completeness: completeness || 'Complete',
      incompleteNotes: incompleteNotes || '',
      chargesAssessment: chargesAssessment || 'No charges',
      chargesAmount: chargesAssessment === 'Charges Applicable' ? Number(chargesAmount) || 0 : 0,
      notes: notes || '',
      approvedBy: approvedBy || 'Authorized Approver',
      inspectedBy: inspectedBy || 'IT Inspector',
      employeeSignature: employeeSignature || record.employeeInfo.name,
    };

    for (const formItem of targetItems) {
      formItem.status = 'Returned';
      formItem.returnDetails = { ...returnDetailsObj };

      const itemInDb = await Item.findById(formItem.item);
      if (itemInDb) {
        itemInDb.status = shouldBeAvailable ? 'Available' : 'Under Maintenance';
        itemInDb.currentCondition = cond;
        itemInDb.currentAssignment = null;
        if (notes) {
          itemInDb.remarks = itemInDb.remarks
            ? `${itemInDb.remarks}\n[Return ${actualReturnDate.toLocaleDateString()}]: ${notes}`
            : `[Return ${actualReturnDate.toLocaleDateString()}]: ${notes}`;
        }
        await itemInDb.save();

        await ItemHistory.create({
          item: itemInDb._id,
          action: 'RETURNED',
          employee: record.employee,
          employeeName: record.employeeInfo.name,
          employeeId: record.employeeInfo.employeeId,
          department: record.employeeInfo.department,
          formNumber: record.formNumber,
          accountabilityId: record._id,
          date: actualReturnDate,
          condition: cond,
          completeness: completeness || 'Complete',
          chargesAssessment: chargesAssessment || 'No charges',
          chargesAmount: chargesAssessment === 'Charges Applicable' ? Number(chargesAmount) || 0 : 0,
          remarks: `Returned by ${record.employeeInfo.name} (${setTag ? `Set: ${setTag}` : 'Component'}). Condition: ${cond}. Inventory Status: ${shouldBeAvailable ? 'Available (Ready for issuance)' : 'Under Maintenance'}. Notes: ${notes || 'None'}. Charges: ${chargesAssessment === 'Charges Applicable' ? '₱' + chargesAmount : 'None'}`,
          performedBy: inspectedBy || 'IT Inspector',
        });
      }
    }

    const allReturned = record.items.every((i) => i.status === 'Returned');
    record.status = allReturned ? 'Returned' : 'Partially Returned';
    if (allReturned) {
      record.returnSummary = returnDetailsObj;
    }

    await record.save();

    res.json({
      message: `Successfully returned ${targetItems.length} item(s)${setTag ? ` from ${setTag}` : ''}`,
      returnedCount: targetItems.length,
      setTag: setTag || null,
      record,
    });
  } catch (err) {
    console.error('Error returning items:', err);
    res.status(500).json({ message: 'Failed to process return', error: err.message });
  }
});

// POST /api/accountabilities/:id/return-all - Return all remaining items in the form
router.post('/:id/return-all', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      returnDate,
      conditionUponReturn,
      completeness,
      incompleteNotes,
      chargesAssessment,
      chargesAmount,
      notes,
      approvedBy,
      inspectedBy,
      employeeSignature,
      makeAvailable,
    } = req.body;

    const record = await AccountabilityRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'Accountability record not found' });
    }

    const actualReturnDate = returnDate ? new Date(returnDate) : new Date();
    const cond = conditionUponReturn || 'Good';
    const shouldBeAvailable =
      makeAvailable !== undefined
        ? Boolean(makeAvailable)
        : cond === 'Excellent' || cond === 'Good' || cond === 'Fair';

    const returnDetailsObj = {
      returnDate: actualReturnDate,
      conditionUponReturn: cond,
      makeAvailable: shouldBeAvailable,
      completeness: completeness || 'Complete',
      incompleteNotes: incompleteNotes || '',
      chargesAssessment: chargesAssessment || 'No charges',
      chargesAmount: chargesAssessment === 'Charges Applicable' ? Number(chargesAmount) || 0 : 0,
      notes: notes || '',
      approvedBy: approvedBy || 'Authorized Approver',
      inspectedBy: inspectedBy || 'IT Inspector',
      employeeSignature: employeeSignature || record.employeeInfo.name,
    };

    record.returnSummary = returnDetailsObj;
    record.status = 'Returned';

    for (const formItem of record.items) {
      if (formItem.status !== 'Returned') {
        formItem.status = 'Returned';
        formItem.returnDetails = returnDetailsObj;

        const itemInDb = await Item.findById(formItem.item);
        if (itemInDb) {
          itemInDb.status = shouldBeAvailable ? 'Available' : 'Under Maintenance';
          itemInDb.currentCondition = cond;
          itemInDb.currentAssignment = null;
          await itemInDb.save();

          await ItemHistory.create({
            item: itemInDb._id,
            action: 'RETURNED',
            employee: record.employee,
            employeeName: record.employeeInfo.name,
            employeeId: record.employeeInfo.employeeId,
            department: record.employeeInfo.department,
            formNumber: record.formNumber,
            accountabilityId: record._id,
            date: actualReturnDate,
            condition: cond,
            completeness: completeness || 'Complete',
            chargesAssessment: chargesAssessment || 'No charges',
            chargesAmount: chargesAssessment === 'Charges Applicable' ? Number(chargesAmount) || 0 : 0,
            remarks: `Returned by ${record.employeeInfo.name}. Condition: ${cond}. Inventory Status: ${shouldBeAvailable ? 'Available (Ready for issuance)' : 'Under Maintenance'}. Notes: ${notes || 'None'}`,
            performedBy: inspectedBy || 'IT Inspector',
          });
        }
      }
    }

    await record.save();
    res.json({ message: 'All items marked as returned successfully', record });
  } catch (err) {
    console.error('Error processing bulk return:', err);
    res.status(500).json({ message: 'Failed to return items', error: err.message });
  }
});

module.exports = router;

