const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Employee = require('../models/Employee');
const Item = require('../models/Item');
const AccountabilityRecord = require('../models/AccountabilityRecord');
const ItemHistory = require('../models/ItemHistory');

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

// Major mall / anchor branches with 8 cameras
const EIGHT_CAMERA_STORES = new Set([
  "ROBINSON MARASBARAS",
  "ROBINSONS NORTH",
  "SM SAVEMORE",
  "Metro Gaisano",
  "ROBINSONS ORMOC",
  "GAISANO CATARMAN",
  "CALBAYOG GAISANO",
  "Prince Naval"
]);

function getStoreCode(name, index) {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = clean.slice(0, 3).padEnd(3, 'X');
  const num = String(index + 1).padStart(2, '0');
  return `${prefix}${num}`;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chawnah_accountability';
  console.log('Connecting to MongoDB at:', mongoUri);
  await mongoose.connect(mongoUri);

  try {
    console.log('\n======================================================');
    console.log('  SEEDING CCTV SETS FOR ALL 44 CHAWNAH FOODS STORES');
    console.log('======================================================\n');

    const deploymentDate = new Date('2026-11-12');
    let totalCctvItemsCreated = 0;
    let totalStoresUpdated = 0;

    for (let sIdx = 0; sIdx < CHAWNAH_STORES.length; sIdx++) {
      const storeName = CHAWNAH_STORES[sIdx];
      const storeCodeStr = String(sIdx + 1).padStart(2, '0');
      const storeCodeAlpha = getStoreCode(storeName, sIdx);
      const isMallBranch = EIGHT_CAMERA_STORES.has(storeName);
      const cameraCount = isMallBranch ? 8 : 4;
      const formNumber = `CFI-ACT-2026-S${String(sIdx + 1).padStart(3, '0')}`;

      // 1. Locate Store Accountability Record
      let storeRecord = await AccountabilityRecord.findOne({
        accountabilityType: 'Store',
        storeName: storeName,
      });

      if (!storeRecord) {
        storeRecord = await AccountabilityRecord.findOne({
          accountabilityType: 'Store',
          formNumber: formNumber,
        });
      }

      if (!storeRecord) {
        console.warn(`[Store ${sIdx + 1}/${CHAWNAH_STORES.length}] Warning: Record for store "${storeName}" (${formNumber}) not found. Skipping.`);
        continue;
      }

      // Check an existing Desktop item for this store to inherit retail brand & legal owner
      const sampleStoreItem = await Item.findOne({
        'currentAssignment.storeName': storeName,
      });

      const retailBrand = sampleStoreItem?.brand || 'Goldilocks';
      const legalOwner = sampleStoreItem?.legalOwner || 'Chawnah Foods Inc.';

      // Check if CCTV items already exist for this store to prevent duplicate seeding
      const existingCctvItems = await Item.find({
        'currentAssignment.storeName': storeName,
        $or: [
          { setTag: 'CCTV Set' },
          { 'currentAssignment.setTag': 'CCTV Set' },
          { remarks: { $regex: /CCTV Set/i } },
        ],
      });

      if (existingCctvItems.length > 0) {
        console.log(`[Store ${sIdx + 1}/${CHAWNAH_STORES.length}] ${storeName}: Already has ${existingCctvItems.length} CCTV Set items. Cleaning up prior CCTV items to ensure fresh sync...`);
        const oldCctvIds = existingCctvItems.map(i => i._id);
        await Item.deleteMany({ _id: { $in: oldCctvIds } });
        await ItemHistory.deleteMany({ item: { $in: oldCctvIds } });
        storeRecord.items = storeRecord.items.filter(it => !oldCctvIds.some(oid => oid.equals(it.item)));
      }

      // CCTV Inclusions Blueprint
      const cctvBlueprint = [
        {
          desc: 'DVR',
          brand: isMallBranch ? 'Hikvision DS-7208HQHI' : 'Hikvision DS-7204HQHI',
          eqType: 'DVR',
          cat: 'Office Equipment',
          sn: `SN-DVR-S${storeCodeStr}-01`,
          remark: `CCTV Set — ${cameraCount}-Channel Turbo HD DVR (${isMallBranch ? '2TB' : '1TB'} Surveillance HDD)`,
        },
        {
          desc: 'Power Supply',
          brand: isMallBranch ? 'Centralized 12V 10A DC Box' : 'Centralized 12V 5A DC Box',
          eqType: 'Power Supplies & Adapters',
          cat: 'Office Equipment',
          sn: `PSU-CCTV-S${storeCodeStr}-01`,
          remark: `CCTV Set — 12V DC Centralized Power Box for ${cameraCount} cameras`,
        },
        {
          desc: 'Power Splitter',
          brand: isMallBranch ? 'Standard 8-Way DC Splitter' : 'Standard 4-Way DC Splitter',
          eqType: 'Power Supplies & Adapters',
          cat: 'Office Equipment',
          sn: `SPL-DC-S${storeCodeStr}-01`,
          remark: `CCTV Set — ${cameraCount}-Way DC Power Splitter Cable`,
        },
      ];

      // Add Cameras (4 or 8)
      for (let c = 1; c <= cameraCount; c++) {
        cctvBlueprint.push({
          desc: `Camera #${c}`,
          brand: 'Hikvision DS-2CE16D0T',
          eqType: 'CCTV Camera',
          cat: 'Office Equipment',
          sn: `SN-CAM-S${storeCodeStr}-${String(c).padStart(2, '0')}`,
          remark: `CCTV Set — 1080p HD Security Camera (Unit #${c} of ${cameraCount})`,
        });
      }

      // Add CCTV Peripherals (UPS, Monitor, HDMI, RG59 Wires, LAN Cable)
      cctvBlueprint.push(
        {
          desc: 'UPS (CCTV Backup)',
          brand: 'APC Back-UPS 650VA',
          eqType: 'UPS',
          cat: 'Office Equipment',
          sn: `SN-UPS-S${storeCodeStr}-02`,
          remark: 'CCTV Set — Dedicated UPS 650VA / 360W Surveillance Battery Backup',
        },
        {
          desc: 'Surveillance Monitor',
          brand: 'Hikvision DS-D5022FN-C 21.5"',
          eqType: 'Monitor',
          cat: 'Printers & Peripherals',
          sn: `SN-MON-S${storeCodeStr}-02`,
          remark: 'CCTV Set — 21.5" CCTV Surveillance LED Monitor',
        },
        {
          desc: 'HDMI Cable',
          brand: 'Standard HDMI 2.0',
          eqType: 'Cables & Accessories',
          cat: 'Office Equipment',
          sn: `CAB-HDMI-S${storeCodeStr}-02`,
          remark: 'CCTV Set — High-Speed HDMI Video Cable (DVR to Monitor)',
        },
        {
          desc: 'Coaxial RG59 Siamese Wires',
          brand: 'Standard RG59 Siamese',
          eqType: 'Cables & Accessories',
          cat: 'Office Equipment',
          sn: `WIR-CCTV-S${storeCodeStr}-01`,
          remark: 'CCTV Set — RG59 Siamese Video & DC Power Wires Roll',
        },
        {
          desc: 'LAN Cable',
          brand: 'Standard Cat6 UTP',
          eqType: 'Cables & Accessories',
          cat: 'Office Equipment',
          sn: `CAB-LAN-S${storeCodeStr}-02`,
          remark: 'CCTV Set — Cat6 Network Cable for Remote Surveillance',
        }
      );

      // Starting index for CCTV items: Desktop Set is items 01 through 07, so CCTV starts at 08
      const startIndex = 8;
      const newFormItems = [];

      for (let i = 0; i < cctvBlueprint.length; i++) {
        const itemPlan = cctvBlueprint[i];
        const itemSequence = startIndex + i;
        const itemNumStr = `ITM-S${storeCodeStr}-${String(itemSequence).padStart(2, '0')}`;
        const assetTagStr = `CFI-STR-${storeCodeStr}-${String(itemSequence).padStart(2, '0')}`;

        const dbItem = new Item({
          itemNumber: itemNumStr,
          assetTag: assetTagStr,
          itemDescription: itemPlan.desc,
          brandModel: itemPlan.brand,
          serialNumber: itemPlan.sn,
          category: itemPlan.cat,
          equipmentType: itemPlan.eqType,
          currentCondition: 'Good',
          status: 'Assigned',
          remarks: itemPlan.remark,
          brand: retailBrand,
          legalOwner: legalOwner,
          setTag: 'CCTV Set',
          currentAssignment: {
            accountabilityId: storeRecord._id,
            accountabilityType: 'Store',
            storeName: storeName,
            targetGroup: `Store: ${storeName}`,
            employee: storeRecord.employee || undefined,
            employeeName: 'Store Supervisor / Custodian',
            employeeId: `CFI-STR-${String(sIdx + 1).padStart(3, '0')}`,
            department: 'Store Operations / Retail',
            dateIssued: deploymentDate,
            conditionAtIssuance: 'Good',
            issuanceRemarks: itemPlan.remark,
            setTag: 'CCTV Set',
          },
        });

        await dbItem.save();

        // Audit History
        await ItemHistory.create({
          item: dbItem._id,
          action: 'ASSIGNED',
          accountabilityType: 'Store',
          storeName: storeName,
          targetGroup: `Store: ${storeName}`,
          employeeName: 'Store Supervisor / Custodian',
          employeeId: `CFI-STR-${String(sIdx + 1).padStart(3, '0')}`,
          department: 'Store Operations / Retail',
          formNumber: storeRecord.formNumber,
          accountabilityId: storeRecord._id,
          date: deploymentDate,
          condition: 'Good',
          remarks: `CCTV Set Deployment to ${storeName}. Form: ${storeRecord.formNumber}`,
          performedBy: 'Kevin Paul Lim (IT Custodian)',
        });

        newFormItems.push({
          item: dbItem._id,
          itemNumber: itemNumStr,
          assetTag: assetTagStr,
          itemDescription: itemPlan.desc,
          brandModel: itemPlan.brand,
          serialNumber: itemPlan.sn,
          dateIssued: deploymentDate,
          conditionAtIssuance: 'Good',
          remarks: itemPlan.remark,
          status: 'Active',
          setTag: 'CCTV Set',
        });

        totalCctvItemsCreated++;
      }

      // Append new CCTV items to existing store record items (keeping Desktop Set items intact)
      storeRecord.items = [...storeRecord.items, ...newFormItems];
      await storeRecord.save();

      totalStoresUpdated++;
      if (totalStoresUpdated <= 3 || totalStoresUpdated === CHAWNAH_STORES.length) {
        console.log(`[Store ${totalStoresUpdated}/${CHAWNAH_STORES.length}] ${storeName} (${storeRecord.formNumber}): Added ${newFormItems.length} CCTV Set items (${cameraCount} cameras). Total store items: ${storeRecord.items.length}`);
      }
    }

    console.log('\n======================================================');
    console.log(`SUCCESS: Added CCTV Sets to all ${totalStoresUpdated} stores.`);
    console.log(`Total new CCTV items created: ${totalCctvItemsCreated}`);
    const finalItemCount = await Item.countDocuments();
    console.log(`Total items in database: ${finalItemCount}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error during CCTV set seeding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

run();

