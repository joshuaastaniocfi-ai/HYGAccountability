const mongoose = require('mongoose');
require('dotenv').config();

const Employee = require('../models/Employee');
const AccountabilityRecord = require('../models/AccountabilityRecord');
const Item = require('../models/Item');
const ItemHistory = require('../models/ItemHistory');

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chawnah_accountability';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);

    console.log('\n--- REMOVING ALL EMPLOYEES AND THEIR ACCOUNTABILITIES ---');

    // 1. Delete all employees
    const empCountBefore = await Employee.countDocuments();
    const empDeleteResult = await Employee.deleteMany({});
    console.log(`Deleted ${empDeleteResult.deletedCount} employees from Employee collection (was ${empCountBefore}).`);

    // 2. Delete all non-store accountability forms (individual employee accountabilities)
    const nonStoreDeleteResult = await AccountabilityRecord.deleteMany({
      $or: [
        { accountabilityType: { $ne: 'Store' } },
        { targetType: 'Employee' },
      ],
    });
    console.log(`Deleted ${nonStoreDeleteResult.deletedCount} employee/individual accountability forms.`);

    // 3. Clear employee ObjectId references in store accountability records
    const accUpdateResult = await AccountabilityRecord.updateMany(
      {},
      {
        $unset: { employee: 1 },
      }
    );
    console.log(`Unlinked employee references from ${accUpdateResult.modifiedCount} store accountability records.`);

    // 4. Clear employee ObjectId references in Item.currentAssignment
    const itemUpdateResult = await Item.updateMany(
      {},
      {
        $unset: { 'currentAssignment.employee': 1 },
      }
    );
    console.log(`Unlinked employee references from ${itemUpdateResult.modifiedCount} equipment items.`);

    // 5. Clean up employee-specific item history records
    const historyDeleteResult = await ItemHistory.deleteMany({
      accountabilityType: 'Individual',
    });
    console.log(`Deleted ${historyDeleteResult.deletedCount} individual employee history audit records.`);

    const historyUpdateResult = await ItemHistory.updateMany(
      {},
      {
        $unset: { employee: 1 },
      }
    );
    console.log(`Unlinked employee references from ${historyUpdateResult.modifiedCount} remaining history records.`);

    // Verification
    const empAfter = await Employee.countDocuments();
    const accTotal = await AccountabilityRecord.countDocuments();
    const itemsTotal = await Item.countDocuments();

    console.log('\n--- VERIFICATION ---');
    console.log(`Employees remaining: ${empAfter} (Expected: 0)`);
    console.log(`Accountability records remaining: ${accTotal} (Store branches: 44)`);
    console.log(`Equipment items remaining: ${itemsTotal} (Store Desktop sets: 308)`);

    console.log('\n======================================================');
    console.log('🎉 SUCCESS: All employees and their accountabilities removed!');
    console.log('======================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Error removing employees:', err);
    process.exit(1);
  }
};

run();

