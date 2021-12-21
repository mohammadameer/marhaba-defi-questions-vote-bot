import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bot from "./bot.js";
import database from "./database.js";

/* Bot configuration */

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const port = process.env.PORT || 3000;

app.get("/questions", async (req, res) => {
  const questions = await database.getAllQuestions();
  res.json(questions);
});

app.delete("/questions/:number", async (req, res) => {
  const question = await database.deleteQuestion({
    number: parseInt(req.params.number),
  });
  console.log("req.params.number", req.params.number);
  console.log("question", question);
  res.json(question);
});

app.put("/questions/:number", async (req, res) => {
  const question = await database.updateQuestion({
    number: parseInt(req.params.number),
    data: { $set: { answer: req.body.answer } },
  });

  console.log("number", req.params.number);
  console.log("req", req.body);
  console.log("question", question);
  res.json(question);
});

app.listen(port, () => console.log(`Listening on port ${port}`));
