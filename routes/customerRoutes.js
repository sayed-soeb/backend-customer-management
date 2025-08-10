// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  addCustomer,
  sendMessages,
  getCustomers,
  deleteCustomer,
  updateCustomer,
  usedAreas,
  getOldFollowUps,
  markAsContacted,
  searchFollowUps,
} = require('../controllers/customerController');

const customerController = require('../controllers/customerController');

// Existing routes...
router.post('/', auth, addCustomer);
router.post('/send-messages', auth, sendMessages);
router.get('/', auth, getCustomers);
router.delete('/:id', auth, deleteCustomer);
router.put('/:id', auth, updateCustomer);
router.get('/used-areas', usedAreas);
router.get('/followups', auth, getOldFollowUps);           
router.patch('/:id/contacted', auth, markAsContacted);        
router.get('/search', auth, searchFollowUps);
// Add reminder
router.post('/:customerId/reminders', customerController.addReminder);

// Get reminders by date (with pagination)
router.get('/reminders', customerController.getRemindersByDate);

// Update reminder
router.put('/:customerId/reminders/:reminderId', customerController.updateReminder);

// Delete reminder
router.delete('/:customerId/reminders/:reminderId', customerController.deleteReminder);


module.exports = router;
