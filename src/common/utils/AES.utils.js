const crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    SITE_PUBLIC_KEY = '76gUjzeUnRjLM3ZDxUPU';

exports.decrypt = (text) => {
  let decipher = crypto.createDecipher(algorithm, SITE_PUBLIC_KEY);
  let dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
};