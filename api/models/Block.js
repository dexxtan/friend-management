module.exports = {

  attributes: {
    id: {
      type: 'integer',
      unique: true,
      autoIncrement: true,
      primaryKey: true
    },
  	blocker: {
      model: 'friend'
  	},
  	target: {
  		model: 'friend'
  	}
  }
};

