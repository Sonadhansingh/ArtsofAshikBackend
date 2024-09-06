const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  pdfUrl: { type: String, required: true }
});

module.exports = mongoose.model('Scripts', scriptSchema);
