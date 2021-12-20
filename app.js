import { Telegraf } from "telegraf";
import express from "express";
import database from "./database.js";

import messages from "./messages.js";

/* Bot configuration */

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));

const MAX_QUESTIONS = 50;

/* Bot commands */
bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
  console.log(`Bot started as @${botInfo.username}`);
});

bot.command(["start", "help"], (ctx) => ctx.reply(messages.startMessage));

// add new question
bot.command(["q", "question"], async (ctx) => {
  const questions = await database.getAllQuestions();

  if (questions.length >= MAX_QUESTIONS) {
    return ctx.reply(messages.questionsMax);
  }

  const text = ctx.message.text.split(" ");

  text.shift();

  const question = text.join(" ");

  if (question.length < 5) {
    return ctx.reply(messages.questionMinMessage);
  }

  if (question) {
    const number = questions.length + 1;

    await database.newQuestion({ number, question });

    ctx.reply("thanks your question has been added");
  }
});

// add new question
bot.command(["d", "delete"], async (ctx) => {
  const number = parseInt(ctx.message.text.split(" ")[1]);

  if (number) {
    const res = await database.deleteQuestion({ number });

    if (res.deletedCount) {
      ctx.reply("the question has been deleted");
    } else {
      ctx.reply("no question found with number " + number);
    }
  } else {
    ctx.reply("please enter a number");
  }
});

// add new question
bot.command(["a", "answer"], async (ctx) => {
  const text = ctx.message.text.split(" ");

  text.shift();

  const number = parseInt(text.shift());

  const answer = text.join(" ");

  if (number) {
    const res = await database.updateQuestion({
      number,
      data: { $set: { answer } },
    });

    if (res.modifiedCount > 0) {
      ctx.reply("question has been updated with answer");
    } else {
      ctx.reply("no question found with number " + number);
    }
  } else {
    ctx.reply("please enter a number");
  }
});

// get all questions
bot.command(["all", "allquestions"], async (ctx) => {
  const questions = await database.getAllQuestions();

  if (questions.length === 0) {
    return ctx.reply(messages.noQuestionsMessage);
  }

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    await ctx.reply(
      `#${question.number}. ${question.question} \nvotes:(${question.votes}) ${
        question.answer ? "\nanswer: " + question.answer : ""
      }`
    );
  }
});

// vote for a question
bot.command(["up", "upvote"], async (ctx) => {
  const number = parseInt(ctx.message.text.split(" ")[1]);

  if (number) {
    const question = await database.updateQuestion({
      number,
      data: { $inc: { votes: 1 } },
    });

    if (question?.modifiedCount > 0) {
      ctx.reply("Thanks for your vote");
    } else {
      ctx.reply(
        "Question not found you can see all questions with /all or /allquestions"
      );
    }
  } else {
    ctx.reply("Please enter a valid question number");
  }
});

bot.on("text", (ctx) => ctx.reply(messages.notCommandMessage));

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
