const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('../models/Item');
const AccountabilityRecord = require('../models/AccountabilityRecord');
const ItemHistory = require('../models/ItemHistory');
const InventoryBatch = require('../models/InventoryBatch');

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chawnah_accountability';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('\n--- STEP 1: AUDITING CURRENT STATE ---');
    const totalItemsBefore = await Item.countDocuments();
    const totalAccBefore = await AccountabilityRecord.countDocuments();
    console.log(`Current items: ${totalItemsBefore}`);
    console.log(`Current accountability records: ${totalAccBefore}`);

    // Step 2: Determine items to keep
    // We keep Desktop Set items: remarks containing 'Desktop Set' OR assetTag matching CFI-STR-XX-0[1-7]
    const desktopItems = await Item.find({
      $or: [
        { remarks: { $regex: /Desktop Set/i } },
        { assetTag: { $regex: /^CFI-STR-\d{2}-0[1-7]$/ } },
      ],
    });

    console.log(`\nFound ${desktopItems.length} Desktop Set items to KEEP across the 44 stores.`);
    const desktopItemIds = new Set(desktopItems.map(i => i._id.toString()));

    // Step 3: Find items to delete
    const itemsToDelete = await Item.find({
      _id: { $nin: Array.from(desktopItemIds).map(id => new mongoose.Types.ObjectId(id)) },
    });
    console.log(`Found ${itemsToDelete.length} items to DELETE (CCTV items, Laptops, Tablets, Scanners, QA tools, UPS batteries, dismantled parts).`);

    const toDeleteIds = itemsToDelete.map(i => i._id);

    // Step 4: Clean up store accountability records (keep only Desktop Set items)
    console.log('\n--- STEP 2: UPDATING 44 STORE ACCOUNTABILITY RECORDS ---');
    const storeRecords = await AccountabilityRecord.find({ accountabilityType: 'Store' });
    let updatedStoreCount = 0;

    for (const rec of storeRecords) {
      const originalCount = rec.items.length;
      // Filter to keep only items that belong to the Desktop Set
      rec.items = rec.items.filter(it => {
        const itId = it.item ? it.item.toString() : '';
        const isDesktopRemark = it.remarks && it.remarks.includes('Desktop Set');
        const isDesktopTag = /^CFI-STR-\d{2}-0[1-7]$/.test(it.assetTag || '');
        return desktopItemIds.has(itId) || isDesktopRemark || isDesktopTag;
      });

      await rec.save();
      updatedStoreCount++;
      if (updatedStoreCount <= 3 || updatedStoreCount === storeRecords.length) {
        console.log(`[Store ${updatedStoreCount}/${storeRecords.length}] ${rec.storeName} (${rec.formNumber}): reduced from ${originalCount} items -> ${rec.items.length} Desktop Set items.`);
      }
    }

    // Step 5: Remove non-store accountability records (Individual forms with laptops, etc.)
    console.log('\n--- STEP 3: REMOVING NON-STORE ACCOUNTABILITY RECORDS ---');
    const nonStoreDeleteResult = await AccountabilityRecord.deleteMany({ accountabilityType: { $ne: 'Store' } });
    console.log(`Removed ${nonStoreDeleteResult.deletedCount} non-store accountability records.`);

    // Step 6: Delete the items from Item collection
    console.log('\n--- STEP 4: DELETING NON-DESKTOP ITEMS FROM INVENTORY ---');
    const itemDeleteResult = await Item.deleteMany({ _id: { $in: toDeleteIds } });
    console.log(`Successfully deleted ${itemDeleteResult.deletedCount} items from Item collection.`);

    // Step 7: Delete item history logs for deleted items
    console.log('\n--- STEP 5: CLEANING UP ITEM HISTORIES & BATCHES ---');
    const historyDeleteResult = await ItemHistory.deleteMany({ item: { $in: toDeleteIds } });
    console.log(`Deleted ${historyDeleteResult.deletedCount} history audit entries for removed items.`);

    const batchDeleteResult = await InventoryBatch.deleteMany({});
    console.log(`Deleted ${batchDeleteResult.deletedCount} legacy inventory batch intake records.`);

    // Step 8: Verification
    console.log('\n--- STEP 6: VERIFICATION & SUMMARY ---');
    const totalItemsAfter = await Item.countDocuments();
    const totalAccAfter = await AccountabilityRecord.countDocuments();

    const typesSummary = await Item.aggregate([
      {
        $group: {
          _id: '$equipmentType',
          count: { $sum: 1 },
          category: { $first: '$category' },
          sampleDescription: { $first: '$itemDescription' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log(`Total remaining items: ${totalItemsAfter} (Expected: 308, 7 per store * 44 stores)`);
    console.log(`Total remaining accountability forms: ${totalAccAfter} (Expected: 44 store forms)`);
    console.log('\nRemaining Equipment Types in Database:');
    console.log(JSON.stringify(typesSummary, null, 2));

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: Cleaned equipment database to PC & Desktop sets only!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
};

run();

