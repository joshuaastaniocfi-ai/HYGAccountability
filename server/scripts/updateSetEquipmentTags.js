const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Item = require('../models/Item');
const AccountabilityRecord = require('../models/AccountabilityRecord');

// Official 44 Store Branches of Chawnah Foods Inc.
const CHAWNAH_STORES = [
  "AIRPORT",
  "BURGOS",
  "Metro Gaisano",
  "ROBINSON MARASBARAS",
  "ROBINSONS NORTH",
  "J&F Palo",
  "SM SAVEMORE",
  "ABUYOG",
  "BAYBAY",
  "BURAUEN",
  "DULAG",
  "KANANGA",
  "ORMOC MAIN",
  "ROBINSONS ORMOC",
  "TANAUAN",
  "Valencia",
  "BATO",
  "HILONGOS",
  "HINUNANGAN",
  "LILOAN",
  "MAASIN",
  "SAN JUAN",
  "SOGOD",
  "ALLEN",
  "CALBAYOG GAISANO",
  "CALBAYOG HIGHWAY",
  "CATARMAN",
  "CATUBIG",
  "GAISANO CATARMAN",
  "GANDARA",
  "ALANG-ALANG",
  "CAIBIRAN",
  "CALUBIAN",
  "CARIGARA",
  "ISABEL",
  "NAVAL, Biliran",
  "PALOMPON",
  "Prince Naval",
  "CALBIGA",
  "CATBALOGAN",
  "GEN MAC ARTHUR, ES",
  "GUIUAN",
  "GOW Balangiga",
  "TAFT, ES"
];

async function run() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chawnah_accountability';
  console.log('Connecting to MongoDB at:', mongoUri);
  await mongoose.connect(mongoUri);

  try {
    console.log('\n======================================================');
    console.log('  APPLYING EQUIPMENT SET TAGS TO ALL 44 STORES & EMPLOYEES');
    console.log('======================================================\n');

    let totalItemsUpdated = 0;
    let totalRecordsUpdated = 0;

    // 1. Update 44 Store Branches
    for (let sIdx = 0; sIdx < CHAWNAH_STORES.length; sIdx++) {
      const storeName = CHAWNAH_STORES[sIdx];
      const sNum = String(sIdx + 1).padStart(2, '0');

      const desktopTag = `CFI-STR-${sNum}-SET-DESK`;
      const desktopItemNum = `SET-S${sNum}-DESK`;

      const cctvTag = `CFI-STR-${sNum}-SET-CCTV`;
      const cctvItemNum = `SET-S${sNum}-CCTV`;

      // Update Desktop Set Items
      const deskRes = await Item.updateMany(
        {
          'currentAssignment.storeName': storeName,
          setTag: 'Desktop Set',
        },
        {
          $set: {
            setEquipmentTag: desktopTag,
            setItemNumber: desktopItemNum,
            'currentAssignment.setEquipmentTag': desktopTag,
            'currentAssignment.setItemNumber': desktopItemNum,
          },
        }
      );

      // Update CCTV Set Items
      const cctvRes = await Item.updateMany(
        {
          'currentAssignment.storeName': storeName,
          setTag: 'CCTV Set',
        },
        {
          $set: {
            setEquipmentTag: cctvTag,
            setItemNumber: cctvItemNum,
            'currentAssignment.setEquipmentTag': cctvTag,
            'currentAssignment.setItemNumber': cctvItemNum,
          },
        }
      );

      totalItemsUpdated += (deskRes.modifiedCount || 0) + (cctvRes.modifiedCount || 0);

      // Update Store Accountability Record
      const storeRec = await AccountabilityRecord.findOne({
        accountabilityType: 'Store',
        storeName: storeName,
      });

      if (storeRec && Array.isArray(storeRec.items)) {
        storeRec.items.forEach((it) => {
          if (it.setTag === 'Desktop Set') {
            it.setEquipmentTag = desktopTag;
            it.setItemNumber = desktopItemNum;
          } else if (it.setTag === 'CCTV Set') {
            it.setEquipmentTag = cctvTag;
            it.setItemNumber = cctvItemNum;
          }
        });
        await storeRec.save();
        totalRecordsUpdated++;
      }

      if ((sIdx + 1) <= 3 || (sIdx + 1) === CHAWNAH_STORES.length) {
        console.log(`[Store ${sIdx + 1}/44] ${storeName}: Desktop Set -> ${desktopTag} | CCTV Set -> ${cctvTag}`);
      }
    }

    // 2. Update Employee Rovelyn N. Bernal (CFI-ACT-2026-0045)
    const empDesktopTag = `CFI-EMP-045-SET-DESK`;
    const empDesktopItemNum = `SET-EMP-045-DESK`;

    const empRes = await Item.updateMany(
      {
        'currentAssignment.employeeName': { $regex: /Rovelyn/i },
        setTag: 'Desktop Set',
      },
      {
        $set: {
          setEquipmentTag: empDesktopTag,
          setItemNumber: empDesktopItemNum,
          'currentAssignment.setEquipmentTag': empDesktopTag,
          'currentAssignment.setItemNumber': empDesktopItemNum,
        },
      }
    );

    totalItemsUpdated += empRes.modifiedCount || 0;

    const empRec = await AccountabilityRecord.findOne({
      accountabilityType: 'Individual',
      formNumber: 'CFI-ACT-2026-0045',
    });

    if (empRec && Array.isArray(empRec.items)) {
      empRec.items.forEach((it) => {
        if (it.setTag === 'Desktop Set') {
          it.setEquipmentTag = empDesktopTag;
          it.setItemNumber = empDesktopItemNum;
        }
      });
      await empRec.save();
      totalRecordsUpdated++;
      console.log(`[Employee] Rovelyn N. Bernal: Desktop Set -> ${empDesktopTag}`);
    }

    console.log('\n======================================================');
    console.log(`SUCCESS: Updated ${totalItemsUpdated} items and ${totalRecordsUpdated} accountability forms.`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error updating set tags:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

run();

