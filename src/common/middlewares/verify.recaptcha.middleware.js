const { v3 } = require('recaptcha3');

exports.validRecaptcha = (req, res, next) => {
  v3(req).then((data) => {
    if (data.success && data.score >= 0.5) {
      next();
    } else {
      res.status(400).send({error: 'Invalid recaptcha token or too low score.'});
    }
  });
};