const request = require('supertest');
const { expect } = require('chai');
const Promise = require('bluebird');

describe('FriendController', () => {

  describe('#connect()', () => {
    it('should respond with success', () => {
      return request(sails.hooks.http.app)
        .post('/friend/connect')
        .send({ friends: [ 'test1@example.com', 'test2@example.com' ] })
        .expect(200)
        .then(response => {
          expect(response.body.success).to.be.true;
        });
    });

    it('should respond with bad request when friends is not an array', () => {
      return request(sails.hooks.http.app)
        .post('/friend/connect')
        .send({ friends: null })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('An array of friends must be specified to be connected');
        });
    });

    it('should respond with bad request when only one friend was specified', () => {
      return request(sails.hooks.http.app)
        .post('/friend/connect')
        .send({ friends: [ 'test1@example.com' ] })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('We only allow 2 friends to be connected each time');
        });
    });

    it('should respond with bad request when one email address was not valid', () => {
      return request(sails.hooks.http.app)
        .post('/friend/connect')
        .send({ friends: [ 'test1@example.com', 'haha.haha.com' ] })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('An email address specified was not a valid email address');
        });
    });

    it('should respond with bad request when the friendship has already been created', () => {
      return Promise.all([
        Friend.create({ email: 'test1@example.com' }),
        Friend.create({ email: 'test2@example.com'})
      ])
      .spread((friend1, friend2) => {
        return Friendship.create({
          friendor: friend1.id,
          friendee: friend2.id
        });
      })
      .then(() => {
        return request(sails.hooks.http.app)
          .post('/friend/connect')
          .send({ friends: [ 'test1@example.com', 'test2@example.com' ] })
          .expect(400)
          .then(response => {
            expect(response.body.success).not.to.be.true;
            expect(response.body.message).to.be.equal('Friendship already exists');
          });
      });
    });

    it('should respond with bad request when the potential friendship has been blocked', () => {
      return Promise.all([
        Friend.create({ email: 'test1@example.com' }),
        Friend.create({ email: 'test3@example.com'})
      ])
      .spread((friend1, friend2) => {
        return Block.create({
          blocker: friend1.id,
          target: friend2.id
        });
      })
      .then(block => {
        return request(sails.hooks.http.app)
          .post('/friend/connect')
          .send({ friends: [ 'test1@example.com', 'test3@example.com' ] })
          .expect(400)
          .then(response => {
            expect(response.body.success).not.to.be.true;
            expect(response.body.message).to.be.equal('A friendship could not be created because one user has blocked the other');
          });
      })
    });
  });

  describe('#connections()', () => {
    beforeEach(() => {
      return Promise.all([
        Friend.create({ email: 'test1@example.com' }),
        Friend.create({ email: 'test2@example.com' }),
        Friend.create({ email: 'test3@example.com' })
      ])
      .spread((friend1, friend2, friend3) => {
        return Promise.all([
          Friendship.create({
            friendor: friend1.id,
            friendee: friend2.id
          }),
          Friendship.create({
            friendor: friend1.id,
            friendee: friend3.id
          })
        ]);
      });
    });

    it('should respond with success and the list of friend emails', () => {      
      return request(sails.hooks.http.app)
        .post('/friend/connections')
        .send({ email: 'test1@example.com' })
        .expect(200)
        .then(response => {
          expect(response.body.success).to.be.true;
          expect(response.body.friends).to.have.length(2);
          expect(response.body.friends.indexOf('test2@example.com')).to.be.above(-1);
          expect(response.body.friends.indexOf('test3@example.com')).to.be.above(-1);
          expect(response.body.count).to.be.equal(2);
        });
    });

    it('should respond with bad request when email is not specified', () => {
      return request(sails.hooks.http.app)
        .post('/friend/connections')
        .send({})
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Please specify a valid email address');
        });
    });

    it('should respond with bad request when email is not valid', () => {
      return request(sails.hooks.http.app)
        .post('/friend/connections')
        .send({ email: 'haha.haha.com' })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Please specify a valid email address');
        });
    });

    it('should respond with bad request when email provided is not already a friend', () => {
      return request(sails.hooks.http.app)
        .post('/friend/connections')
        .send({ email: 'test4@example.com' })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Could not find an existing friend with the email address specified');
        });
    });
  });

  describe('#common()', () => {
    beforeEach(() => {
      return Promise.all([
        Friend.create({ email: 'test1@example.com' }),
        Friend.create({ email: 'test2@example.com' }),
        Friend.create({ email: 'test3@example.com' }),
        Friend.create({ email: 'test4@example.com' })
      ])
      .spread((friend1, friend2, friend3, friend4) => {
        return Promise.all([
          Friendship.create({
            friendor: friend1.id,
            friendee: friend2.id
          }),
          Friendship.create({
            friendor: friend3.id,
            friendee: friend2.id
          }),
          Friendship.create({
            friendor: friend1.id,
            friendee: friend4.id
          }),
          Friendship.create({
            friendor: friend3.id,
            friendee: friend4.id
          })
        ]);
      });
    });

    it('should respond with success', () => {
      return request(sails.hooks.http.app)
        .post('/friend/common')
        .send({ friends: [ 'test1@example.com', 'test3@example.com' ] })
        .expect(200)
        .then(response => {
          expect(response.body.success).to.be.true;
          expect(response.body.friends).to.have.length(2);
          expect(response.body.friends.indexOf('test2@example.com')).to.be.above(-1);
          expect(response.body.friends.indexOf('test4@example.com')).to.be.above(-1);
          expect(response.body.count).to.be.equal(2);
        });
    });

    it('should respond with bad request when friends is not an array', () => {
      return request(sails.hooks.http.app)
        .post('/friend/common')
        .send({ friends: null })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('An array of 2 friends must be specified to find common friends');
        });
    });

    it('should respond with bad request when only one friend was specified', () => {
      return request(sails.hooks.http.app)
        .post('/friend/common')
        .send({ friends: [ 'test1@example.com' ] })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('An array of 2 friends must be specified to find common friends');
        });
    });

    it('should respond with bad request when one email address was not valid', () => {
      return request(sails.hooks.http.app)
        .post('/friend/common')
        .send({ friends: [ 'test1@example.com', 'haha.haha.com' ] })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('An email address specified was not a valid email address');
        });
    });

    it('should respond with bad request when one email address specfied was not an existing friend', () => {
      return request(sails.hooks.http.app)
        .post('/friend/common')
        .send({ friends: [ 'test1@example.com', 'haha@haha.com' ] })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Either friend not found');
        });
    });
  });
});
