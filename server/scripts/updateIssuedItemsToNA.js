const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('../models/Item');
const AccountabilityRecord = require('../models/AccountabilityRecord');
const ItemHistory = require('../models/ItemHistory');

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chawnah_accountability';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('\n--- STEP 1: DROPPING UNIQUE INDEX ON serialNumber ---');
    try {
      await Item.collection.dropIndex('serialNumber_1');
      console.log('Successfully dropped serialNumber_1 unique index.');
    } catch (err) {
      if (err.codeName === 'IndexNotFound' || err.message.includes('index not found')) {
        console.log('serialNumber_1 index does not exist or was already dropped.');
      } else {
        console.warn('Warning dropping index:', err.message);
      }
    }

    console.log('\n--- STEP 2: UPDATING ISSUED ITEMS IN INVENTORY (308 UNITS) ---');
    const items = await Item.find({ status: 'Assigned' });
    console.log(`Found ${items.length} currently issued/assigned items.`);

    const getCleanDescription = (item) => {
      const eq = (item.equipmentType || '').toLowerCase();
      const desc = (item.itemDescription || '').toLowerCase();
      const tag = (item.assetTag || '').toUpperCase();

      if (eq === 'monitor' || desc.includes('monitor')) return 'Monitor';
      if (eq === 'mouse' || desc.includes('mouse')) return 'Mouse';
      if (eq === 'keyboard' || desc.includes('keyboard')) return 'Keyboard';
      if (eq === 'desktop' || desc.includes('system unit') || desc.includes('optiplex')) return 'System Unit';
      if (eq === 'ups' || desc.includes('ups') || desc.includes('power supply')) return 'UPS';
      if (tag.endsWith('-06') || desc.includes('hdmi')) return 'HDMI Cable';
      if (tag.endsWith('-07') || desc.includes('lan')) return 'LAN Cable';
      if (eq.includes('cable') || desc.includes('cable')) return 'Cable';
      return item.equipmentType || 'Equipment Unit';
    };

    let updatedItemCount = 0;
    for (const it of items) {
      const genericDesc = getCleanDescription(it);
      it.itemDescription = genericDesc;
      it.brandModel = 'N/A';
      it.serialNumber = 'N/A';
      it.remarks = 'N/A';
      await it.save();
      updatedItemCount++;
    }
    console.log(`Updated ${updatedItemCount} items: brandModel='N/A', serialNumber='N/A', clean generic description, remarks='N/A'.`);

    console.log('\n--- STEP 3: UPDATING 44 STORE ACCOUNTABILITY FORMS ---');
    const storeForms = await AccountabilityRecord.find({ accountabilityType: 'Store' });
    let updatedFormsCount = 0;

    for (const form of storeForms) {
      form.items.forEach((it) => {
        const tag = (it.assetTag || '').toUpperCase();
        const oldDesc = (it.itemDescription || '').toLowerCase();
        let genericDesc = 'Equipment Unit';

        if (tag.endsWith('-01') || oldDesc.includes('monitor')) genericDesc = 'Monitor';
        else if (tag.endsWith('-02') || oldDesc.includes('mouse')) genericDesc = 'Mouse';
        else if (tag.endsWith('-03') || oldDesc.includes('keyboard')) genericDesc = 'Keyboard';
        else if (tag.endsWith('-04') || oldDesc.includes('system unit') || oldDesc.includes('optiplex')) genericDesc = 'System Unit';
        else if (tag.endsWith('-05') || oldDesc.includes('ups')) genericDesc = 'UPS';
        else if (tag.endsWith('-06') || oldDesc.includes('hdmi')) genericDesc = 'HDMI Cable';
        else if (tag.endsWith('-07') || oldDesc.includes('lan')) genericDesc = 'LAN Cable';

        it.itemDescription = genericDesc;
        it.brandModel = 'N/A';
        it.serialNumber = 'N/A';
        it.remarks = 'N/A';
      });

      await form.save();
      updatedFormsCount++;
    }
    console.log(`Updated ${updatedFormsCount} store accountability forms.`);

    console.log('\n--- STEP 4: VERIFICATION ---');
    const sampleItems = await Item.find({ status: 'Assigned' }).limit(7).lean();
    console.log('Sample updated items (first store):');
    sampleItems.forEach(i => {
      console.log(`- [${i.assetTag}] ${i.itemDescription} | Brand/Model: ${i.brandModel} | S/N: ${i.serialNumber} | Remarks: ${i.remarks}`);
    });

    const sampleForm = await AccountabilityRecord.findOne({ formNumber: 'CFI-ACT-2026-S001' }).lean();
    console.log(`\nSample form ${sampleForm.formNumber} items:`);
    sampleForm.items.forEach((it, idx) => {
      console.log(`  ${idx + 1}. [${it.assetTag}] ${it.itemDescription} | Brand: ${it.brandModel} | S/N: ${it.serialNumber} | Remarks: ${it.remarks}`);
    });

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: Updated all currently issued items to N/A!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error updating items to N/A:', err);
    process.exit(1);
  }
};

run();

