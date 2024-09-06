
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
});

const Skill = mongoose.model('Skills', skillSchema);

module.exports = Skill;
