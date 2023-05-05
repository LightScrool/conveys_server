const AUTH_START = "OAuth ";
const {get} = require("axios");
const {User} = require("../models/models");

const checkAuth = async (req) => {
  const authorization = req?.headers?.authorization;

  if (!authorization || authorization.indexOf(AUTH_START) !== 0) {
    return null;
  }

  let id, name;
  try {
    const response = await get(`https://login.yandex.ru/info?format=json`, {
      headers: {
        authorization,
      },
    });
    id = response?.data?.id;
    name = response?.data?.display_name;
  } catch (e) {
    console.error(e);
    return null;
  }

  if (!id || !name) {
    return null;
  }
  if (name.indexOf('@') !== -1) {
    name = name.substring(0, name.indexOf('@'));
  }
  try {
    let user = await User.findOne({
      where: {id},
    });

    if (!user) {
      user = await User.create({id, name});
    } else if (user.name !== name) {
      user.name = name;
      user.save();
    }

    return {id, name, score: user.score};
  } catch (e) {
    console.error(e);
    return null
  }
};

module.exports = checkAuth;
