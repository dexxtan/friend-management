const _ = require('lodash');
const Promise = require('bluebird');

module.exports = {
  block: (req, res) => {
    if (_.isUndefined(req.body.requestor) || !_.isString(req.body.requestor)) {
      return res.send(400, { success: false, message: 'Requestor must specified and must be string' });
    }

    if (_.isUndefined(req.body.target) || !_.isString(req.body.target)) {
      return res.send(400, { success: false, message: 'Target must specified and must be string' });
    }

    const requestorEmail = req.body.requestor;
    const targetEmail = req.body.target;
    let requestor, target;
    const blockExistsErrorMsg = 'Block already exists';

    return Friend.find({
      email: [ requestorEmail, targetEmail ]
    })
    .then(friends => {
      // return the friend objects found or create friends if they do not exist
      const promises = [
        _.find(friends, { email: requestorEmail }) || Friend.create({ email: requestorEmail }),
        _.find(target, { email: targetEmail }) || Friend.create({ email: targetEmail })
      ];

      return Promise.all(promises);
    })
    .spread((requestorObj, targetObj) => {
      requestor = requestorObj;
      target = targetObj;

      return Block.find({
        blocker: requestorObj.id,
        target: targetObj.id
      });
    })
    .then(block => {
      if (!_.isEmpty(block)) {
        throw new Error(blockExistsErrorMsg); 
      }

      return Block.create({
        blocker: requestor.id,
        target: target.id
      });
    })
    .then(block => {
      if (_.isObject(block)) {
        res.send(200, { success: true });
      } else {
        throw new Error('Unknown error occurred');
      }
    })
    .catch(e => {
      if (e.message === blockExistsErrorMsg) {
        res.send(400, { success: false, message: blockExistsErrorMsg }); 
      } else {
        res.serverError(e);
      }
    });
  },
};

