const Router = require("express");
const router = new Router();

const controller = require("../controllers/userController");

router.get("/info", controller.info);

router.get("/surveys", controller.surveys);

module.exports = router;
