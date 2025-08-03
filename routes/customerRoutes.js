const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
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
  searchFollowUps
} = require('../controllers/customerController');

// Routes
router.post('/', auth, addCustomer);
router.post('/send-messages', auth, sendMessages);
router.get('/', auth, getCustomers); // includes search already
router.delete('/:id', auth, deleteCustomer);
router.put('/:id', auth, updateCustomer);
router.get('/used-areas', usedAreas);
router.get('/followups', auth, getOldFollowUps);           
router.patch('/:id/contacted', auth, markAsContacted);        
router.get('/search', auth, searchFollowUps);                

module.exports = router;
