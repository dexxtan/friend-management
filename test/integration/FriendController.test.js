const request = require('supertest');
const { expect } = require('chai');

describe('FriendController', function() {

  describe('#connect()', function() {
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
  });

});