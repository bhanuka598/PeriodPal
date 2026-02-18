const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: Number, required: true },
    passwordHash: { type: String, required: true }
  }
);

module.exports = mongoose.model("User", userSchema);
