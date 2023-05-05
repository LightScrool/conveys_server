const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const { PUBLIC_FOLDER } = require("../constants");

const mapSurvey = (survey) => {
  const unmappedData = JSON.parse(JSON.stringify(survey));
  const surveyId = unmappedData.id;

  const questionsTexts = unmappedData.questions.reduce((result, question) => {
    result[question.id] = question.text;
    return result;
  }, {});

  const iteration1 = unmappedData.responses.map((response) => response.answers);
  const iteration2 = iteration1.map((response) =>
    response.reduce((result, answer) => {
      result[answer.questionId] = answer?.value?.join("; ") || "-";
      return result;
    }, {})
  );
  const iteration3 = iteration2.map((response, index) => {
    return Object.keys(response).reduce(
      (result, key) => {
        result[questionsTexts[key]] = response[key];
        return result;
      },
      { "№": String(index + 1) }
    );
  });

  return { surveyId, data: iteration3 };
};

const saveSurveyToExcel = (survey, format) => {
  const { surveyId, data } = mapSurvey(survey);

  const sheet = XLSX.utils.json_to_sheet(data);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet);

  XLSX.write(book, { bookType: format, type: "buffer" });
  XLSX.write(book, { bookType: format, type: "binary" });

  const fileName = "conveys_report." + format;
  const folderName = path.join(PUBLIC_FOLDER, String(surveyId));
  if (!fs.existsSync(folderName)) {
    fs.mkdirSync(folderName);
  }
  const fileFullName = path.join(folderName, fileName);
  XLSX.writeFile(book, fileFullName);

  return `/static/${String(surveyId)}/${fileName}`;
};

module.exports = saveSurveyToExcel;
