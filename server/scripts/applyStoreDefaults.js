const mongoose = require('mongoose');
require('dotenv').config();

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

// Helper to create a short alpha code from store name
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
    console.log('\n--- STEP 1: REMOVING EXISTING STORE ACCOUNTABILITIES ---');
    // Find all store records
    const oldStoreRecords = await AccountabilityRecord.find({
      $or: [
        { accountabilityType: 'Store' },
        { storeName: { $exists: true, $ne: '' } }
      ]
    });
    console.log(`Found ${oldStoreRecords.length} existing store accountability records to remove.`);

    const oldRecordIds = oldStoreRecords.map(r => r._id);

    // Delete items assigned to stores
    const delItemsRes = await Item.deleteMany({
      $or: [
        { 'currentAssignment.accountabilityType': 'Store' },
        { 'currentAssignment.accountabilityId': { $in: oldRecordIds } },
        { 'currentAssignment.storeName': { $in: CHAWNAH_STORES } }
      ]
    });
    console.log(`Deleted ${delItemsRes.deletedCount} old store equipment items.`);

    // Delete item history for store accountabilities
    const delHistRes = await ItemHistory.deleteMany({
      $or: [
        { accountabilityType: 'Store' },
        { accountabilityId: { $in: oldRecordIds } },
        { storeName: { $in: CHAWNAH_STORES } }
      ]
    });
    console.log(`Deleted ${delHistRes.deletedCount} old store history logs.`);

    // Delete the store accountability records
    const delRecRes = await AccountabilityRecord.deleteMany({
      _id: { $in: oldRecordIds }
    });
    console.log(`Deleted ${delRecRes.deletedCount} old store accountability records.`);

    // Resolve or find representative Store Custodian employee
    let storeCustodian = await Employee.findOne({ department: 'Store Operations / Retail' });
    if (!storeCustodian) {
      storeCustodian = await Employee.findOne({});
    }

    console.log('\n--- STEP 2: APPLYING DEFAULT PACKAGES TO ALL 44 STORES ---');
    const deploymentDate = new Date('2026-11-12');
    let totalItemsCreated = 0;
    let totalFormsCreated = 0;

    for (let sIdx = 0; sIdx < CHAWNAH_STORES.length; sIdx++) {
      const storeName = CHAWNAH_STORES[sIdx];
      const storeCode = getStoreCode(storeName, sIdx);
      const isMallBranch = EIGHT_CAMERA_STORES.has(storeName);
      const cameraCount = isMallBranch ? 8 : 4;
      const formNumber = `CFI-ACT-2026-S${String(sIdx + 1).padStart(3, '0')}`;

      // Build Inclusions:
      // 1. Desktop Set (7 items)
      // 2. CCTV Set (9 items for 4 cams, 13 items for 8 cams)
      const inclusionsBlueprint = [
        // --- DESKTOP SET ---
        {
          group: 'Desktop Set',
          desc: 'Dell 24" FHD LED Monitor Display',
          brand: 'Dell E2422H',
          eqType: 'Monitor',
          cat: 'Printers & Peripherals',
          sn: `SN-MON-${storeCode}-01`,
          remark: 'Desktop Set — Monitor',
        },
        {
          group: 'Desktop Set',
          desc: 'Dell USB Optical Mouse',
          brand: 'Dell MS116',
          eqType: 'Mouse',
          cat: 'Printers & Peripherals',
          sn: `SN-MOU-${storeCode}-01`,
          remark: 'Desktop Set — Mouse',
        },
        {
          group: 'Desktop Set',
          desc: 'Dell Standard USB Keyboard',
          brand: 'Dell KB216',
          eqType: 'Keyboard',
          cat: 'Printers & Peripherals',
          sn: `SN-KBD-${storeCode}-01`,
          remark: 'Desktop Set — Keyboard',
        },
        {
          group: 'Desktop Set',
          desc: 'Dell OptiPlex System Unit (Core i5, 16GB RAM, 512GB Fast SSD)',
          brand: 'Dell OptiPlex 7090 SFF',
          eqType: 'Desktop',
          cat: 'Laptops & Desktops',
          sn: `SN-SYS-${storeCode}-01`,
          remark: 'Desktop Set — System Unit with 512GB Fast SSD',
        },
        {
          group: 'Desktop Set',
          desc: 'Uninterruptible Power Supply for Workstation (UPS 650VA / 360W)',
          brand: 'APC Back-UPS 650VA',
          eqType: 'UPS',
          cat: 'Office Equipment',
          sn: `SN-UPS-${storeCode}-01`,
          remark: 'Desktop Set — Workstation UPS Battery Backup',
        },
        {
          group: 'Desktop Set',
          desc: 'High-Speed HDMI Display Video Cable (1.8m)',
          brand: 'Standard HDMI 2.0',
          eqType: 'Cables & Accessories',
          cat: 'Office Equipment',
          sn: `CAB-HDMI-${storeCode}-01`,
          remark: 'Desktop Set — HDMI Display Video Cable',
        },
        {
          group: 'Desktop Set',
          desc: 'Cat6 UTP LAN Network Patch Cable (3m)',
          brand: 'Standard Cat6 UTP',
          eqType: 'Cables & Accessories',
          cat: 'Office Equipment',
          sn: `CAB-LAN-${storeCode}-01`,
          remark: 'Desktop Set — Network LAN Cable',
        },

        // --- CCTV SET ---
        {
          group: 'CCTV Set',
          desc: isMallBranch
            ? 'Hikvision 8-Channel Turbo HD DVR (with 2TB Surveillance Hard Drive)'
            : 'Hikvision 8-Channel Turbo HD DVR (with 1TB Surveillance Hard Drive)',
          brand: 'Hikvision DS-7208HQHI',
          eqType: 'DVR',
          cat: 'Office Equipment',
          sn: `SN-DVR-${storeCode}-01`,
          remark: `CCTV Set — DVR with ${isMallBranch ? '2TB' : '1TB'} Surveillance Hard Drive`,
        },
        {
          group: 'CCTV Set',
          desc: isMallBranch
            ? 'Centralized 12V 10A DC CCTV Power Supply Metal Box'
            : 'Centralized 12V 5A DC CCTV Power Supply Metal Box',
          brand: 'Standard CCTV Central PSU',
          eqType: 'Power Supplies & Adapters',
          cat: 'Office Equipment',
          sn: `PSU-CCTV-${storeCode}-01`,
          remark: `CCTV Set — 12V Centralized DC Power Supply for ${cameraCount} cameras`,
        },
        {
          group: 'CCTV Set',
          desc: isMallBranch
            ? '1-to-8 Channel DC Power Splitter Cable for Cameras'
            : '1-to-4 Channel DC Power Splitter Cable for Cameras',
          brand: isMallBranch ? 'Standard 8-Way DC Splitter' : 'Standard 4-Way DC Splitter',
          eqType: 'Power Supplies & Adapters',
          cat: 'Office Equipment',
          sn: `SPL-DC-${storeCode}-01`,
          remark: `CCTV Set — ${cameraCount}-Way DC Power Splitter`,
        },
      ];

      // Append Cameras (4 or 8)
      for (let c = 1; c <= cameraCount; c++) {
        inclusionsBlueprint.push({
          group: 'CCTV Set',
          desc: `Hikvision 1080p HD CCTV Security Camera (Camera #${c})`,
          brand: 'Hikvision DS-2CE16D0T',
          eqType: 'CCTV Camera',
          cat: 'Office Equipment',
          sn: `SN-CAM-${storeCode}-${String(c).padStart(2, '0')}`,
          remark: `CCTV Set — Camera Unit #${c} of ${cameraCount}`,
        });
      }

      // CCTV Peripherals (UPS, Monitor, HDMI, Wires, LAN)
      inclusionsBlueprint.push(
        {
          group: 'CCTV Set',
          desc: 'Uninterruptible Power Supply for CCTV Backup (UPS 650VA / 360W)',
          brand: 'APC Back-UPS 650VA',
          eqType: 'UPS',
          cat: 'Office Equipment',
          sn: `SN-UPS-${storeCode}-02`,
          remark: 'CCTV Set — Dedicated UPS for 24/7 continuous surveillance recording',
        },
        {
          group: 'CCTV Set',
          desc: 'CCTV Surveillance LED Monitor Display (21.5")',
          brand: 'Hikvision / AOC Display',
          eqType: 'Monitor',
          cat: 'Printers & Peripherals',
          sn: `SN-MON-${storeCode}-02`,
          remark: 'CCTV Set — Dedicated Surveillance Monitor',
        },
        {
          group: 'CCTV Set',
          desc: 'High-Speed HDMI Video Cable (DVR to Surveillance Monitor)',
          brand: 'Standard HDMI 2.0',
          eqType: 'Cables & Accessories',
          cat: 'Office Equipment',
          sn: `CAB-HDMI-${storeCode}-02`,
          remark: 'CCTV Set — HDMI Video Output Cable',
        },
        {
          group: 'CCTV Set',
          desc: 'CCTV Siamese Coaxial RG59 Video & DC Power Wires Roll',
          brand: 'Standard RG59 Siamese',
          eqType: 'Cables & Accessories',
          cat: 'Office Equipment',
          sn: `WIR-CCTV-${storeCode}-01`,
          remark: 'CCTV Set — Coaxial and Power Wires',
        },
        {
          group: 'CCTV Set',
          desc: 'Cat6 Network Cable for DVR Online Remote View',
          brand: 'Standard Cat6 UTP',
          eqType: 'Cables & Accessories',
          cat: 'Office Equipment',
          sn: `CAB-LAN-${storeCode}-02`,
          remark: 'CCTV Set — Network Cable for Remote Surveillance',
        }
      );

      // 1. Create Placeholder Accountability Record to get its _id
      const record = new AccountabilityRecord({
        formNumber,
        accountabilityType: 'Store',
        storeName,
        targetGroup: `Store: ${storeName}`,
        employee: storeCustodian?._id || undefined,
        employeeInfo: {
          name: 'Store Supervisor / Custodian',
          employeeId: `CFI-STR-${String(sIdx + 1).padStart(3, '0')}`,
          jobTitle: 'Store Supervisor / Branch In-Charge',
          department: 'Store Operations / Retail',
        },
        items: [],
        status: 'Active',
        issuance: {
          date: deploymentDate,
          releasedBy: 'Kevin Paul Lim (IT Custodian)',
          approvedBy: 'Dr. Evelyn Yap (VP Operations)',
          employeeSignatureName: 'Store Supervisor / Custodian',
          employeeSignatureDate: deploymentDate,
          conditionAcknowledgment: {
            receivedInGoodCondition: true,
            notedIssues: '',
          },
        },
      });

      const savedRecord = await record.save();

      // 2. Create Items in Inventory and link to this record
      const formItemsList = [];

      for (let iIdx = 0; iIdx < inclusionsBlueprint.length; iIdx++) {
        const itemPlan = inclusionsBlueprint[iIdx];
        const itemNumStr = `ITM-S${String(sIdx + 1).padStart(2, '0')}-${String(iIdx + 1).padStart(2, '0')}`;
        const assetTagStr = `CFI-STR-${String(sIdx + 1).padStart(2, '0')}-${String(iIdx + 1).padStart(2, '0')}`;

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
          currentAssignment: {
            accountabilityId: savedRecord._id,
            accountabilityType: 'Store',
            storeName,
            targetGroup: `Store: ${storeName}`,
            employee: storeCustodian?._id || undefined,
            employeeName: 'Store Supervisor / Custodian',
            employeeId: `CFI-STR-${String(sIdx + 1).padStart(3, '0')}`,
            department: 'Store Operations / Retail',
            dateIssued: deploymentDate,
            conditionAtIssuance: 'Good',
            issuanceRemarks: itemPlan.remark,
          },
        });

        await dbItem.save();

        // Audit Log
        await ItemHistory.create({
          item: dbItem._id,
          action: 'ASSIGNED',
          accountabilityType: 'Store',
          storeName,
          targetGroup: `Store: ${storeName}`,
          employeeName: 'Store Supervisor / Custodian',
          employeeId: `CFI-STR-${String(sIdx + 1).padStart(3, '0')}`,
          department: 'Store Operations / Retail',
          formNumber: savedRecord.formNumber,
          accountabilityId: savedRecord._id,
          date: deploymentDate,
          condition: 'Good',
          remarks: `Standard Branch Equipment Package deployment to ${storeName}. Form: ${savedRecord.formNumber}`,
          performedBy: 'Kevin Paul Lim (IT Custodian)',
        });

        formItemsList.push({
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
        });

        totalItemsCreated++;
      }

      // Update record with the generated items
      savedRecord.items = formItemsList;
      await savedRecord.save();
      totalFormsCreated++;

      console.log(`[${String(sIdx + 1).padStart(2, '0')}/44] ${storeName} -> Form ${savedRecord.formNumber} created with ${formItemsList.length} items (${cameraCount} cameras).`);
    }

    console.log('\n======================================================');
    console.log(`🎉 SUCCESS: Applied default store package to all 44 stores!`);
    console.log(`Total Official Store Forms Created: ${totalFormsCreated}`);
    console.log(`Total Equipment Units Assigned:     ${totalItemsCreated}`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('Error during store seeding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

run();

