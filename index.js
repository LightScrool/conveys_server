require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { sequelize } = require("./db");
const router = require("./routes/index");
const errorHandler = require("./middleware/ErrorHandlingMiddleware");

const PORT = process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", router);

app.use(errorHandler); // Must be the last one

const start = async () => {
  try {
    // await update();
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error(error);
  }
};

start();
