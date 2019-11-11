const AuthorizationController = require('../controllers/authorization.controller');
const VerifyUserMiddleware = require('../common/middlewares/verify.user.middleware');
const AuthValidationMiddleware = require('../common/middlewares/auth.validation.middleware');

exports.routesConfig = function (app) {
  app.post('/authenticate', [
    AuthorizationController.validate('login'),
    VerifyUserMiddleware.isPasswordAndUserMatch,
    AuthorizationController.login
  ]);
  app.post('/authenticate/refresh', [
    AuthorizationController.validate('refresh'),
    AuthValidationMiddleware.validJWTNeeded,
    AuthValidationMiddleware.validRefreshNeeded,
    AuthorizationController.login
  ]);
};