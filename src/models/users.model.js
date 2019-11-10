const mongoose = require('../common/services/mongoose.service').mongoose;
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  email: String,
  password: String,
  salt: String,
  permissionLevel: { type: Number, default: 1 },
  created: { type: Date, default: Date.now }
});

const User = mongoose.model('Users', userSchema);

exports.createUser = (userData) => {
  const user = new User(userData);
  return user.save();
};