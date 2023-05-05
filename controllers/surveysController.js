const {
  Survey,
  Question,
  Response,
  User,
  Answer,
} = require("../models/models");
const ApiError = require("../error/ApiError");
const checkAuth = require("../helpers/checkAuth");
const anyToNum = require("../helpers/anyToNum");
const saveSurveyToExcel = require("../helpers/saveSurveyToExcel");
const { SCORE_TO_CREATE } = require("../constants");

class SurveysController {
  async getAll(req, res, next) {
    const auth = await checkAuth(req);
    const userId = auth?.id;

    const page = anyToNum(req?.headers?.page);
    let limit = anyToNum(req?.headers?.limit);

    try {
      let surveys = await Survey.findAll({
        where: { open: true },
        order: [["createdAt", "DESC"]],
        include: [{ model: Response, as: "responses" }],
      });

      if (userId) {
        surveys = surveys.filter((survey) => {
          return (
            survey.userId !== userId &&
            !survey?.responses?.some((response) => response.userId === userId)
          );
        });
      }

      surveys = surveys.sort(
        (a, b) =>
          anyToNum(a?.responses?.length) - anyToNum(b?.responses?.length)
      );

      limit = limit || surveys.length;
      const totalPages = Math.ceil(surveys.length / limit);
      const begin = page * limit;
      const end = (page + 1) * limit;

      surveys = surveys.slice(begin, end).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
      }));

      res.set().json({ totalPages, surveys });
    } catch (e) {
      console.error(e);
      return next(ApiError.notFound("Survey not found"));
    }

    return res;
  }

  async getOne(req, res, next) {
    const auth = await checkAuth(req);

    const { surveyId } = req.params;
    const id = Number(surveyId);

    try {
      let survey = await Survey.findOne({
        where: { id },
        include: [{ model: Response, as: "responses" }],
      });
      const responsesQuantity = survey.responses.length;

      if (survey.expirationTime && survey.expirationTime < new Date()) {
        survey.open = false;
        survey.save();
      }

      if (
        auth &&
        auth.id !== survey.userId &&
        (!survey.open ||
          survey?.responses?.some((response) => response.userId === auth.id))
      ) {
        return next(
          ApiError.forbidden(
            "Survey is closed or you have already completed it!"
          )
        );
      }

      if (auth && auth.id === survey.userId) {
        survey = await Survey.findOne({
          where: { id },
          include: [
            {
              model: Question,
              as: "questions",
              include: [{ model: Answer, as: "answers" }],
            },
          ],
        });
        survey.dataValues.responsesQuantity = responsesQuantity;
      } else {
        survey = await Survey.findOne({
          where: { id },
          include: [{ model: Question, as: "questions" }],
        });
      }

      res.json(survey);
    } catch (e) {
      console.error(e);
      return next(ApiError.notFound("Survey not found"));
    }

    return res;
  }

  async create(req, res, next) {
    const auth = await checkAuth(req);

    if (!auth) {
      return next(ApiError.unauthorized());
    }

    const userId = auth.id;
    const { name, description, expirationTime, questions } = req.body;

    try {
      const user = await User.findOne({ where: { id: userId } });

      if (user.score < SCORE_TO_CREATE) {
        return next(ApiError.forbidden("Not enough points!"));
      }

      const survey = await Survey.create({
        userId,
        name,
        description,
        expirationTime,
      });

      if (questions) {
        for (let item of questions) {
          await Question.create({
            ...item,
            surveyId: survey.id,
          });
        }
      }

      user.score -= SCORE_TO_CREATE;
      user.save();

      res.json({ id: survey.id });
    } catch (e) {
      console.error(e);
      return next(ApiError.badRequest("Unable to create survey!"));
    }

    return res;
  }

  async remove(req, res, next) {
    const auth = await checkAuth(req);

    if (!auth) {
      return next(ApiError.unauthorized());
    }

    const { surveyId } = req.params;
    const id = Number(surveyId);

    try {
      const { userId } = await Survey.findOne({ where: { id } });
      if (auth.id !== userId) {
        return next(ApiError.forbidden());
      }
    } catch (e) {
      console.error(e);
      return next(ApiError.notFound("Survey not found"));
    }

    await Survey.destroy({
      where: { id },
    });

    return res.json({ message: "OK" });
  }

  async close(req, res, next) {
    const auth = await checkAuth(req);

    if (!auth) {
      return next(ApiError.unauthorized());
    }

    const { surveyId } = req.params;
    const id = Number(surveyId);

    try {
      const survey = await Survey.findOne({ where: { id } });
      if (auth.id !== survey.userId) {
        return next(ApiError.forbidden());
      }
      survey.open = false;
      await survey.save();
    } catch (e) {
      console.error(e);
      return next(ApiError.notFound("Survey not found"));
    }

    return res.json({ message: "OK" });
  }

  async open(req, res, next) {
    const auth = await checkAuth(req);

    if (!auth) {
      return next(ApiError.unauthorized());
    }

    const { surveyId } = req.params;
    const id = Number(surveyId);

    try {
      const survey = await Survey.findOne({ where: { id } });
      if (auth.id !== survey.userId) {
        return next(ApiError.forbidden());
      }
      survey.open = true;
      await survey.save();
    } catch (e) {
      console.error(e);
      return next(ApiError.notFound("Survey not found"));
    }

    return res.json({ message: "OK" });
  }

  async response(req, res, next) {
    const auth = await checkAuth(req);

    try {
      const surveyId = Number(req.params.surveyId);
      const userId = auth?.id;
      const response = await Response.create({ surveyId, userId });

      const answers = req.body;
      const answersCreating = Object.keys(answers).map(async (questionId) => {
        await Answer.create({
          questionId,
          responseId: response.id,
          value: answers[questionId],
        });
      });
      await Promise.all(answersCreating);

      if (auth) {
        User.findOne({ where: { id: userId } }).then((user) => {
          ++user.score;
          user.save();
        });
      }
    } catch (e) {
      console.error(e);
      return next(ApiError.internal());
    }

    return res.json({ message: "OK" });
  }

  async xlsx(req, res, next) {
    const auth = await checkAuth(req);
    const surveyId = Number(req.params.surveyId);

    if (!auth) return next(ApiError.unauthorized());

    try {
      let survey = await Survey.findOne({
        where: { id: surveyId },
        include: [
          { model: Question, as: "questions" },
          {
            model: Response,
            as: "responses",
            include: [{ model: Answer, as: "answers" }],
          },
        ],
      });

      if (survey.userId !== auth.id) {
        return next(ApiError.forbidden());
      }

      const url = saveSurveyToExcel(survey, 'xlsx');
      res.json({ url });
    } catch (e) {
      console.error(e);
      return next(ApiError.internal());
    }

    return res;
  }

  async csv(req, res, next) {
    const auth = await checkAuth(req);
    const surveyId = Number(req.params.surveyId);

    if (!auth) return next(ApiError.unauthorized());

    try {
      let survey = await Survey.findOne({
        where: { id: surveyId },
        include: [
          { model: Question, as: "questions" },
          {
            model: Response,
            as: "responses",
            include: [{ model: Answer, as: "answers" }],
          },
        ],
      });

      if (survey.userId !== auth.id) {
        return next(ApiError.forbidden());
      }

      const url = saveSurveyToExcel(survey, 'csv');
      res.json({ url });
    } catch (e) {
      console.error(e);
      return next(ApiError.internal());
    }

    return res;
  }
}

module.exports = new SurveysController();
