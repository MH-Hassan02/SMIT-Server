const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  }
});

module.exports = mongoose.model("Venue", venueSchema);