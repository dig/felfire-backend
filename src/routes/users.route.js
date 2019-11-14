const UsersController = require('../controllers/users.controller');
const AuthValidationMiddleware = require('../common/middlewares/auth.validation.middleware');

exports.routesConfig = function (app) {
  app.post('/users', [
    UsersController.validate('insert'),
    UsersController.insert
  ]);
  app.post('/users/forgot/password', [
    UsersController.validate('forgotPassword'),
    UsersController.forgotPassword
  ]);
  app.get('/email-verify/:token', [
    UsersController.validate('verifyEmailToken'),
    UsersController.verifyEmailToken
  ]);
};