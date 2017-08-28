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

    for (let i = 0; i < req.body.friends.length; i++) {
      if (!EmailService.isEmail(req.body.friends[i])) {
        return res.send(400, { success: false, message: 'An email address specified was not a valid email address' });
      }
    }

    const friendList = req.body.friends;
    let user1, user2;
    const friendshipExistsErrorMsg = 'Friendship already exists';
    const blockageExistsErrorMsg = 'A friendship could not be created because one user has blocked the other';

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

      return Promise.all([
        Friendship.find({
          or: [{
            friendor: user1.id,
            friendee: user2.id
          }, {
            friendor: user2.id,
            friendee: user1.id
          }]
        }),
        Block.find({
          or: [{
            blocker: user1.id,
            target: user2.id
          }, {
            blocker: user2.id,
            target: user1.id
          }]
        })
      ]);
    })
    .spread((friendships, blocks) => {
      if (!_.isEmpty(friendships)) {
        throw new Error(friendshipExistsErrorMsg); 
      }

      if (!_.isEmpty(blocks)) {
        throw new Error(blockageExistsErrorMsg);
      }

      return Friendship.create({
        friendor: user1.id,
        friendee: user2.id
      });
    })
    .then(friendship => {
      if (_.isObject(friendship)) {
        res.send(200, { success: true });
      } else {
        throw new Error('Unknown error occurred');
      }
    })
    .catch(e => {
      if (e.message === friendshipExistsErrorMsg) {
        res.send(400, { success: false, message: friendshipExistsErrorMsg }); 
      } else if (e.message === blockageExistsErrorMsg) {
        res.send(400, { success: false, message: blockageExistsErrorMsg });
      } else {
        res.serverError(e);
      }
    });
  },

  connections: (req, res) => {
    if (_.isUndefined(req.body.email) || !EmailService.isEmail(req.body.email)) {
      return res.send(400, { success: false, message: 'Please specify a valid email address' });
    }

    const userEmail = req.body.email;
    let user;
    const userNotFoundErrorMsg = 'Could not find an existing friend with the email address specified';

    return Friend.findOne({
      email: userEmail
    })
    .then(friend => {
      if (_.isUndefined(friend)) {
        throw new Error(userNotFoundErrorMsg);
      }

      user = friend;
      return Friendship.find({
        or: [{
          friendor: user.id
        }, {
          friendee: user.id
        }]
      });
    })
    .then(friendships => {
      const friendsListIds = friendships.map(friendship => {
        // friendee and friendor here are IDs
        if (friendship.friendor === user.id) {
          return friendship.friendee;
        } else {
          return friendship.friendor;
        }
      });

      return Friend.find({
        id: friendsListIds
      })
    })
    .then(friends => {
      const friendEmails = friends.map(friend => friend.email);

      res.send(200, {
        success: true,
        friends: friendEmails,
        count: friendEmails.length
      });
    })
    .catch(e => {
      if (e.message === userNotFoundErrorMsg) {
        res.send(400, { success: false, message: userNotFoundErrorMsg });
      } else {
        res.serverError(e);
      }
    });
  },

  common: (req, res) => {
    if (!_.isArray(req.body.friends) || req.body.friends.length != 2) {
      return res.send(400, { success: false, message: 'An array of 2 friends must be specified to find common friends' });
    }

    for (let i = 0; i < req.body.friends.length; i++) {
      if (!EmailService.isEmail(req.body.friends[i])) {
        return res.send(400, { success: false, message: 'An email address specified was not a valid email address' });
      }
    }

    const friendList = req.body.friends;
    let friend1, friend2;
    const friendNotFoundErrorMsg = 'Either friend not found';

    return Friend.find({
      email: friendList
    })
    .then(friends => {
      if (friends.length < 2) {
        throw new Error(friendNotFoundErrorMsg); // return message to indicate that one or both friends are not yet created
      }

      // we use find here because the performance impact won't be great since friends will be an array of at most 2 friends
      friend1 = _.find(friends, { email: friendList[0] });
      friend2 = _.find(friends, { email: friendList[1] });

      return Promise.all([
        Friendship.find({
          or: [{
            friendor: friend1.id
          }, {
            friendee: friend1.id
          }]
        }),
        Friendship.find({
          or: [{
            friendor: friend2.id
          }, {
            friendee: friend2.id
          }]
        })
      ]);
    })
    .spread((friendshipList1, friendshipList2) => {
      let friendList1Ids = friendshipList1.map(friendship => {
        // friendor and friendee are IDs here because we did not populate the relationship
        if (friendship.friendor === friend1.id) {
          return friendship.friendee;
        } else {
          return friendship.friendor;
        }
      });
      let friendList2Ids = friendshipList2.map(friendship => {
        if (friendship.friendor === friend2.id) {
          return friendship.friendee;
        } else {
          return friendship.friendor;
        }
      });

      // sort the friend lists for faster processing
      friendList1Ids.sort();
      friendList2Ids.sort();

      // this can be done using lodash _.intersection which is probably more performant
      // but I thought there might be a point in writing it out for the purposes of this interview assignment
      const commonListIds = [];
      let i = 0;
      let j = 0;
      while (i < friendList1Ids.length && j < friendList2Ids.length) {
        if (friendList1Ids[i] === friendList2Ids[j]) {
          i++;
          j++;
          commonListIds.push(friendList1Ids[i]);
        } else if (friendList1Ids[i] > friendList2Ids[j]) {
          j++;
        } else {
          i++;
        }
      }

      return Friend.find({
        id: commonListIds
      })
    })
    .then(friends => {
      const emailList = friends.map(friend => friend.email);

      res.send(200, {
        success: true,
        friends: emailList,
        count: emailList.length
      });
    })
    .catch(e => {
      if (e.message === friendNotFoundErrorMsg) {
        res.send(400,  { success: false, message: friendNotFoundErrorMsg });
      } else {
        res.serverError(e); 
      }
    });
  }
};

