const { body, param, validationResult } = require('express-validator'),
      config = require('../../config/config.json'),
      fs = require('fs-extra'),
      moment = require('moment'),
      mongoose = require('mongoose'),
      crypto = require('crypto'),
      imageToBase64 = require('image-to-base64');

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
  }
};

exports.image = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
  } else {
    ImageModel.findOneByIdAndUserId(req.params.imageId, req.jwt.userId).then((image) => {
      if (image) {
        res.status(200).send({
          id : image._id,
          url : `https://felfire.app/${image._id}`,
          direct_url : `https://cdn.felfire.app/${image._id}.${image.type}`,
          type : image.type,
          created : image.created
        });
      } else {
        res.status(404).send();
      }
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
      ImageModel.findOneById(req.params.imageId).then((image) => {
        if (image) {
          NodeModel.findOneByName(image.node).then((node) => {
            if (node) {
              res.status(200).send({
                node : {
                  name : image.node,
                  host : node.host
                },
                image : {
                  id : image._id,
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
  let path = `${date.format('YYYY')}/${date.format('M')}/${date.format('d')}`;

  let moveFrom = `${req.file.destination}/${req.file.filename}`;
  let moveTo = (process.platform === "win32" ? `./storage/${path}` : `/home/storage/${path}`);

  imageToBase64(moveFrom).then((base64) => {
    let hash = crypto.createHash('md5').update(base64 + req.body.userId + Date.now).digest('hex');

    fs.move(moveFrom, `${moveTo}/${hash}.${fileType}`)
      .then(() => ImageModel.createImage({
        hash : hash,
        type : fileType,
        name : req.file.filename,
        userId : mongoose.Types.ObjectId(req.body.userId),
        node : config.node.name,
        nodePath : path
      }))
      .then(() => res.status(201).send())
      .catch((err) => res.status(500).send());
  });
};