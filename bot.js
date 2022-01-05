import { Telegraf } from "telegraf";
import database from "./database.js";
import messages from "./messages.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

const MAX_QUESTIONS = 50;

bot.use(function (ctx, next) {
  if (ctx?.chat?.id && ctx.chat.id > 0) return next();

  return bot.telegram
    .getChatAdministrators(ctx.chat.id)
    .then(function (data) {
      if (!data || !data.length) return;
      console.log("admin list:", data);
      ctx.chat._admins = data;
      ctx.from._is_in_admin_list = data.some(
        (adm) => adm.user.id === ctx.from.id
      );
    })
    .catch(console.log)
    .then((_) => next(ctx));
});

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
    const question = await database.getQuestion({ hide: false, number });

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
      answered: false,
      hide: false,
      saved: false,
    });

    ctx.reply("thanks your question has been added");
  }
});

// add new question
bot.command(["d"], async (ctx) => {
  if (ctx.from._is_in_admin_list) {
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
  } else {
    return ctx.reply("only admins can delete questions");
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
      data: { $set: { answer, answered: true } },
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
  // const questions = await database.getAllQuestions({ hide: false });

  // if (questions.length === 0) {
  //   return ctx.reply(messages.noQuestionsMessage);
  // }

  // for (let i = 0; i < questions.length; i++) {
  //   const question = questions[i];
  //   await ctx.reply(
  //     `#${question.number}. ${question.question} \nvotes:(${question.votes}) ${
  //       question.answer ? "\nanswer: " + question.answer : ""
  //     }`
  //   );
  // }

  ctx.reply(
    "you can search for questions by mentioning the bot @mrhbqabot {your question} if no related questions you can ask a new question by usign /q {your question}"
  );
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
  try {
    const query = ctx.inlineQuery.query;
    if (query) {
      const questions = await database.getAllQuestions({
        hide: false,
        $text: { $search: query },
      });

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
    } else {
      ctx.answerInlineQuery([]);
    }
  } catch (e) {
    console.log(e);
  }
});

// bot.on("text", (ctx) => ctx.reply(messages.notCommandMessage));

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

export default bot;
