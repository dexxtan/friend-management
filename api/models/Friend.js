module.exports = {

  attributes: {
    id: {
      type: 'integer',
      unique: true,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: 'string',
      unique: true
    }
  }
};

