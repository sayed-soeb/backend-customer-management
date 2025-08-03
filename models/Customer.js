const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: Date, required: true }
});

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  mobile: { type: String, required: true },
  address: String,
  state: String,
  district: String,
  taluk: String,
  gram: String,
  village: String,
  products: [productSchema],
  lastContacted: {
    type: Date,
    default: () => new Date()
  }
});

// Auto-update `lastContacted` when document is updated
customerSchema.pre('findOneAndUpdate', function (next) {
  this.set({ lastContacted: new Date() });
  next();
});

module.exports = mongoose.model('Customer', customerSchema);
