import { Telegraf } from "telegraf";
import express from "express";
import LocalSession from "telegraf-session-local";
import cron from "node-cron";

import messages from "./messages.js";
import checkDate from "./utils/checkDate.js";

/* Bot configuration */

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(async (ctx, next) => {
  await next();
});

bot.use(new LocalSession({ database: "questions.json" }).middleware());

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
bot.command(["q", "question"], (ctx) => {
  checkDate(ctx);

  if (ctx.session.questions.length >= MAX_QUESTIONS) {
    return ctx.reply(messages.questionsMax);
  }

  const text = ctx.message.text.split(" ");

  text.shift();

  const question = text.join(" ");

  if (question.length < 5) {
    return ctx.reply(messages.questionMinMessage);
  }

  if (question) {
    ctx.session.questions = ctx.session.questions || [];
    ctx.session.questions.push({
      number: ctx.session.questions.length + 1,
      question,
      votes: 0,
    });

    ctx.reply("thanks your question has been added");
  }
});

// get all questions
bot.command(["all", "allquestions"], async (ctx) => {
  checkDate(ctx);

  const questions = ctx.session.questions.sort((a, b) => b.votes - a.votes);

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    await ctx.reply(
      `#${question.number}. ${question.question} \nvotes:(${question.votes})`
    );
  }
});

// vote for a question
bot.command(["up", "upvote"], (ctx) => {
  checkDate(ctx);

  const number = parseInt(ctx.message.text.split(" ")[1]);
  let found = false;

  if (number) {
    ctx.session.questions.forEach((question) => {
      if (question.number === number) {
        question.votes++;
        found = true;
      }
    });

    if (found) {
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
