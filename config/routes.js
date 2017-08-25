module.exports.routes = {
  'POST /friend/connect': 'FriendController.connect',
  'POST /friend/connections': 'FriendController.connections',
  'POST /friend/common': 'FriendController.common',
  'POST /updates/subscribe': 'UpdatesController.subscribe',
  'POST /updates/block': 'UpdatesController.block'
};
