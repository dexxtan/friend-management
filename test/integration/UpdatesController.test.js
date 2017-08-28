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

  describe('#update()', () => {
    beforeEach(() => {
      return Friend.create({ email: 'test1@example.com' });
    });

    it('should respond with success', () => {
      return request(sails.hooks.http.app)
        .post('/updates/update')
        .send({
          sender: 'test1@example.com',
          text: 'Hello World'
        })
        .expect(200)
        .then(response => {
          expect(response.body.success).to.be.true;
          expect(response.body.recipients).to.exist;
          expect(response.body.recipients).to.have.length(0);
        });
    });

    it('should respond with bad request when sender is not provided', () => {
      return request(sails.hooks.http.app)
        .post('/updates/update')
        .send({})
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Sender must specified and must be a valid email address');
        });
    });

    it('should respond with bad request when sender is not a valid email address', () => {
      return request(sails.hooks.http.app)
        .post('/updates/update')
        .send({
          sender: 'haha.haha.com'
        })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Sender must specified and must be a valid email address');
        });
    });

    it('should respond with bad request when text is not provided', () => {
      return request(sails.hooks.http.app)
        .post('/updates/update')
        .send({
          sender: 'test1@example.com'
        })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Text to send must specified and must be a string');
        });
    });

    it('should respond with bad request when text is not a string', () => {
      return request(sails.hooks.http.app)
        .post('/updates/update')
        .send({
          sender: 'test1@example.com',
          text: 1
        })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Text to send must specified and must be a string');
        });
    });

    it('should respond with bad request when sender is not an existing friend', () => {
      return request(sails.hooks.http.app)
        .post('/updates/update')
        .send({
          sender: 'test2@example.com',
          text: 'Hello World'
        })
        .expect(400)
        .then(response => {
          expect(response.body.success).not.to.be.true;
          expect(response.body.message).to.be.equal('Sender specified does not exist');
        });
    });

    describe('when there are mentioned emails', () => {
      beforeEach(() => {
        return Friend.create({ email: 'mention@example.com' });
      });
    
      it('should respond with success and include mentioned email in recipients', () => {
        return request(sails.hooks.http.app)
          .post('/updates/update')
          .send({
            sender: 'test1@example.com',
            text: 'Hello World mention@example.com'
          })
          .expect(200)
          .then(response => {
            expect(response.body.success).to.be.true;
            expect(response.body.recipients).to.have.length(1);
            expect(response.body.recipients.indexOf('mention@example.com')).to.be.above(-1);
          });
      });

      it('should respond with success and include mentioned email in recipients', () => {
        return request(sails.hooks.http.app)
          .post('/updates/update')
          .send({
            sender: 'test1@example.com',
            text: 'Hello World @mention@example.com'
          })
          .expect(200)
          .then(response => {
            expect(response.body.success).to.be.true;
            expect(response.body.recipients).to.have.length(1);
            expect(response.body.recipients.indexOf('mention@example.com')).to.be.above(-1);
          });
      });

      describe('when there are existing subscribers, blocks and friends', () => {
        beforeEach(() => {
          return Promise.all([
            Friend.findOne({ email: 'test1@example.com' }),
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
                friendor: friend1.id,
                friendee: friend3.id
              }),
              Friendship.create({
                friendor: friend1.id,
                friendee: friend4.id
              }),
              Subscription.create({
                subsciber: friend2.id,
                target: friend1.id
              }),
              Block.create({
                blocker: friend4.id,
                target: friend1.id
              })
            ]);
          });
        });

        it('should respond with success, not send duplicate to friendship and subscription, not send to blocked emails, and include mentioned emails', () => {
          return request(sails.hooks.http.app)
            .post('/updates/update')
            .send({
              sender: 'test1@example.com',
              text: 'Hello World mention@example.com'
            })
            .expect(200)
            .then(response => {
              expect(response.body.success).to.be.true;
              expect(response.body.recipients).to.have.length(3);
              expect(response.body.recipients.indexOf('mention@example.com')).to.be.above(-1);
              expect(response.body.recipients.indexOf('test2@example.com')).to.be.above(-1);
              expect(response.body.recipients.lastIndexOf('test2@example.com')).to.be.equal(response.body.recipients.indexOf('test2@example.com'));
              expect(response.body.recipients.indexOf('test3@example.com')).to.be.above(-1);
              expect(response.body.recipients.indexOf('test4@example.com')).to.be.equal(-1);
            });
        });
      });
    });
  });
});
