module.exports = {
  isEmail: (string) => {
    // rudimentary check if its an email address, can be improved to the regexes found online
    return string.indexOf('@') > -1;
  }
};

