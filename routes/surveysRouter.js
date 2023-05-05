const Router = require("express");
const router = new Router();

const controller = require("../controllers/surveysController");

router.get("/", controller.getAll);

router.get("/:surveyId", controller.getOne);

router.post("/", controller.create);

router.delete("/:surveyId", controller.remove);

router.patch("/:surveyId/open", controller.open);

router.patch("/:surveyId/close", controller.close);

router.post("/:surveyId/response", controller.response);

router.get("/:surveyId/xlsx", controller.xlsx);

router.get("/:surveyId/csv", controller.csv);

module.exports = router;
