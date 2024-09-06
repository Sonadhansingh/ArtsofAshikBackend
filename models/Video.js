const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  videoUrl: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Video', videoSchema);
