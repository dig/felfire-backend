const UsersController = require('../controllers/users.controller');
const VerifyRecaptchaMiddleware = require('../common/middlewares/verify.recaptcha.middleware');

exports.routesConfig = function (app) {
  app.post('/users', [
    VerifyRecaptchaMiddleware.validRecaptcha,
    UsersController.validate('insert'),
    UsersController.insert
  ]);
  app.post('/users/forgot/password', [
    VerifyRecaptchaMiddleware.validRecaptcha,
    UsersController.validate('forgotPassword'),
    UsersController.forgotPassword
  ]);
  app.get('/email-verify/:token', [
    UsersController.validate('verifyEmailToken'),
    UsersController.verifyEmailToken
  ]);
};