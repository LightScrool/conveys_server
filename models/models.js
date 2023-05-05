const { sequelize } = require("../db");
const { DataTypes } = require("sequelize");
const { DEFAULT_SCORE } = require("../constants");

const User = sequelize.define("user", {
  id: { type: DataTypes.BIGINT, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: DEFAULT_SCORE ?? 0,
  },
});

const Survey = sequelize.define("survey", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: true },
  open: { type: DataTypes.BOOLEAN, defaultValue: true },
  expirationTime: { type: DataTypes.DATE, allowNull: true },
});

const Response = sequelize.define("response", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
});

const Question = sequelize.define("question", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.STRING, allowNull: false },
  type: {
    type: DataTypes.ENUM("oneOfList", "fewOfList", "text", "number"),
    allowNull: false,
  },
  isNecessary: { type: DataTypes.BOOLEAN, defaultValue: true },
  variants: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: true },
  otherVariant: { type: DataTypes.BOOLEAN, defaultValue: false },
});

const Answer = sequelize.define("answer", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  value: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
});

User.hasMany(Survey);
Survey.belongsTo(User);

Survey.hasMany(Response, { as: "responses" });
Response.belongsTo(Survey);

User.hasMany(Response, { as: "responses" });
Response.belongsTo(User);

Survey.hasMany(Question, { as: "questions" });
Question.belongsTo(Survey);

Response.hasMany(Answer, { as: "answers" });
Answer.belongsTo(Response);

Question.hasMany(Answer, { as: "answers" });
Answer.belongsTo(Question);

module.exports = {
  User,
  Survey,
  Response,
  Question,
  Answer,
};
