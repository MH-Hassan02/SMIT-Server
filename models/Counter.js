// models/Counter.js
const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  sequenceName: {
    type: String,
    required: true,
    unique: true
  },
  sequenceValue: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Counter', CounterSchema);
