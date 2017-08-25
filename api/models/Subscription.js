module.exports = {

  attributes: {
    id: {
      type: 'integer',
      unique: true,
      autoIncrement: true,
      primaryKey: true
    },
  	subscriber: {
      model: 'friend'
  	},
  	target: {
  		model: 'friend'
  	}
  }
};

