const mongoose = require("mongoose");

const balanceSchema = new mongoose.Schema({
  email: String,
  balance: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

const Balance = mongoose.model("Balance", balanceSchema);

module.exports = {
  UserBalances: Balance,
};
