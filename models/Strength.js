
const mongoose = require('mongoose');

const strengthSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
});

const Skill = mongoose.model('Strength', strengthSchema);

module.exports = Skill;
