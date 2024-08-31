function stringValidator(input) {
  return typeof input === 'string' && input.length > 0;
}

module.exports = {
  stringValidator
};
