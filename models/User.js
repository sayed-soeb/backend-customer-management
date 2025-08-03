const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  try {
    if (this.isModified('password')) {
      const hashed = await bcrypt.hash(this.password, 10);
      this.password = hashed;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
