const request = require('supertest');
const { expect } = require('chai');
const Promise = require('bluebird');

describe('UpdatesController', () => {

  describe('#subscribe()', () => {
    beforeEach(() => {
      return Friend.create({ email: 'test2@example.com' });
    });

    it('should respond with success', () => {
      return request(sails.hooks.http.app)
        .post('/updates/subscribe')
        .send({
          requestor: 'test1@example.com',
          target: 'test2@example.com'
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).to.be.true;
        });
    });

    it('should respond with bad request when requestor is not provided', () => {
      return request(sails.hooks.http.app)
        .post('/updates/subscribe')
        .send({})
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Requestor must specified and must be a valid email address');
        });
    });

    it('should respond with bad request when requestor is not a valid email', () => {
      return request(sails.hooks.http.app)
        .post('/updates/subscribe')
        .send({ requestor: 'haha.haha.com' })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Requestor must specified and must be a valid email address');
        });
    });

    it('should respond with bad request when target is not provided', () => {
      return request(sails.hooks.http.app)
        .post('/updates/subscribe')
        .send({ requestor: 'test1@example.com' })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Target must specified and must be a valid email address');
        });
    });

    it('should respond with bad request when target is not a valid email', () => {
      return request(sails.hooks.http.app)
        .post('/updates/subscribe')
        .send({
          requestor: 'test1@example.com',
          target: 'haha.haha.com'
        })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Target must specified and must be a valid email address');
        });
    });

    it('should respond with bad request when target is not an existing friend', () => {
      return request(sails.hooks.http.app)
        .post('/updates/subscribe')
        .send({
          requestor: 'test1@example.com',
          target: 'test3@example.com'
        })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Subscription target does not exist');
        });
    });

    it('should respond with bad request when target is not an existing friend', () => {
      return Promise.all([
        Friend.create({ email: 'test1@example.com' }),
        Friend.findOne({ email: 'test2@example.com' })
      ])
      .spread((friend1, friend2) => {
        return Subscription.create({
          subscriber: friend1.id,
          target: friend2.id
        });
      })
      .then(() => {
        return request(sails.hooks.http.app)
          .post('/updates/subscribe')
          .send({
            requestor: 'test1@example.com',
            target: 'test2@example.com'
          })
          .expect(400)
          .then(response => {
            expect(response.body.success).not.to.be.true;
            expect(response.body.message).to.be.equal('Subscription already exists');
          });
      });
    });
  });

  describe('#block()', () => {
    it('should respond with success', () => {
      return request(sails.hooks.http.app)
        .post('/updates/block')
        .send({
          requestor: 'test1@example.com',
          target: 'test2@example.com'
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).to.be.true;
        });
    });

    it('should respond with bad request when requestor is not provided', () => {
      return request(sails.hooks.http.app)
        .post('/updates/block')
        .send({})
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Requestor must specified and must be a valid email address');
        });
    });

    it('should respond with bad request when requestor is not a valid email', () => {
      return request(sails.hooks.http.app)
        .post('/updates/block')
        .send({ requestor: 'haha.haha.com' })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Requestor must specified and must be a valid email address');
        });
    });

    it('should respond with bad request when target is not provided', () => {
      return request(sails.hooks.http.app)
        .post('/updates/block')
        .send({ requestor: 'test1@example.com' })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Target must specified and must be a valid email address');
        });
    });

    it('should respond with bad request when target is not a valid email', () => {
      return request(sails.hooks.http.app)
        .post('/updates/block')
        .send({
          requestor: 'test1@example.com',
          target: 'haha.haha.com'
        })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Target must specified and must be a valid email address');
        });
    });

    it('should respond with bad request when target is not an existing friend', () => {
      return Promise.all([
        Friend.create({ email: 'test1@example.com' }),
        Friend.create({ email: 'test2@example.com' })
      ])
      .spread((friend1, friend2) => {
        return Block.create({
          blocker: friend1.id,
          target: friend2.id
        });
      })
      .then(() => {
        return request(sails.hooks.http.app)
          .post('/updates/block')
          .send({
            requestor: 'test1@example.com',
            target: 'test2@example.com'
          })
          .expect(400)
          .then(response => {
            expect(response.body.success).not.to.be.true;
            expect(response.body.message).to.be.equal('Block already exists');
          });
      });
    });
  });
});
