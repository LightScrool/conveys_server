const path = require("path");

const PUBLIC_FOLDER = path.join(__dirname, "public");

const DEFAULT_SCORE = process.env.DEFAULT_SCORE ?? 0;
const SCORE_TO_CREATE = process.env.SCORE_TO_CREATE ?? 30;

module.exports = {
  PUBLIC_FOLDER,
  DEFAULT_SCORE,
  SCORE_TO_CREATE,
};
