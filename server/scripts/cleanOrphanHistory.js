const mongoose = require('mongoose');
require('dotenv').config();
const ItemHistory = require('../models/ItemHistory');
const Item = require('../models/Item');

(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chawnah_accountability';
    await mongoose.connect(mongoUri);

    const validItemIds = await Item.find().distinct('_id');
    const res = await ItemHistory.deleteMany({
      $or: [
        { item: null },
        { item: { $nin: validItemIds } }
      ]
    });
    console.log('Cleaned orphaned history logs:', res.deletedCount);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

