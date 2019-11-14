const crypto = require('crypto'),
    path = require('path'),
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
        body('username', 'Username doesn\'t exist.')
          .exists()
          .isString()
          .isLength({ min: 2, max: 16 }).withMessage('Username must be between 2 and 16 characters.')
          .custom(val => {
            return UserModel.findByUsername(val).then(users => {
              if (users.length > 0) return Promise.reject();
            });
          }).withMessage('Username already exists.'),
        body('email', 'Email doesn\'t exist.')
          .exists()
          .isString()
          .isEmail().withMessage('Invalid email format.')
          .isLength({ min: 5, max: 48 }).withMessage('Email must be between 5 and 48 characters.')
          .custom(val => {
            return UserModel.findByEmail(val).then(users => {
              if (users.length > 0) return Promise.reject();
            });
          }).withMessage('Email already exists.'),
        body('password', 'Password doesn\'t exist.')
          .exists()
          .isString()
          .isLength({ min: 5, max: 60 }).withMessage('Password must be between 5 and 60 characters.')
      ]   
    }

    case 'forgotPassword': {
      return [ 
        body('email', 'Email doesn\'t exist.')
          .exists()
          .isString()
          .isEmail().withMessage('Invalid email format.')
          .isLength({ min: 5, max: 48 }).withMessage('Email must be between 5 and 48 characters.')
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
              if (tokens.length <= 0 || tokens[0].used) return Promise.reject();
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

    let generatedToken = crypto.randomBytes(16).toString('hex');

    UserModel.createUser({
      username : req.body.username,
      email : req.body.email,
      password : hash,
      salt : salt
    }).then((user) => VerificationModel.createVerification({
      userId : user._id,
      provider : 'email',
      token : generatedToken
    }))
    .then(() => sgMail.send({
      to: req.body.email,
      from: config.email.templates.EMAIL_VERIFICATION.from,
      templateId: config.email.templates.EMAIL_VERIFICATION.templateId,
      dynamic_template_data: {
        username: req.body.username,
        verify_link: `https://api.felfire.app/email-verify/${generatedToken}`
      },
    }))
    .then(() => res.status(201).send())
    .catch(() => res.status(500).send());
  }
};

exports.forgotPassword = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    UserModel.findByEmail(req.body.email)
      .then((users) => VerificationModel.findByUserIdAndProvider(users[0]._id, 'password').then((data) => {
        if (data.length <= 0) {
          let generatedToken = crypto.randomBytes(16).toString('hex');
  
          sgMail.send({
            to: users[0].email,
            from: config.email.templates.FORGOT_PASSWORD.from,
            templateId: config.email.templates.FORGOT_PASSWORD.templateId,
            dynamic_template_data: {
              username: users[0].username,
              reset_link: `https://api.felfire.app/password-reset/${generatedToken}`
            },
          })
          .then(() => VerificationModel.createVerification({
            userId : users[0]._id,
            provider : 'password',
            token : generatedToken
          }))
          .then(() => res.status(201).send({sent : 1}))
          .catch(() => res.status(500).send());
        } else {
          res.status(201).send({sent : 0});
        }
      }))
      .catch(() => res.status(500).send());
  }
};

exports.verifyEmailToken = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.sendFile(path.join(__dirname + '/../views/email-verification-error.html'));
  } else {
    VerificationModel.findByTokenAndProvider(req.params.token, 'email', true).then((tokens) => {
      if (tokens[0]) {
        tokens[0].used = true;
        tokens[0].save()
          .then(() => UserModel.verified(tokens[0].userId))
          .then(() => res.sendFile(path.join(__dirname + '/../views/email-verification.html')))
          .catch(() => res.sendFile(path.join(__dirname + '/../views/email-verification-error.html')));
      } else {
        res.sendFile(path.join(__dirname + '/../views/email-verification-error.html'))
      }
    })
    .catch(() => res.sendFile(path.join(__dirname + '/../views/email-verification-error.html')));
  }
};