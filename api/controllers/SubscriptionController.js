const _ = require('lodash');
const Promise = require('bluebird');

module.exports = {
  subscribe: (req, res) => {
    if (_.isUndefined(req.body.requestor) || !_.isString(req.body.requestor)) {
      return res.send(400, { success: false, message: 'Requestor must specified and must be string' });
    }

    if (_.isUndefined(req.body.target) || !_.isString(req.body.target)) {
      return res.send(400, { success: false, message: 'Target must specified and must be string' });
    }

    const requestorEmail = req.body.requestor;
    const targetEmail = req.body.target;
    let requestor, target;
    const targetDoesNotExistErrorMsg = 'Subscription target does not exist';
    const subscriptionExistsErrorMsg = 'Subscription already exists';

    return Friend.find({
      email: [ requestorEmail, targetEmail ]
    })
    .then(friends => {
      requestor = _.find(friends, { email: requestorEmail });
      target = _.find(target, { email: targetEmail });

      // target must exist, do not create a new friend for target
      if (_.isUndefined(target)) {
        throw new Error(targetDoesNotExistErrorMsg);
      }

      // create a new friend for requestor the same way we create new friends for a new friendship
      const promises = [
        requestor || Friend.create({ email: requestorEmail }),
        target
      ];

      return Promise.all(promises);
    })
    .spread((requestorObj, targetObj) => {
      requestor = requestorObj;

      return Subscription.find({
        subscriber: requestorObj.id,
        target: targetObj.id
      });
    })
    .then(subscription => {
      if (!_.isEmpty(subscription)) {
        throw new Error(subscriptionExistsErrorMsg); 
      }

      return Subscription.create({
        subscriber: requestor.id,
        target: target.id
      });
    })
    .then(subscription => {
      if (_.isObject(subscription)) {
        res.send(200, { success: true });
      } else {
        throw new Error('Unknown error occurred');
      }
    })
    .catch(e => {
      if (e.message === subscriptionExistsErrorMsg) {
        res.send(400, { success: false, message: subscriptionExistsErrorMsg }); 
      } else {
        res.serverError(e);
      }
    });
  },
};

