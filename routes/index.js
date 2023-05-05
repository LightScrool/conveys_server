const { PUBLIC_FOLDER } = require("../constants");
const Router = require("express");
const router = new Router();

const pingRouter = require("./pingRouter");
const userRouter = require("./userRouter");
const surveysRouter = require("./surveysRouter");
const express = require("express");

router.use("/ping", pingRouter);
router.use("/user", userRouter);
router.use("/surveys", surveysRouter);
router.use("/static", express.static(PUBLIC_FOLDER));

module.exports = router;
