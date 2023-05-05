const anyToNum = (a) => {
  let result = Number(a);
  result = isNaN(result) ? 0 : result;
  return result;
};

module.exports = anyToNum;
