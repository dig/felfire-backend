const { body, param, validationResult } = require('express-validator'),
      config = require('../../config/config.json'),
      fs = require('fs-extra'),
      moment = require('moment'),
      mongoose = require('mongoose'),
      crypto = require('crypto'),
      { promisify } = require('util'),
      imageToBase64 = require('image-to-base64'),
      imageSizeOf = promisify(require('image-size')),
      gm = require('gm');

const storage = require('../common/services/storage.service'),
      { CONTAINER } = require('../common/constants/storage.constants');

const ImageModel = require('../models/images.model'),
      NodeModel = require('../models/nodes.model');

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
          cdn_url : `https://cdn.felfire.app/${image.hash}.${image.type}`,
          type : image.type,
          created : image.created
        };

        if (image.thumbnail)
          response.thumb_url = `https://thumb.felfire.app/${image.hash}.jpg`;

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
            cdn_url : `https://cdn.felfire.app/${image.hash}.${image.type}`,
            type : image.type,
            created : image.created
          };

          if (image.thumbnail)
            response.thumb_url = `https://thumb.felfire.app/${image.hash}.jpg`;

          data.push(response);
        }
        
        res.status(200).send(data);
      })
      .catch(() => res.status(500).send());
  };
};

exports.upload = async (req, res) => {
  let fileType = req.file.mimetype.substring(6);
  let filePath = `${req.file.destination}/${req.file.filename}`;

  try {
    let base64 = await imageToBase64(filePath);
    let dimensions = await imageSizeOf(filePath);
    
    let hash = crypto.createHash('md5').update(`${base64}${req.jwt.userId}${moment().valueOf()}`).digest('hex');
    let thumbnail = dimensions.width > config.thumbnail.width || dimensions.height > config.thumbnail.height;

    if (thumbnail) {
      let thumbnailPath = `${req.file.destination}/${hash}-thumbnail.jpg`;

      await new Promise((resolve, reject) => {
        gm(filePath)
          .resize(config.thumbnail.width, config.thumbnail.height, '^')
          .gravity('Center')
          .crop(config.thumbnail.width, config.thumbnail.height)
          .quality(config.thumbnail.quality)
          .write(thumbnailPath, function (err) {
            if (err) reject(err);
            resolve();
          });
      });

      await storage.put(thumbnailPath, CONTAINER.THUMBNAIL, `${hash}.jpg`);
      await fs.remove(thumbnailPath);
    }

    await storage.put(filePath, CONTAINER.MAIN, `${hash}.${fileType}`);
    await fs.remove(filePath);

    await ImageModel.createImage({
      hash : hash,
      type : fileType,
      size : req.file.size,
      thumbnail : thumbnail,
      name : req.file.filename,
      userId : mongoose.Types.ObjectId(req.jwt.userId),
      node : config.node.name
    });

    res.status(201).send({
      id : hash,
      url : `https://felfire.app/${hash}`,
      cdn_url : `https://cdn.felfire.app/${hash}.${fileType}`,
      type : fileType
    });
  } catch (error) {
    console.error(error);

    fs.remove(filePath);
    res.status(500).send();
  }
};