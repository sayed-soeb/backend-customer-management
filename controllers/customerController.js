const Customer = require('../models/Customer');
const { sendBulkMessages } = require('../services/messageService');

exports.addCustomer = async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.json({ message: 'Customer added' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.usedAreas = async (req, res) => {
  try {
    const customers = await Customer.find({}, 'district taluk gram');
    const usedAreas = customers.map(c => ({
      district: c.district,
      taluk: c.taluk,
      village: c.gram
    }));
    res.json(usedAreas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET: Customers whose lastContacted is older than 3 months
exports.getOldFollowUps = async (req, res) => {
  try {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const customers = await Customer.find({ lastContacted: { $lte: threeMonthsAgo } });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Follow-up list fetch karne mein error aayi' });
  }
};

// PATCH: Mark as contacted today
exports.markAsContacted = async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      { lastContacted: new Date() },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Contacted update karne mein error aayi' });
  }
};

// GET: Search (name, mobile, email, district, taluk, gram, product)
exports.searchFollowUps = async (req, res) => {
  try {
    const { q } = req.query;

    const query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { mobile: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { district: { $regex: q, $options: 'i' } },
        { taluk: { $regex: q, $options: 'i' } },
        { gram: { $regex: q, $options: 'i' } },
        { 'products.name': { $regex: q, $options: 'i' } }
      ],
      lastContacted: { $lte: new Date(new Date().setMonth(new Date().getMonth() - 3)) }
    };

    const customers = await Customer.find(query);
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Search mein problem aayi' });
  }
};

exports.sendMessages = async (req, res) => {
  const { district, message } = req.body;

  console.log('📥 Incoming request to send messages');
  console.log('Payload:', { district, message });

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  let customers = [];
  try {
    if (district === 'all') {
      customers = await Customer.find({});
      console.log(`📍 Sending to ALL districts — Total customers: ${customers.length}`);
    } else {
      customers = await Customer.find({ district });
      console.log(`📍 Sending to district: ${district} — Total customers: ${customers.length}`);
    }

    if (customers.length === 0) {
      return res.status(404).json({ error: 'No customers found for the specified district' });
    }

    await sendBulkMessages(customers, message);
    res.json({ message: 'Messages sent successfully' });

  } catch (err) {
    console.error('❌ Error while sending messages:', err.message || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const query = {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { taluk: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { product: { $regex: search, $options: 'i' } },
      ]
    };

    const customers = await Customer.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      data: customers,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Add reminder to a customer
exports.addReminder = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { date, about } = req.body;

    if (!date || !about) {
      return res.status(400).json({ error: 'Date and About are required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    customer.reminders.push({ date, about });
    await customer.save();

    res.json({ message: 'Reminder added successfully', customer });
  } catch (err) {
    console.error('❌ Error adding reminder:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Get customers with reminders on a specific date + pagination
exports.getRemindersByDate = async (req, res) => {
  try {
    const { date, page = 1, limit = 10 } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date query parameter is required' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const customers = await Customer.find({
      reminders: {
        $elemMatch: {
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      }
    })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments({
      reminders: {
        $elemMatch: {
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      }
    });

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      customers
    });
  } catch (err) {
    console.error('❌ Error fetching reminders:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateReminder = async (req, res) => {
  try {
    const { customerId, reminderId } = req.params;
    const { date, about } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const reminder = customer.reminders.id(reminderId);
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    // Update only the fields sent from frontend
    if (date) reminder.date = new Date(date);
    if (about) reminder.about = about;

    await customer.save();

    res.json({ message: 'Reminder updated successfully', customer });
  } catch (err) {
    console.error('❌ Error updating reminder:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


// ✅ Delete a specific reminder
exports.deleteReminder = async (req, res) => {
  try {
    const { customerId, reminderId } = req.params;

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { $pull: { reminders: { _id: reminderId } } },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Reminder deleted successfully', customer });
  } catch (err) {
    console.error('❌ Error deleting reminder:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.updateCustomer = async (req, res) => {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


