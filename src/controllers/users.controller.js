const crypto = require('crypto'),
    util = require('util'),
    sgMail = require('@sendgrid/mail'),
    { body, param, validationResult } = require('express-validator'),
    config = require('../../config/config.json');

const UserModel = require('../models/users.model'),
    VerificationModel = require('../models/verifications.model');

sgMail.setApiKey(config.email.apiKey);

exports.validate = (method) => {
  switch (method) {
    case 'insert': {
      return [ 
        body('username', 'Username doesn\'t exist')
          .exists()
          .isString()
          .isLength({ min: 2, max: 16 }).withMessage('Must be between 2 and 16 characters.')
          .custom(val => {
            return UserModel.findByUsername(val).then(users => {
              if (users.length > 0) return Promise.reject();
            });
          }).withMessage('Username already exists.'),
        body('email', 'Email doesn\'t exist')
          .exists()
          .isString()
          .isEmail().withMessage('Invalid format.')
          .isLength({ min: 5, max: 48 }).withMessage('Must be between 5 and 48 characters.')
          .custom(val => {
            return UserModel.findByEmail(val).then(users => {
              if (users.length > 0) return Promise.reject();
            });
          }).withMessage('Email already exists.'),
        body('password', 'password doesn\'t exist')
          .exists()
          .isString()
          .isLength({ min: 5, max: 60 }).withMessage('Must be between 5 and 60 characters.')
      ]   
    }

    case 'forgotPassword': {
      return [ 
        body('email', 'Email doesn\'t exist')
          .exists()
          .isString()
          .isEmail().withMessage('Invalid format.')
          .isLength({ min: 5, max: 48 }).withMessage('Must be between 5 and 48 characters.')
          .custom(val => {
            return UserModel.findByEmail(val).then(users => {
              if (users.length <= 0) return Promise.reject();
            });
          }).withMessage('Email doesn\'t exist.')
      ]  
    }

    case 'verifyEmailToken': {
      return [ 
        param('token')
          .exists()
          .isString()
          .custom(val => {
            return VerificationModel.findByTokenAndProvider(val, 'email').then(tokens => {
              if (tokens.length <= 0) return Promise.reject();
            });
          })
      ]  
    }
  }
}

exports.insert = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    let salt = crypto.randomBytes(16).toString('base64');
    let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest('base64');
  
    UserModel.createUser({
      username : req.body.username,
      email : req.body.email,
      password : hash,
      salt : salt
    }).then((user) => {
      let generatedToken = crypto.randomBytes(16).toString('hex');

      VerificationModel.createVerification({
        userId : user._id,
        provider : 'email',
        token : generatedToken
      })
      .then(() => {
        sgMail.send({
          to: req.body.email,
          from: config.email.templates.EMAIL_VERIFICATION.from,
          subject: config.email.templates.EMAIL_VERIFICATION.subject,
          text: util.format(config.email.templates.EMAIL_VERIFICATION.text, generatedToken),
          html: util.format(config.email.templates.EMAIL_VERIFICATION.html, generatedToken),
        })
        .then(() => res.status(201).send())
        .catch(() => res.status(500).send());
      })
      .catch(() => res.status(500).send());
    })
    .catch(() => res.status(500).send());
  }
};

exports.forgotPassword = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    VerificationModel.findByUserIdAndProvider(req.body.userId, 'password', true).then((data) => {
      if (!data[0] || data[0].created < (moment().subtract(5, 'minutes'))) {
        let generatedToken = crypto.randomBytes(16).toString('hex');

        sgMail.send({
          to: req.body.email,
          from: config.email.templates.FORGOT_PASSWORD.from,
          subject: config.email.templates.FORGOT_PASSWORD.subject,
          text: util.format(config.email.templates.FORGOT_PASSWORD.text, generatedToken),
          html: util.format(config.email.templates.FORGOT_PASSWORD.html, generatedToken),
        })
        .then(() => {
          if (!data[0]) {
            VerificationModel.createVerification({
              userId : req.body.userId,
              provider : 'password',
              token : generatedToken
            })
            .then(() => res.status(201).send({ sent : 1 }))
            .catch(() => res.status(500).send());
          } else {
            data[0].token = generatedToken;
            data[0].created = Date.now;
            data[0].save(() => res.status(201).send({ sent : 1 }))
              .catch(() => res.status(500).send());
          }
        })
        .catch(() => res.status(500).send());
      } else {
        res.status(201).send({ sent : 0 });
      }
    })
    .catch(() => res.status(500).send());
  }
};

exports.verifyEmailToken = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    VerificationModel.findByTokenAndProvider(req.params.token, 'email').then((tokens) => {
      if (tokens[0]) {

      } else {
        res.status(500).send();
      }
    })
    .catch(() => res.status(500).send());
  }
};