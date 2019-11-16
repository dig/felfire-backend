const ImagesController = require('../controllers/images.controller');
const AuthValidationMiddleware = require('../common/middlewares/auth.validation.middleware');

const multer = require('multer'),
      crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, (process.platform === "win32" ? './upload' : '/tmp/upload'));
  },
  filename: function (req, file, callback) {
    callback(null, `${crypto.randomBytes(16).toString('hex')}.${file.mimetype.substring(6)}`);
  }
});
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only allow .png file types.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

exports.routesConfig = function (app) {
  app.post('/upload', [
    AuthValidationMiddleware.validJWTNeeded,
    upload.single('image'),
    ImagesController.upload
  ]);
  app.get('/images/:imageId', [
    ImagesController.validate('image'),
    AuthValidationMiddleware.validJWTNeeded,
    ImagesController.image
  ]);
  app.get('/images/:imageId/node', [
    ImagesController.validate('image'),
    AuthValidationMiddleware.validJWTNeeded,
    ImagesController.imageNode
  ]);
};