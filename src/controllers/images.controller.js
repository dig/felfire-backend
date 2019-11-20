const { body, param, validationResult } = require('express-validator'),
      config = require('../../config/config.json'),
      fs = require('fs-extra'),
      moment = require('moment'),
      mongoose = require('mongoose'),
      crypto = require('crypto'),
      imageToBase64 = require('image-to-base64'),
      { promisify } = require('util'),
      imageSizeOf = promisify(require('image-size')),
      gm = require('gm');

const ImageModel = require('../models/images.model');
const NodeModel = require('../models/nodes.model');

exports.validate = (method) => {
  switch (method) {
    case 'image': {
      return [ 
        param('imageId', 'Image ID doesn\'t exist.')
          .exists()
      ]
    }

    case 'images': {
      return [ 
        body('page', 'Page doesn\'t exist.')
          .exists()
          .isNumeric().withMessage('Page is not a number.')
          .isInt({ min: 1 }).withMessage('Page must be 1 or higher.'),
        body('count', 'Count doesn\'t exist.')
          .exists()
          .isNumeric().withMessage('Count is not a number.')
          .isInt({ min: 1, max: 100 }).withMessage('Count must be between 1 and 100.'),
      ]   
    }
  }
};

exports.image = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    ImageModel.findOneByIdAndUserId(req.params.imageId, req.jwt.userId).then((image) => {
      if (image) {
        let response = {
          id : image.hash,
          url : `https://felfire.app/${image.hash}`,
          cdn_url : `https://cdn.felfire.app/${image.hash}`,
          type : image.type,
          created : image.created
        };

        if (image.thumbnail)
          response.thumb_url = `https://thumb.felfire.app/${image.hash}`;

        res.status(200).send(response);
      } else {
        res.status(404).send();
      }
    })
    .catch(() => res.status(500).send());
  };
};

exports.images = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    let skip = req.body.count * (req.body.page - 1);
    let limit = parseInt(req.body.count);

    ImageModel.findByUserId(req.jwt.userId)
      .sort({created: -1})
      .skip(skip)
      .limit(limit)
      .then((images) => {
        let data = [];

        for (let i = 0; i < images.length; i++) {
          let image = images[i];
          let response = {
            id : image.hash,
            url : `https://felfire.app/${image.hash}`,
            cdn_url : `https://cdn.felfire.app/${image.hash}`,
            type : image.type,
            created : image.created
          };

          if (image.thumbnail)
            response.thumb_url = `https://thumb.felfire.app/${image.hash}`;

          data.push(response);
        }
        
        res.status(200).send(data);
      })
      .catch(() => res.status(500).send());
  };
};

exports.imageNode = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    if (req.jwt.lookupImage) {
      ImageModel.findOneByHash(req.params.imageId).then((image) => {
        if (image) {
          NodeModel.findOneByName(image.node).then((node) => {
            if (node) {
              res.status(200).send({
                node : {
                  name : image.node,
                  host : node.host
                },
                image : {
                  id : image.hash,
                  type : image.type
                },
                path : image.nodePath
              });
            } else {
              res.status(404).send();
            }
          })
          .catch(() => res.status(500).send());
        } else {
          res.status(404).send();
        }
      })
      .catch(() => res.status(500).send());
    } else {
      res.status(401).send();
    }
  };
};

exports.upload = (req, res) => {
  let date = moment();

  let fileType = req.file.mimetype.substring(6);
  let path = `${date.format('YYYY')}/${date.format('M')}/${date.format('D')}`;

  let moveFrom = `${req.file.destination}/${req.file.filename}`;
  let moveTo = (process.platform === "win32" ? `./storage/${path}` : `/home/storage/${path}`);

  imageToBase64(moveFrom).then((base64) => {
    imageSizeOf(moveFrom).then(dimensions => {
      let hash = crypto.createHash('md5').update(`${base64}${req.jwt.userId}${date.valueOf()}`).digest('hex');
      let shouldGenerateThumbnail = dimensions.width > config.thumbnail.width || dimensions.height > config.thumbnail.height;

      fs.move(moveFrom, `${moveTo}/${hash}.${fileType}`)
        .then(() => fs.ensureDir(`${moveTo}/thumbnail`))
        .then(() => (shouldGenerateThumbnail ? 
          new Promise((resolve, reject) => {
              gm(`${moveTo}/${hash}.${fileType}`)
                .resize(config.thumbnail.width, config.thumbnail.height, '^')
                .gravity('Center')
                .crop(config.thumbnail.width, config.thumbnail.height)
                .quality(90)
                .write(`${moveTo}/thumbnail/${hash}.jpg`, function (err) {
                  if (err) reject(err);
                  resolve();
                })
          })
         : null))
        .then(() => ImageModel.createImage({
          hash : hash,
          type : fileType,
          size : req.file.size,
          thumbnail : shouldGenerateThumbnail,
          name : req.file.filename,
          userId : mongoose.Types.ObjectId(req.jwt.userId),
          node : config.node.name,
          nodePath : path
        }))
        .then(() => res.status(201).send({
          id : hash,
          url : `https://felfire.app/${hash}`,
          cdn_url : `https://cdn.felfire.app/${hash}`,
          type : fileType
        }))
        .catch((err) => res.status(500).send());
    });
  });
};