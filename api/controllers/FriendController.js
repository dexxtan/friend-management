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
      user1 = _.find(users, { email: friendList[0] });
      user2 = _.find(users, { email: friendList[1] });

      // create users if they do not exist or return the user object found
      let promises = [
        user1 || Friend.create({ email: friendList[0] }),
        user2 || Friend.create({ email: friendList[1] })
      ];

      return Promise.all(promises);
    })
    .spread((user1, user2) => {
      res.send({ success: true });
    });
  }
};

