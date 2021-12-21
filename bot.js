import { Telegraf } from "telegraf";
import database from "./database.js";
import messages from "./messages.js";

const bot = new Telegraf("5050130701:AAEKOp5s-1J-f0uvGRwCNHA3usJ82dR0dyc");

const MAX_QUESTIONS = 50;

/* Bot commands */
bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username;
  console.log(`Bot started as @${botInfo.username}`);
});

bot.command(["start", "help"], (ctx) => ctx.reply(messages.startMessage));

// get question
bot.command(["g"], async (ctx) => {
  const number = parseInt(ctx.message.text.split(" ")[1]);

  if (number) {
    const question = await database.getQuestion({ number });

    if (question) {
      ctx.reply(
        `#${question.number}. ${question.question} \nvotes:(${
          question.votes
        }) ${question.answer ? "\nanswer: " + question.answer : ""}`
      );
    } else {
      ctx.reply("no question found with number " + number);
    }
  } else {
    ctx.reply("please enter a number");
  }
});

// add new question
bot.command(["q"], async (ctx) => {
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

    await database.newQuestion({
      number,
      question,
      votes: 0,
      answer: "",
      hide: false,
      saved: false,
    });

    ctx.reply("thanks your question has been added");
  }
});

// add new question
bot.command(["d"], async (ctx) => {
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
bot.command(["a"], async (ctx) => {
  const text = ctx.message.text.split(" ");

  text.shift();

  const number = parseInt(text.shift());

  const answer = text.join(" ");

  if (number) {
    const res = await database.updateQuestion({
      number,
      data: { $set: { answer } },
    });

    console.log(res);

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
bot.command(["all"], async (ctx) => {
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
bot.command(["up"], async (ctx) => {
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

bot.on("inline_query", async (ctx) => {
  const questions = await database.getAllQuestions();

  const results =
    questions?.length > 0
      ? questions.map((question) => ({
          type: "article",
          id: question.number,
          title: question.question,
          description: `question number: ${question.number}, answered: ${
            question.answer ? "Yes" : "No"
          }`,
          hide_url: true,
          thumb_url: "https://j.top4top.io/p_21810q4qo1.jpg",
          input_message_content: {
            message_text: "/g " + question.number,
          },
        }))
      : [];

  ctx.answerInlineQuery(results);
});

bot.on("text", (ctx) => ctx.reply(messages.notCommandMessage));

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default bot;
