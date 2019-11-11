const TokenModel = require('../../models/tokens.model');
const jwt = require('jsonwebtoken'),
    secret = require('../../../config/config.json').jwtSecret,
    crypto = require('crypto');

exports.validRefreshNeeded = (req, res, next) => {
  TokenModel.findByToken(req.body.refreshToken).then((token) => {
    if (token[0]) {
      req.body.userId = token[0].userId;
      return next();
    } else {
      return res.status(400).send({error: 'invalid refresh token'});
    }
  });
};

exports.validJWTNeeded = (req, res, next) => {
  if (req.headers['authorization']) {
    try {
      let authorization = req.headers['authorization'].split(' ');

      if (authorization[0] !== 'Bearer') {
        return res.status(401).send();
      } else {
        req.jwt = jwt.verify(authorization[1], secret);
        return next();
      }
    } catch (err) {
      return res.status(403).send();
    }
  } else {
    return res.status(401).send();
  }
};