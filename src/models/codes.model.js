const mongoose = require('../common/services/mongoose.service').mongoose;
const Schema = mongoose.Schema;

const codeSchema = new Schema({
  type: { type: String, required: true },
  code: { type: String, required: true },
  used: { type: Boolean, default: false },
  createdBy: { type: String, required: true },
  created: { type: Date, default: Date.now }
});

const Code = mongoose.model('Codes', codeSchema);

exports.findByTypeAndCode = (type, code) => {
  return Code.findOne({
    type: type,
    code: code,
    used: false
  });
};

exports.used = (code) => {
  return Code.updateOne({
    code : code
  }, {
    $set : { 
      used : true
    }
  });
};