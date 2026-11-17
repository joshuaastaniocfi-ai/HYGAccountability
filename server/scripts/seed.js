const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('../models/Employee');
const Item = require('../models/Item');
const AccountabilityRecord = require('../models/AccountabilityRecord');
const ItemHistory = require('../models/ItemHistory');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chawnah_accountability';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding:', mongoUri);

    // Clear existing collections
    await Promise.all([
      Employee.deleteMany({}),
      Item.deleteMany({}),
      AccountabilityRecord.deleteMany({}),
      ItemHistory.deleteMany({}),
    ]);
    console.log('Cleared existing records.');

    // 1. Create Employees
    const employeesData = [
      {
        employeeId: 'CFI-2023-001',
        name: 'Maria Santos',
        jobTitle: 'Food Safety & QA Lead',
        department: 'Quality Assurance',
        email: 'maria.santos@chawnahfoods.com',
        phone: '+63 917 555 1201',
        status: 'Active',
        notes: 'In-charge of ISO 22000 and HACCP audit compliance.',
      },
      {
        employeeId: 'CFI-2023-002',
        name: 'Juan Carlos Reyes',
        jobTitle: 'Logistics & Warehouse Supervisor',
        department: 'Logistics',
        email: 'jc.reyes@chawnahfoods.com',
        phone: '+63 918 555 2402',
        status: 'Active',
        notes: 'Manages dry & cold storage facility inventory.',
      },
      {
        employeeId: 'CFI-2024-003',
        name: 'Alyssa Mae Dela Cruz',
        jobTitle: 'Senior Brand & Key Accounts Manager',
        department: 'Sales & Marketing',
        email: 'alyssa.delacruz@chawnahfoods.com',
        phone: '+63 919 555 3503',
        status: 'Active',
        notes: 'Frequent travel for client tasting showcases and supermarkets.',
      },
      {
        employeeId: 'CFI-2022-004',
        name: 'Roberto "Bobby" Tan',
        jobTitle: 'Production Shift Manager',
        department: 'Operations',
        email: 'roberto.tan@chawnahfoods.com',
        phone: '+63 920 555 4604',
        status: 'Active',
        notes: 'Line 1 & 2 packaging operations supervisor.',
      },
      {
        employeeId: 'CFI-2024-005',
        name: 'Kevin Paul Lim',
        jobTitle: 'IT Systems & Network Admin',
        department: 'IT & Systems',
        email: 'kevin.lim@chawnahfoods.com',
        phone: '+63 921 555 5705',
        status: 'Active',
        notes: 'IT equipment inspection officer and asset controller.',
      },
      {
        employeeId: 'CFI-2023-006',
        name: 'Christine Joy Bautista',
        jobTitle: 'HR & Payroll Specialist',
        department: 'Human Resources',
        email: 'christine.bautista@chawnahfoods.com',
        phone: '+63 922 555 6806',
        status: 'Active',
        notes: 'Employee on-boarding and off-boarding coordinator.',
      },
      {
        employeeId: 'CFI-2024-007',
        name: 'Patricia Gomez',
        jobTitle: 'R&D Senior Food Technologist',
        department: 'Research & Development',
        email: 'patricia.gomez@chawnahfoods.com',
        phone: '+63 923 555 7907',
        status: 'Active',
        notes: 'Product formulation, shelf-life testing, and sensory trials.',
      },
    ];

    const employees = await Employee.insertMany(employeesData);
    console.log(`Inserted ${employees.length} employees.`);

    // 2. Create Items
    const itemsData = [
      {
        assetTag: 'CFI-LAP-001',
        itemDescription: 'Dell Latitude 5420 14" (Core i7, 16GB RAM, 512GB SSD)',
        brandModel: 'Dell Latitude 5420',
        serialNumber: 'DL-5420-SN89123',
        category: 'Laptops & Desktops',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'Comes with 65W Dell Type-C power brick and laptop sleeve.',
      },
      {
        assetTag: 'CFI-LAP-002',
        itemDescription: 'Lenovo ThinkPad T14 Gen 3 (Core i5, 16GB, 512GB)',
        brandModel: 'Lenovo ThinkPad T14',
        serialNumber: 'LNV-TP14-772183',
        category: 'Laptops & Desktops',
        currentCondition: 'New',
        status: 'Available',
        remarks: 'New procurement for Q1 expansion.',
      },
      {
        assetTag: 'CFI-LAP-003',
        itemDescription: 'Apple MacBook Air M2 13" (16GB RAM, 256GB SSD, Space Gray)',
        brandModel: 'Apple MacBook Air M2',
        serialNumber: 'C02G9941M2QD',
        category: 'Laptops & Desktops',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'Issued with 30W USB-C adapter and braided MagSafe cable.',
      },
      {
        assetTag: 'CFI-TAB-001',
        itemDescription: 'Samsung Galaxy Tab Active3 Rugged Tablet (Waterproof, S-Pen)',
        brandModel: 'Samsung Galaxy Tab Active3',
        serialNumber: 'SM-T575-R482910',
        category: 'Mobile & Tablets',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'Heavy duty protective bumper casing included for plant floor use.',
      },
      {
        assetTag: 'CFI-SCN-001',
        itemDescription: 'Zebra TC26 Android Touch Mobile Computer / Barcode Scanner',
        brandModel: 'Zebra TC26',
        serialNumber: 'ZBR-TC26-904128',
        category: 'Warehouse & Barcode Scanners',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'Hand strap and pistol grip trigger included.',
      },
      {
        assetTag: 'CFI-SCN-002',
        itemDescription: 'Honeywell Voyager 1250g Single-Line Handheld Laser Scanner',
        brandModel: 'Honeywell Voyager 1250g',
        serialNumber: 'HW-V1250-338291',
        category: 'Warehouse & Barcode Scanners',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'USB connection cable and flex neck stand.',
      },
      {
        assetTag: 'CFI-QA-001',
        itemDescription: 'Atago PAL-1 Pocket Digital Refractometer (Brix 0.0 - 53.0%)',
        brandModel: 'Atago PAL-1',
        serialNumber: 'ATG-PAL1-449102',
        category: 'Laboratory & QA Equipment',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'Used for sugar & dissolved solids testing in food formulation batches.',
      },
      {
        assetTag: 'CFI-QA-002',
        itemDescription: 'Testo 104 Waterproof Folding Food Core Thermometer',
        brandModel: 'Testo 104',
        serialNumber: 'TST-104-582910',
        category: 'Laboratory & QA Equipment',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'HACCP calibrated. Probe sanitized before each inspection.',
      },
      {
        assetTag: 'CFI-PRN-001',
        itemDescription: 'Zebra ZD421 Direct Thermal Desktop Barcode & Box Label Printer',
        brandModel: 'Zebra ZD421',
        serialNumber: 'ZBR-ZD421-11849',
        category: 'Printers & Peripherals',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'Installed in Finished Goods warehouse packaging area.',
      },
      {
        assetTag: 'CFI-LAP-004',
        itemDescription: 'HP ProBook 450 G8 (Core i5, 8GB RAM, 256GB SSD)',
        brandModel: 'HP ProBook 450 G8',
        serialNumber: '5CD1298XLP',
        category: 'Laptops & Desktops',
        currentCondition: 'Fair',
        status: 'Available',
        remarks: 'Minor cosmetic scratches on bottom chassis, screen 100% clean.',
      },
      {
        assetTag: 'CFI-TAB-002',
        itemDescription: 'Apple iPad 10th Gen 64GB Wi-Fi (Silver)',
        brandModel: 'Apple iPad 10th Gen',
        serialNumber: 'H78KQ902P1',
        category: 'Mobile & Tablets',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'Used for trade show presentations and digital product catalogs.',
      },
    ];

    const items = await Item.insertMany(itemsData);
    console.log(`Inserted ${items.length} items.`);

    // 3. Create Sample Accountability Records
    // Record 1: Active Accountability for Maria Santos (Quality Assurance)
    // Assigned: Dell Latitude 5420 (CFI-LAP-001) + Atago Refractometer (CFI-QA-001)
    const maria = employees.find((e) => e.employeeId === 'CFI-2023-001');
    const dellLaptop = items.find((i) => i.assetTag === 'CFI-LAP-001');
    const atago = items.find((i) => i.assetTag === 'CFI-QA-001');

    const form1 = new AccountabilityRecord({
      formNumber: 'CFI-ACT-2025-0014',
      employee: maria._id,
      employeeInfo: {
        name: maria.name,
        employeeId: maria.employeeId,
        jobTitle: maria.jobTitle,
        department: maria.department,
      },
      items: [
        {
          item: dellLaptop._id,
          assetTag: dellLaptop.assetTag,
          itemDescription: dellLaptop.itemDescription,
          brandModel: dellLaptop.brandModel,
          serialNumber: dellLaptop.serialNumber,
          conditionAtIssuance: 'Good',
          remarks: 'Configured with QA batch testing suite & SAP client.',
          status: 'Active',
        },
        {
          item: atago._id,
          assetTag: atago.assetTag,
          itemDescription: atago.itemDescription,
          brandModel: atago.brandModel,
          serialNumber: atago.serialNumber,
          conditionAtIssuance: 'New',
          remarks: 'Calibrated with distilled water standard before handover.',
          status: 'Active',
        },
      ],
      status: 'Active',
      issuance: {
        date: new Date('2025-03-10'),
        releasedBy: 'Kevin Paul Lim (IT Custodian)',
        approvedBy: 'Dr. Evelyn Yap (VP Operations)',
        employeeSignatureName: maria.name,
        employeeSignatureDate: new Date('2025-03-10'),
        conditionAcknowledgment: {
          receivedInGoodCondition: true,
          notedIssues: '',
        },
      },
    });

    const savedForm1 = await form1.save();

    // Update item assignment for Form 1
    await Item.findByIdAndUpdate(dellLaptop._id, {
      status: 'Assigned',
      currentAssignment: {
        accountabilityId: savedForm1._id,
        employee: maria._id,
        employeeName: maria.name,
        employeeId: maria.employeeId,
        department: maria.department,
        dateIssued: savedForm1.issuance.date,
        conditionAtIssuance: 'Good',
      },
    });

    await Item.findByIdAndUpdate(atago._id, {
      status: 'Assigned',
      currentAssignment: {
        accountabilityId: savedForm1._id,
        employee: maria._id,
        employeeName: maria.name,
        employeeId: maria.employeeId,
        department: maria.department,
        dateIssued: savedForm1.issuance.date,
        conditionAtIssuance: 'New',
      },
    });

    // Item history logs
    await ItemHistory.create([
      {
        item: dellLaptop._id,
        action: 'REGISTERED',
        date: new Date('2025-01-15'),
        condition: 'Good',
        remarks: 'New IT procurement entered into inventory.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: dellLaptop._id,
        action: 'ASSIGNED',
        employee: maria._id,
        employeeName: maria.name,
        employeeId: maria.employeeId,
        department: maria.department,
        formNumber: savedForm1.formNumber,
        accountabilityId: savedForm1._id,
        date: new Date('2025-03-10'),
        condition: 'Good',
        remarks: 'Issued for food safety audits and production compliance.',
        performedBy: 'Kevin Paul Lim (IT Custodian)',
      },
      {
        item: atago._id,
        action: 'REGISTERED',
        date: new Date('2025-02-01'),
        condition: 'New',
        remarks: 'Purchased from official Atago scientific distributor.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: atago._id,
        action: 'ASSIGNED',
        employee: maria._id,
        employeeName: maria.name,
        employeeId: maria.employeeId,
        department: maria.department,
        formNumber: savedForm1.formNumber,
        accountabilityId: savedForm1._id,
        date: new Date('2025-03-10'),
        condition: 'New',
        remarks: 'Calibrated unit assigned to QA Lead.',
        performedBy: 'Kevin Paul Lim (IT Custodian)',
      },
    ]);

    // Record 2: Active Accountability for Juan Carlos Reyes (Logistics)
    // Assigned: Zebra TC26 Handheld (CFI-SCN-001) + Testo 104 Thermometer (CFI-QA-002)
    const jc = employees.find((e) => e.employeeId === 'CFI-2023-002');
    const zebraScanner = items.find((i) => i.assetTag === 'CFI-SCN-001');
    const testoThermo = items.find((i) => i.assetTag === 'CFI-QA-002');

    const form2 = new AccountabilityRecord({
      formNumber: 'CFI-ACT-2025-0019',
      employee: jc._id,
      employeeInfo: {
        name: jc.name,
        employeeId: jc.employeeId,
        jobTitle: jc.jobTitle,
        department: jc.department,
      },
      items: [
        {
          item: zebraScanner._id,
          assetTag: zebraScanner.assetTag,
          itemDescription: zebraScanner.itemDescription,
          brandModel: zebraScanner.brandModel,
          serialNumber: zebraScanner.serialNumber,
          conditionAtIssuance: 'Good',
          remarks: 'Loaded with warehouse inventory scanning application v3.2.',
          status: 'Active',
        },
        {
          item: testoThermo._id,
          assetTag: testoThermo.assetTag,
          itemDescription: testoThermo.itemDescription,
          brandModel: testoThermo.brandModel,
          serialNumber: testoThermo.serialNumber,
          conditionAtIssuance: 'Good',
          remarks: 'Used for inbound refrigerated container temp checks.',
          status: 'Active',
        },
      ],
      status: 'Active',
      issuance: {
        date: new Date('2025-04-18'),
        releasedBy: 'Kevin Paul Lim (IT Custodian)',
        approvedBy: 'Ramon De Jesus (Supply Chain Director)',
        employeeSignatureName: jc.name,
        employeeSignatureDate: new Date('2025-04-18'),
        conditionAcknowledgment: {
          receivedInGoodCondition: true,
          notedIssues: '',
        },
      },
    });

    const savedForm2 = await form2.save();

    await Item.findByIdAndUpdate(zebraScanner._id, {
      status: 'Assigned',
      currentAssignment: {
        accountabilityId: savedForm2._id,
        employee: jc._id,
        employeeName: jc.name,
        employeeId: jc.employeeId,
        department: jc.department,
        dateIssued: savedForm2.issuance.date,
        conditionAtIssuance: 'Good',
      },
    });

    await Item.findByIdAndUpdate(testoThermo._id, {
      status: 'Assigned',
      currentAssignment: {
        accountabilityId: savedForm2._id,
        employee: jc._id,
        employeeName: jc.name,
        employeeId: jc.employeeId,
        department: jc.department,
        dateIssued: savedForm2.issuance.date,
        conditionAtIssuance: 'Good',
      },
    });

    await ItemHistory.create([
      {
        item: zebraScanner._id,
        action: 'REGISTERED',
        date: new Date('2025-01-20'),
        condition: 'Good',
        remarks: 'Imported by Chawnah Supply Chain Dept.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: zebraScanner._id,
        action: 'ASSIGNED',
        employee: jc._id,
        employeeName: jc.name,
        employeeId: jc.employeeId,
        department: jc.department,
        formNumber: savedForm2.formNumber,
        accountabilityId: savedForm2._id,
        date: new Date('2025-04-18'),
        condition: 'Good',
        remarks: 'Issued to Logistics Supervisor for cold room barcode logs.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: testoThermo._id,
        action: 'REGISTERED',
        date: new Date('2025-02-15'),
        condition: 'Good',
        remarks: 'Calibrated core thermometer.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: testoThermo._id,
        action: 'ASSIGNED',
        employee: jc._id,
        employeeName: jc.name,
        employeeId: jc.employeeId,
        department: jc.department,
        formNumber: savedForm2.formNumber,
        accountabilityId: savedForm2._id,
        date: new Date('2025-04-18'),
        condition: 'Good',
        remarks: 'Assigned for reefer van temperature inspection upon receipt.',
        performedBy: 'Kevin Paul Lim',
      },
    ]);

    // Record 3: Active Accountability for Alyssa Mae Dela Cruz (Sales & Marketing)
    // Assigned: MacBook Air M2 (CFI-LAP-003)
    const alyssa = employees.find((e) => e.employeeId === 'CFI-2024-003');
    const macbook = items.find((i) => i.assetTag === 'CFI-LAP-003');

    const form3 = new AccountabilityRecord({
      formNumber: 'CFI-ACT-2025-0027',
      employee: alyssa._id,
      employeeInfo: {
        name: alyssa.name,
        employeeId: alyssa.employeeId,
        jobTitle: alyssa.jobTitle,
        department: alyssa.department,
      },
      items: [
        {
          item: macbook._id,
          assetTag: macbook.assetTag,
          itemDescription: macbook.itemDescription,
          brandModel: macbook.brandModel,
          serialNumber: macbook.serialNumber,
          conditionAtIssuance: 'Good',
          remarks: 'Includes protective neoprene case and Apple USB-C multi-adapter.',
          status: 'Active',
        },
      ],
      status: 'Active',
      issuance: {
        date: new Date('2025-06-01'),
        releasedBy: 'Kevin Paul Lim (IT Custodian)',
        approvedBy: 'Stephanie Sy (Head of Commercial)',
        employeeSignatureName: alyssa.name,
        employeeSignatureDate: new Date('2025-06-01'),
        conditionAcknowledgment: {
          receivedInGoodCondition: true,
          notedIssues: '',
        },
      },
    });

    const savedForm3 = await form3.save();

    await Item.findByIdAndUpdate(macbook._id, {
      status: 'Assigned',
      currentAssignment: {
        accountabilityId: savedForm3._id,
        employee: alyssa._id,
        employeeName: alyssa.name,
        employeeId: alyssa.employeeId,
        department: alyssa.department,
        dateIssued: savedForm3.issuance.date,
        conditionAtIssuance: 'Good',
      },
    });

    await ItemHistory.create([
      {
        item: macbook._id,
        action: 'REGISTERED',
        date: new Date('2025-05-10'),
        condition: 'Good',
        remarks: 'Procured for Key Accounts presentations and pitch decks.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: macbook._id,
        action: 'ASSIGNED',
        employee: alyssa._id,
        employeeName: alyssa.name,
        employeeId: alyssa.employeeId,
        department: alyssa.department,
        formNumber: savedForm3.formNumber,
        accountabilityId: savedForm3._id,
        date: new Date('2025-06-01'),
        condition: 'Good',
        remarks: 'Issued to Alyssa Mae Dela Cruz for client presentations.',
        performedBy: 'Kevin Paul Lim',
      },
    ]);

    // Record 4: HISTORICAL (RETURNED) Accountability Record!
    // Shows prior ownership of HP ProBook 450 G8 (CFI-LAP-004) by Maria Santos, returned in Good condition!
    // And Apple iPad 10th Gen (CFI-TAB-002) returned by Alyssa Mae Dela Cruz.
    const hpLaptop = items.find((i) => i.assetTag === 'CFI-LAP-004');
    const ipad = items.find((i) => i.assetTag === 'CFI-TAB-002');

    const form4 = new AccountabilityRecord({
      formNumber: 'CFI-ACT-2024-0005',
      employee: maria._id,
      employeeInfo: {
        name: maria.name,
        employeeId: maria.employeeId,
        jobTitle: maria.jobTitle,
        department: maria.department,
      },
      items: [
        {
          item: hpLaptop._id,
          assetTag: hpLaptop.assetTag,
          itemDescription: hpLaptop.itemDescription,
          brandModel: hpLaptop.brandModel,
          serialNumber: hpLaptop.serialNumber,
          conditionAtIssuance: 'Good',
          remarks: 'Temporary assignment during plant accreditation audit.',
          status: 'Returned',
          returnDetails: {
            returnDate: new Date('2025-02-28'),
            conditionUponReturn: 'Fair',
            completeness: 'Complete',
            incompleteNotes: '',
            chargesAssessment: 'No charges',
            chargesAmount: 0,
            notes: 'Returned in good working order. Minor wear on palmrest. Ready for reassignment.',
            approvedBy: 'Dr. Evelyn Yap',
            inspectedBy: 'Kevin Paul Lim',
            employeeSignature: maria.name,
          },
        },
      ],
      status: 'Returned',
      issuance: {
        date: new Date('2024-08-15'),
        releasedBy: 'Kevin Paul Lim (IT Custodian)',
        approvedBy: 'Dr. Evelyn Yap',
        employeeSignatureName: maria.name,
        employeeSignatureDate: new Date('2024-08-15'),
        conditionAcknowledgment: {
          receivedInGoodCondition: true,
          notedIssues: '',
        },
      },
      returnSummary: {
        returnDate: new Date('2025-02-28'),
        conditionUponReturn: 'Fair',
        completeness: 'Complete',
        incompleteNotes: '',
        chargesAssessment: 'No charges',
        chargesAmount: 0,
        notes: 'Equipment checked and data wiped per company privacy policy.',
        approvedBy: 'Dr. Evelyn Yap',
        inspectedBy: 'Kevin Paul Lim',
        employeeSignature: maria.name,
      },
    });

    const savedForm4 = await form4.save();

    await ItemHistory.create([
      {
        item: hpLaptop._id,
        action: 'REGISTERED',
        date: new Date('2024-08-01'),
        condition: 'Good',
        remarks: 'Company standard laptop registered.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: hpLaptop._id,
        action: 'ASSIGNED',
        employee: maria._id,
        employeeName: maria.name,
        employeeId: maria.employeeId,
        department: maria.department,
        formNumber: savedForm4.formNumber,
        accountabilityId: savedForm4._id,
        date: new Date('2024-08-15'),
        condition: 'Good',
        remarks: 'Issued for HACCP audit documentation.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: hpLaptop._id,
        action: 'RETURNED',
        employee: maria._id,
        employeeName: maria.name,
        employeeId: maria.employeeId,
        department: maria.department,
        formNumber: savedForm4.formNumber,
        accountabilityId: savedForm4._id,
        date: new Date('2025-02-28'),
        condition: 'Fair',
        completeness: 'Complete',
        chargesAssessment: 'No charges',
        chargesAmount: 0,
        remarks: 'Returned upon upgrade to Dell Latitude 5420. Checked by IT.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: hpLaptop._id,
        action: 'NOTE_ADDED',
        date: new Date('2025-03-01'),
        remarks: 'Operating system refreshed and internal fan cleaned.',
        performedBy: 'Kevin Paul Lim',
      },
    ]);

    // Record 5: Past record for Alyssa (iPad returned)
    const form5 = new AccountabilityRecord({
      formNumber: 'CFI-ACT-2024-0012',
      employee: alyssa._id,
      employeeInfo: {
        name: alyssa.name,
        employeeId: alyssa.employeeId,
        jobTitle: alyssa.jobTitle,
        department: alyssa.department,
      },
      items: [
        {
          item: ipad._id,
          assetTag: ipad.assetTag,
          itemDescription: ipad.itemDescription,
          brandModel: ipad.brandModel,
          serialNumber: ipad.serialNumber,
          conditionAtIssuance: 'New',
          remarks: 'Issued for Manila Food Expo 2024 trade booth.',
          status: 'Returned',
          returnDetails: {
            returnDate: new Date('2024-11-20'),
            conditionUponReturn: 'Good',
            completeness: 'Complete',
            incompleteNotes: '',
            chargesAssessment: 'No charges',
            chargesAmount: 0,
            notes: 'Returned in pristine condition after expo completion.',
            approvedBy: 'Stephanie Sy',
            inspectedBy: 'Kevin Paul Lim',
            employeeSignature: alyssa.name,
          },
        },
      ],
      status: 'Returned',
      issuance: {
        date: new Date('2024-10-01'),
        releasedBy: 'Kevin Paul Lim',
        approvedBy: 'Stephanie Sy',
        employeeSignatureName: alyssa.name,
        employeeSignatureDate: new Date('2024-10-01'),
        conditionAcknowledgment: {
          receivedInGoodCondition: true,
          notedIssues: '',
        },
      },
      returnSummary: {
        returnDate: new Date('2024-11-20'),
        conditionUponReturn: 'Good',
        completeness: 'Complete',
        incompleteNotes: '',
        chargesAssessment: 'No charges',
        chargesAmount: 0,
        notes: 'Pristine condition, returned on schedule.',
        approvedBy: 'Stephanie Sy',
        inspectedBy: 'Kevin Paul Lim',
        employeeSignature: alyssa.name,
      },
    });

    const savedForm5 = await form5.save();

    await ItemHistory.create([
      {
        item: ipad._id,
        action: 'REGISTERED',
        date: new Date('2024-09-20'),
        condition: 'New',
        remarks: 'Trade show asset registered.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: ipad._id,
        action: 'ASSIGNED',
        employee: alyssa._id,
        employeeName: alyssa.name,
        employeeId: alyssa.employeeId,
        department: alyssa.department,
        formNumber: savedForm5.formNumber,
        accountabilityId: savedForm5._id,
        date: new Date('2024-10-01'),
        condition: 'New',
        remarks: 'Issued for food exhibition.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: ipad._id,
        action: 'RETURNED',
        employee: alyssa._id,
        employeeName: alyssa.name,
        employeeId: alyssa.employeeId,
        department: alyssa.department,
        formNumber: savedForm5.formNumber,
        accountabilityId: savedForm5._id,
        date: new Date('2024-11-20'),
        condition: 'Good',
        completeness: 'Complete',
        chargesAssessment: 'No charges',
        chargesAmount: 0,
        remarks: 'Returned in pristine condition after expo completion.',
        performedBy: 'Kevin Paul Lim',
      },
    ]);

    // Record 6: STORE EQUIPMENT ACCOUNTABILITY (Group Accountability: ROBINSON MARASBARAS)
    const honeywellScanner = items.find((i) => i.assetTag === 'CFI-SCN-002');
    const zebraPrinter = items.find((i) => i.assetTag === 'CFI-PRN-001');

    const formStore1 = new AccountabilityRecord({
      formNumber: 'CFI-ACT-2025-0035',
      accountabilityType: 'Store',
      storeName: 'ROBINSON MARASBARAS',
      targetGroup: 'Store: ROBINSON MARASBARAS',
      employee: jc._id,
      employeeInfo: {
        name: 'Danilo Garcia (Store Supervisor)',
        employeeId: 'CFI-STR-04',
        jobTitle: 'Store Branch Supervisor / OIC',
        department: 'Store Operations / Retail',
      },
      items: [
        {
          item: honeywellScanner._id,
          itemNumber: 'ITM-0006',
          assetTag: honeywellScanner.assetTag,
          itemDescription: honeywellScanner.itemDescription,
          brandModel: honeywellScanner.brandModel,
          serialNumber: honeywellScanner.serialNumber,
          conditionAtIssuance: 'Good',
          remarks: 'Counter 1 barcode scanner with USB stand.',
          status: 'Active',
        },
        {
          item: zebraPrinter._id,
          itemNumber: 'ITM-0009',
          assetTag: zebraPrinter.assetTag,
          itemDescription: zebraPrinter.itemDescription,
          brandModel: zebraPrinter.brandModel,
          serialNumber: zebraPrinter.serialNumber,
          conditionAtIssuance: 'Good',
          remarks: 'Price markdown and SKU shelf tag printer.',
          status: 'Active',
        },
      ],
      status: 'Active',
      issuance: {
        date: new Date('2025-07-15'),
        releasedBy: 'Kevin Paul Lim (IT Custodian)',
        approvedBy: 'Ramon De Jesus (Retail Ops Director)',
        employeeSignatureName: 'Danilo Garcia',
        employeeSignatureDate: new Date('2025-07-15'),
        conditionAcknowledgment: {
          receivedInGoodCondition: true,
          notedIssues: '',
        },
      },
    });

    const savedStoreForm1 = await formStore1.save();

    await Item.findByIdAndUpdate(honeywellScanner._id, {
      status: 'Assigned',
      currentAssignment: {
        accountabilityId: savedStoreForm1._id,
        accountabilityType: 'Store',
        storeName: 'ROBINSON MARASBARAS',
        targetGroup: 'Store: ROBINSON MARASBARAS',
        employee: jc._id,
        employeeName: 'ROBINSON MARASBARAS Team (OIC: Danilo Garcia)',
        employeeId: 'CFI-STR-04',
        department: 'Store Operations / Retail',
        dateIssued: savedStoreForm1.issuance.date,
        conditionAtIssuance: 'Good',
      },
    });

    await Item.findByIdAndUpdate(zebraPrinter._id, {
      status: 'Assigned',
      currentAssignment: {
        accountabilityId: savedStoreForm1._id,
        accountabilityType: 'Store',
        storeName: 'ROBINSON MARASBARAS',
        targetGroup: 'Store: ROBINSON MARASBARAS',
        employee: jc._id,
        employeeName: 'ROBINSON MARASBARAS Team (OIC: Danilo Garcia)',
        employeeId: 'CFI-STR-04',
        department: 'Store Operations / Retail',
        dateIssued: savedStoreForm1.issuance.date,
        conditionAtIssuance: 'Good',
      },
    });

    await ItemHistory.create([
      {
        item: honeywellScanner._id,
        action: 'ASSIGNED',
        accountabilityType: 'Store',
        storeName: 'ROBINSON MARASBARAS',
        targetGroup: 'Store: ROBINSON MARASBARAS',
        formNumber: savedStoreForm1.formNumber,
        accountabilityId: savedStoreForm1._id,
        date: new Date('2025-07-15'),
        condition: 'Good',
        remarks: 'Issued to ROBINSON MARASBARAS branch under store group accountability.',
        performedBy: 'Kevin Paul Lim',
      },
      {
        item: zebraPrinter._id,
        action: 'ASSIGNED',
        accountabilityType: 'Store',
        storeName: 'ROBINSON MARASBARAS',
        targetGroup: 'Store: ROBINSON MARASBARAS',
        formNumber: savedStoreForm1.formNumber,
        accountabilityId: savedStoreForm1._id,
        date: new Date('2025-07-15'),
        condition: 'Good',
        remarks: 'Deployed to ROBINSON MARASBARAS for shelf tagging.',
        performedBy: 'Kevin Paul Lim',
      },
    ]);

    // Also register remaining items in ItemHistory
    const otherItems = items.filter(
      (it) => ![dellLaptop._id, atago._id, zebraScanner._id, testoThermo._id, macbook._id, hpLaptop._id, ipad._id, honeywellScanner._id, zebraPrinter._id].some((id) => id.toString() === it._id.toString())
    );

    for (const other of otherItems) {
      await ItemHistory.create({
        item: other._id,
        action: 'REGISTERED',
        date: new Date('2025-01-10'),
        condition: other.currentCondition,
        remarks: `Initial asset entry for ${other.itemDescription}`,
        performedBy: 'System Administrator',
      });
    }

    console.log('Seeding completed successfully!');
    if (require.main === module) {
      process.exit(0);
    }
    return { success: true, message: 'Database seeded successfully' };
  } catch (err) {
    console.error('Seeding error:', err);
    if (require.main === module) {
      process.exit(1);
    }
    throw err;
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

