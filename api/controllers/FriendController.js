let _ = require('lodash');
let Promise = require('bluebird');

module.exports = {
	connect: (req, res) => {
    if (!_.isArray(req.body.friends)) {
      return res.badRequest('An array of friends must be specified to be connected');
    }

    if (req.body.friends.length != 2) {
      return res.badRequest('We only allow 2 friends to be connected each time');
    }

    let friendList = req.body.friends;
    let user1, user2;

    return Friend.find({
      email: friendList // search for both users by passing array into the find criteria
    })
    .then(users => {
      // return the user object found or create users if they do not exist
      let promises = [
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
      })
    })
    .then(friendship => {
      if (!_.isEmpty(friendship)) {
        return null;
      }

      return Friendship.create({
        friendor: user1.id,
        friendee: user2.id
      });
    })
    .then(friendship => {
      if (_.isNull(friendship)) {
        res.badRequest('Friendship already exists');
      } else {
        res.send(200, { success: true });
      }
    })
    .catch(e => 
      res.serverError(e)
    );
  }
};

