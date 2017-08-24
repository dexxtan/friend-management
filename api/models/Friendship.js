module.exports = {

  attributes: {
    id: {
      type: 'integer',
      unique: true,
      autoIncrement: true,
      primaryKey: true
    },
  	friendor: {
      model: 'friend'
  	},
  	friendee: {
  		model: 'friend'
  	}
  }
};

