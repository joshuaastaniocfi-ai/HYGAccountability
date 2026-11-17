const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chawnah_accountability');
    const Item = require('../models/Item');
    const Employee = require('../models/Employee');

    function inferType(desc, brand) {
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

    // 1. Update all existing items with equipmentType
    const all = await Item.find({});
    for (const it of all) {
      it.equipmentType = inferType(it.itemDescription, it.brandModel);
      await it.save();
    }
    console.log('Updated equipmentType on', all.length, 'existing items');

    // 2. Check UPS units
    const upsCount = await Item.countDocuments({ equipmentType: 'UPS' });
    if (upsCount === 0) {
      const count = await Item.countDocuments();
      const ups1 = new Item({
        itemNumber: 'ITM-' + String(count + 1).padStart(4, '0'),
        assetTag: 'TAG-UPS-001',
        itemDescription: 'APC Back-UPS Pro 650VA Line-Interactive UPS',
        brandModel: 'APC by Schneider Electric BV650I-MS',
        serialNumber: 'SN-APC-BV650-8812',
        category: 'Office Equipment',
        equipmentType: 'UPS',
        currentCondition: 'Good',
        status: 'Assigned',
        currentAssignment: {
          accountabilityType: 'Store',
          storeName: 'Store 01 - Main Bakery & Cafe',
          targetGroup: 'POS & Server Rack',
          dateIssued: new Date('2025-08-10'),
          conditionAtIssuance: 'Good',
        },
        installedComponents: [
          {
            componentType: 'Battery',
            itemDescription: 'Factory 12V 7.2Ah Lead-Acid Battery',
            serialNumber: 'BAT-OEM-7719',
            installedDate: new Date('2025-08-10'),
            installedBy: 'IT Department',
            notes: 'Original OEM Battery installed at commissioning',
          },
        ],
        remarks: 'Primary power backup for Store 01 POS cash registers',
        unitCost: 4500,
      });
      await ups1.save();

      const ups2 = new Item({
        itemNumber: 'ITM-' + String(count + 2).padStart(4, '0'),
        assetTag: 'TAG-UPS-002',
        itemDescription: 'APC Easy UPS BV 650VA 230V AVR Universal Sockets',
        brandModel: 'APC Easy UPS BV650I',
        serialNumber: 'SN-APC-BV650-9934',
        category: 'Office Equipment',
        equipmentType: 'UPS',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'In stock at IT Headquarters inventory rack ready for branch deployment',
        unitCost: 4200,
      });
      await ups2.save();
      console.log('✅ Seeded 2 UPS units');
    }

    // 3. Check Mouse units
    const mouseCount = await Item.countDocuments({ equipmentType: 'Mouse' });
    if (mouseCount === 0) {
      const count = await Item.countDocuments();
      const emp = await Employee.findOne();
      const mouse1 = new Item({
        itemNumber: 'ITM-' + String(count + 1).padStart(4, '0'),
        assetTag: 'TAG-MOU-001',
        itemDescription: 'Logitech M185 Compact Wireless Optical Mouse (Grey)',
        brandModel: 'Logitech M185',
        serialNumber: 'SN-LOGI-M185-1102',
        category: 'Printers & Peripherals',
        equipmentType: 'Mouse',
        currentCondition: 'Good',
        status: 'Assigned',
        currentAssignment: {
          accountabilityType: 'Individual',
          employee: emp ? emp._id : null,
          employeeName: emp ? emp.name : 'Juan Dela Cruz',
          employeeId: emp ? emp.employeeId : 'CFI-2023-0101',
          department: emp ? emp.department : 'Executive Management',
          dateIssued: new Date('2025-06-15'),
          conditionAtIssuance: 'New',
        },
        unitCost: 590,
      });
      await mouse1.save();

      const mouse2 = new Item({
        itemNumber: 'ITM-' + String(count + 2).padStart(4, '0'),
        assetTag: 'TAG-MOU-002',
        itemDescription: 'Logitech B100 USB Optical Wired Mouse (Black)',
        brandModel: 'Logitech B100',
        serialNumber: 'SN-LOGI-B100-3341',
        category: 'Printers & Peripherals',
        equipmentType: 'Mouse',
        currentCondition: 'Good',
        status: 'Available',
        remarks: 'Buffer spare in IT stock room',
        unitCost: 290,
      });
      await mouse2.save();
      console.log('✅ Seeded 2 Mouse items');
    }

    // Print summary
    const items = await Item.find({}).lean();
    const summary = {};
    items.forEach((it) => {
      const type = it.equipmentType || 'Other';
      if (!summary[type]) {
        summary[type] = { total: 0, assigned: 0, available: 0, forRepair: 0, forDisposal: 0 };
      }
      summary[type].total += 1;
      if (it.status === 'Assigned') summary[type].assigned += 1;
      else if (it.status === 'Available') summary[type].available += 1;
      else if (it.status === 'For Repair') summary[type].forRepair += 1;
      else if (it.status === 'For Disposal') summary[type].forDisposal += 1;
    });

    console.log('Inventory by Equipment Type Summary:');
    console.table(summary);
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();

