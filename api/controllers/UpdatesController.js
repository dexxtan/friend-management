const _ = require('lodash');
const Promise = require('bluebird');

module.exports = {
  subscribe: (req, res) => {
    if (_.isUndefined(req.body.requestor) || !_.isString(req.body.requestor) || !EmailService.isEmail(req.body.requestor)) {
      return res.send(400, { success: false, message: 'Requestor must specified and must be a valid email address' });
    }

    if (_.isUndefined(req.body.target) || !_.isString(req.body.target) || !EmailService.isEmail(req.body.target)) {
      return res.send(400, { success: false, message: 'Target must specified and must be a valid email address' });
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
      target = _.find(friends, { email: targetEmail });

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
    .then(subscriptions => {
      if (!_.isEmpty(subscriptions)) {
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

  block: (req, res) => {
    if (_.isUndefined(req.body.requestor) || !_.isString(req.body.requestor) || !EmailService.isEmail(req.body.requestor)) {
      return res.send(400, { success: false, message: 'Requestor must specified and must be a valid email address' });
    }

    if (_.isUndefined(req.body.target) || !_.isString(req.body.target) || !EmailService.isEmail(req.body.target)) {
      return res.send(400, { success: false, message: 'Target must specified and must be a valid email address' });
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
        _.find(friends, { email: targetEmail }) || Friend.create({ email: targetEmail })
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
    .then(blocks => {
      if (!_.isEmpty(blocks)) {
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

  update: (req, res) => {
    if (_.isUndefined(req.body.sender) || !_.isString(req.body.sender) || !EmailService.isEmail(req.body.sender)) {
      return res.send(400, { success: false, message: 'Sender must specified and must be a valid email address' });
    }

    if (_.isUndefined(req.body.text) || !_.isString(req.body.text)) {
      return res.send(400, { success: false, message: 'Text to send must specified and must be a string' });
    }

    const senderEmail = req.body.sender;
    const text = req.body.text;
    const senderDoesNotExistErrorMsg = 'Sender specified does not exist';
    let senderRef;

    return Friend.findOne({
      email: senderEmail
    })
    .then(sender => {
      if (_.isUndefined(sender)) {
        throw new Error(senderDoesNotExistErrorMsg);
      }

      senderRef = sender;

      return Promise.all([
        Block.find({
          target: senderEmail
        }),
        Friendship.find({
          or: [{
            friendor: senderEmail
          }, {
            friendee: senderEmail
          }]
        }),
        Subscription.find({
          target: senderEmail
        })
      ])
    })
    .spread((blocks, friendships, subscriptions) => {
      const textParts = text.split(' ');
      const mentionedEmails = [];

      for (let i = 0; i < textParts.length; i++) {
        // strip off @ mention if the user puts @ infront like: @example@email.com
        if (textParts[i].charAt(0) === '@') {
          textParts[i] = textParts[i].substring(1);
        }

        if (EmailService.isEmail(textParts[i])) {
          mentionedEmails.push(textParts[i]);
        }
      }

      const existingIDs = {};
      const targetFriendIDs = [];

      // create an array of targetFriendIDs that has unique friendIDs
      subscriptions.map(subscription => {
        existingIDs[subscription.subscriber] = true;
        targetFriendIDs.push(subscription.subscriber);
      });
      friendships.map(friendship => {
        let friendID;
        if (friendship.friendor === senderRef.id) {
          friendID = friendship.friendee;
        } else {
          friendID = friendship.friendor;
        }

        if (_.isUndefined(existingIDs[friendID])) {
          existingIDs[friendID] = true;
          targetFriendIDs.push(friendID);
        }
      });

      // separate filtering blocked IDs from combining subscribedIDs and friendIDs
      const blockedIDs = blocks.map(block => block.blocker);
      const nonBlockedFriendIDs = targetFriendIDs.filter(friendID => blockedIDs.indexOf(friendID) === -1);

      return Friend.find({
        or: [{
          id: nonBlockedFriendIDs
        }, {
          email: mentionedEmails
        }]
      });
    })
    .then(friends => {
      const emailList = friends.map(friend => friend.email);

      res.send(200, {
        success: true,
        receipients: emailList
      });
    })
    .catch(e => {
      if (e.message === blockExistsErrorMsg) {
        res.send(400, { success: false, message: blockExistsErrorMsg }); 
      } else {
        res.serverError(e);
      }
    });
  }
};

