const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const Employee = require('../models/Employee');
const AccountabilityRecord = require('../models/AccountabilityRecord');
const ItemHistory = require('../models/ItemHistory');

// GET /api/stats - Dashboard analytics and metrics
router.get('/', async (req, res) => {
  try {
    const [
      totalItems,
      assignedItems,
      availableItems,
      maintenanceItems,
      totalEmployees,
      activeForms,
      returnedForms,
      recentHistory,
      categoriesAgg,
      conditionsAgg,
      departmentsAgg,
      companiesAgg,
    ] = await Promise.all([
      Item.countDocuments(),
      Item.countDocuments({ status: 'Assigned' }),
      Item.countDocuments({ status: 'Available' }),
      Item.countDocuments({ status: { $in: ['Under Maintenance', 'Decommissioned'] } }),
      Employee.countDocuments(),
      AccountabilityRecord.countDocuments({ status: { $in: ['Active', 'Partially Returned'] } }),
      AccountabilityRecord.countDocuments({ status: 'Returned' }),
      ItemHistory.find()
        .populate('item')
        .populate('employee')
        .sort({ date: -1, createdAt: -1 })
        .limit(8)
        .lean(),
      Item.aggregate([
        {
          $group: {
            _id: '$category',
            total: { $sum: 1 },
            issued: {
              $sum: { $cond: [{ $eq: ['$status', 'Assigned'] }, 1, 0] },
            },
            stocked: {
              $sum: { $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] },
            },
            damaged: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'Under Maintenance'] },
                      { $eq: ['$status', 'Decommissioned'] },
                      { $eq: ['$currentCondition', 'Damaged'] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            good: {
              $sum: {
                $cond: [
                  { $in: ['$currentCondition', ['Good', 'New']] },
                  1,
                  0,
                ],
              },
            },
            fair: {
              $sum: { $cond: [{ $eq: ['$currentCondition', 'Fair'] }, 1, 0] },
            },
          },
        },
        { $sort: { total: -1 } },
      ]),
      // Overall condition counts
      Item.aggregate([
        {
          $group: {
            _id: '$currentCondition',
            count: { $sum: 1 },
          },
        },
      ]),
      // Department distribution of active equipment
      Item.aggregate([
        { $match: { status: 'Assigned' } },
        {
          $group: {
            _id: '$currentAssignment.department',
            count: { $sum: 1 },
            storeCount: {
              $sum: {
                $cond: [{ $eq: ['$currentAssignment.accountabilityType', 'Store'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Employee.aggregate([
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Unique employees holding items
    const employeesWithEquipment = await Item.distinct('currentAssignment.employee', {
      status: 'Assigned',
    });

    res.json({
      items: {
        total: totalItems,
        assigned: assignedItems,
        available: availableItems,
        maintenance: maintenanceItems,
      },
      employees: {
        total: totalEmployees,
        withActiveEquipment: employeesWithEquipment.filter(Boolean).length,
      },
      forms: {
        active: activeForms,
        returned: returnedForms,
        total: activeForms + returnedForms,
      },
      companies: companiesAgg.map((c) => ({
        company: c._id || 'Chawnah Foods Inc.',
        count: c.count,
      })),
      categories: categoriesAgg.map((c) => ({
        ...c,
        category: c._id || 'Uncategorized',
        count: c.total,
        assigned: c.issued,
      })),
      conditions: conditionsAgg,
      departments: departmentsAgg,
      recentActivity: recentHistory,
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: err.message });
  }
});

module.exports = router;

