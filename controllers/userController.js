const checkAuth = require("../helpers/checkAuth");
const ApiError = require("../error/ApiError");
const { Survey, Response } = require("../models/models");

class UserController {
  async info(req, res, next) {
    const auth = await checkAuth(req);

    if (!auth) {
      return next(ApiError.unauthorized());
    }

    return res.json(auth);
  }

  async surveys(req, res, next) {
    const auth = await checkAuth(req);

    if (!auth) {
      return next(ApiError.unauthorized());
    }

    const { id } = auth;

    try {
      const surveys = await Survey.findAll({
        where: { userId: id },
        order: [['createdAt', 'DESC']],
        include: [{ model: Response, as: "responses" }],
      });
      const result = surveys.map((survey) => ({
        id: survey.id,
        name: survey.name,
        description: survey.description,
        responsesQuantity: survey.responses?.length ?? 0,
      }));
      res.json(result);
    } catch (e) {
      return next(ApiError.internal());
    }
    return res;
  }
}

module.exports = new UserController();
