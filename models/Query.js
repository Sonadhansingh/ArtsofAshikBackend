const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  inquiryType: { type: String,  },
  budget: { type: String,  },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Query = mongoose.model('Query', querySchema);

module.exports = { Query };