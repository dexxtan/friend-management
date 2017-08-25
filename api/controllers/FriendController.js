const _ = require('lodash');
const Promise = require('bluebird');

module.exports = {
	connect: (req, res) => {
    if (!_.isArray(req.body.friends)) {
      return res.send(400, { success: false, message: 'An array of friends must be specified to be connected' });
    }

    if (req.body.friends.length != 2) {
      return res.send(400, { success: false, message: 'We only allow 2 friends to be connected each time' });
    }

    const friendList = req.body.friends;
    let user1, user2;

    return Friend.find({
      email: friendList // search for both users by passing array into the find criteria
    })
    .then(users => {
      // return the user object found or create users if they do not exist
      const promises = [
        _.find(users, { email: friendList[0] }) || Friend.create({ email: friendList[0] }),
        _.find(users, { email: friendList[1] }) || Friend.create({ email: friendList[1] })
      ];

      return Promise.all(promises);
    })
    .spread((userResult1, userResult2) => {
      user1 = userResult1;
      user2 = userResult2;

      return Friendship.find({
        or: [{
          friendor: user1.id,
          friendee: user2.id
        }, {
          friendor: user2.id,
          friendee: user1.id
        }]
      });
    })
    .then(friendship => {
      if (!_.isEmpty(friendship)) {
        return 'Friendship already exists' ; // return message to indicate no new friendship was created
      }

      return Friendship.create({
        friendor: user1.id,
        friendee: user2.id
      });
    })
    .then(result => {
      if (_.isString(result)) {
        res.send(400, { success: false, message: result });
      } else {
        res.send(200, { success: true });
      }
    })
    .catch(e => 
      res.serverError(e)
    );
  },

  connections: (req, res) => {
    if (_.isUndefined(req.body.email)) {
      return res.send(400, { success: false, message: 'Please specify an email address' });
    }

    let userEmail = req.body.email;

    return Friend.findOne({
      email: userEmail
    })
    .then(user => {
      return Friendship.find({
        or: [{
          friendor: user.id
        }, {
          friendee: user.id
        }]
      })
      .populate('friendor')
      .populate('friendee');
    })
    .then(friendships => {
      const friendsList = friendships.map(friendship => {
        if (friendship.friendor.email === userEmail) {
          return friendship.friendee.email;
        } else {
          return friendship.friendor.email;
        }
      });

      res.send(200, {
        success: true,
        friends: friendsList,
        count: friendsList.length
      });
    })
    .catch(e => {
      res.serverError(e);
    });
  }
};

