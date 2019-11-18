const AES = require('../utils/AES.utils'),
    moment = require('moment');

exports.validRecaptcha = (req, res, next) => {
  if (req.body.token) {
    try {
      let payload = JSON.parse(AES.decrypt(req.body.token));
      if (payload.a >= 800 && (moment().subtract(15, 'minutes').isBefore(moment(payload.bb))) && payload.ccc && payload.dddd) {
        return next();
      }
    } catch (e) {
      return res.status(500).send({error: 'Invalid captcha response, please try again.'});
    }
  }

  return res.status(400).send({error: 'Invalid captcha response, please try again.'});
};