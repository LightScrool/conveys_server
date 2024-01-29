const Router = require("express");
const router = new Router();

router.get("/", (req, res) => {
  return res.status(200).json({ message: "pong" });
});

module.exports = router;
