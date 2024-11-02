const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  url: { type: String, required: true },
  s3Key: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Imageroll', imageSchema);
