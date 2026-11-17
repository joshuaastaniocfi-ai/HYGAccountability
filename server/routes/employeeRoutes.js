const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const AccountabilityRecord = require('../models/AccountabilityRecord');

// GET /api/employees/meta/brands - Get list of unique brands with employee counts
router.get('/meta/brands', async (req, res) => {
  try {
    const list = await Employee.aggregate([
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(list.map((b) => ({ name: b._id, count: b.count })));
  } catch (err) {
    console.error('Error fetching brands:', err);
    res.status(500).json({ message: 'Failed to fetch brands', error: err.message });
  }
});

// GET /api/employees/meta/companies - Get list of unique companies with employee counts
router.get('/meta/companies', async (req, res) => {
  try {
    const list = await Employee.aggregate([
      {
        $group: {
          _id: { company: '$company', brand: '$brand', legalOwner: '$legalOwnerCompany' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    res.json(
      list.map((c) => ({
        name: c._id.company,
        brand: c._id.brand,
        legalOwner: c._id.legalOwner,
        count: c.count,
      }))
    );
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ message: 'Failed to fetch companies', error: err.message });
  }
});

// GET /api/employees - Get all employees with active and total accountability counts
router.get('/', async (req, res) => {
  try {
    const { search, department, status, company, brand } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    if (brand && brand !== 'All') {
      query.brand = brand;
    }

    if (company && company !== 'All') {
      query.company = company;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const employees = await Employee.find(query).sort({ name: 1 }).lean();

    // Attach active and total accountability summary count for each employee
    const employeeIds = employees.map((e) => e._id);
    const records = await AccountabilityRecord.find({
      employee: { $in: employeeIds },
    }).lean();

    const employeesWithCounts = employees.map((emp) => {
      const empRecords = records.filter(
        (r) => r.employee.toString() === emp._id.toString()
      );
      
      let activeItemsCount = 0;
      let returnedItemsCount = 0;

      empRecords.forEach((rec) => {
        rec.items.forEach((item) => {
          if (item.status === 'Active') {
            activeItemsCount += 1;
          } else {
            returnedItemsCount += 1;
          }
        });
      });

      return {
        ...emp,
        activeAccountabilitiesCount: empRecords.filter((r) => r.status === 'Active' || r.status === 'Partially Returned').length,
        activeItemsCount,
        returnedItemsCount,
        totalFormsCount: empRecords.length,
      };
    });

    res.json(employeesWithCounts);
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ message: 'Failed to fetch employees', error: err.message });
  }
});

// GET /api/employees/:id - Get single employee details with all active and non-active accountability records
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Fetch all accountability records for this employee
    const records = await AccountabilityRecord.find({ employee: employee._id })
      .populate('items.item')
      .sort({ createdAt: -1 })
      .lean();

    // Separate active and non-active records & items
    const activeRecords = [];
    const pastRecords = [];

    records.forEach((record) => {
      const hasActiveItems = record.items.some((item) => item.status === 'Active');
      if (hasActiveItems) {
        activeRecords.push(record);
      } else {
        pastRecords.push(record);
      }
    });

    // Also build a flat list of individual active and non-active items for easy tab view
    const activeItems = [];
    const returnedItems = [];

    records.forEach((record) => {
      record.items.forEach((item) => {
        const itemInfo = {
          recordId: record._id,
          formNumber: record.formNumber,
          issuanceDate: record.issuance.date,
          releasedBy: record.issuance.releasedBy,
          approvedBy: record.issuance.approvedBy,
          ...item,
        };

        if (item.status === 'Active') {
          activeItems.push(itemInfo);
        } else {
          returnedItems.push(itemInfo);
        }
      });
    });

    res.json({
      employee,
      activeRecords,
      pastRecords,
      activeItems,
      returnedItems,
      summary: {
        totalForms: records.length,
        activeItemsCount: activeItems.length,
        returnedItemsCount: returnedItems.length,
      },
    });
  } catch (err) {
    console.error('Error fetching employee detail:', err);
    res.status(500).json({ message: 'Failed to fetch employee details', error: err.message });
  }
});

// POST /api/employees - Create new employee
router.post('/', async (req, res) => {
  try {
    const {
      employeeId,
      name,
      firstName,
      middleName,
      lastName,
      suffix,
      company,
      jobTitle,
      department,
      email,
      phone,
      status,
      notes,
    } = req.body;

    // Check if employeeId already exists
    const existing = await Employee.findOne({ employeeId: employeeId.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: `Employee ID "${employeeId}" already exists.` });
    }

    const newEmployee = new Employee({
      employeeId: employeeId.trim().toUpperCase(),
      name: name.trim(),
      firstName: firstName ? firstName.trim() : undefined,
      middleName: middleName ? middleName.trim() : '',
      lastName: lastName ? lastName.trim() : undefined,
      suffix: suffix ? suffix.trim() : '',
      company: company ? company.trim() : 'Chawnah Foods Inc.',
      jobTitle: jobTitle.trim(),
      department: department.trim(),
      email: email ? email.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      status: status || 'Active',
      notes: notes ? notes.trim() : '',
    });

    const saved = await newEmployee.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(400).json({ message: 'Failed to create employee', error: err.message });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(400).json({ message: 'Failed to update employee', error: err.message });
  }
});

// DELETE /api/employees/:id - Delete employee (if no active assignments or force=true)
router.delete('/:id', async (req, res) => {
  try {
    const isForce = req.query.force === 'true';
    const activeRecords = await AccountabilityRecord.findOne({
      employee: req.params.id,
      status: { $in: ['Active', 'Partially Returned'] },
    });

    if (activeRecords && !isForce) {
      return res.status(400).json({
        message: 'Cannot delete employee while they have active equipment accountabilities. Please return all equipment first, or confirm force delete.',
        hasActive: true,
      });
    }

    if (activeRecords && isForce) {
      await AccountabilityRecord.updateMany(
        { employee: req.params.id },
        { $set: { remarks: 'Assigned employee was removed/deleted from system.' } }
      );
    }

    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ message: 'Failed to delete employee', error: err.message });
  }
});

module.exports = router;

