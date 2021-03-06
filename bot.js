import { Telegraf } from "telegraf";
import LocalSession from "telegraf-session-local";
import database from "./database.js";
import messages from "./messages.js";
import AnyCase from "telegraf-anycase-commands";

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(new LocalSession({ database: "users.json" }).middleware());
bot.use(function (ctx, next) {
  if (!ctx?.chat?.id || ctx.chat.id > 0) return next();

  return bot.telegram
    .getChatAdministrators(ctx.chat.id)
    .then(function (data) {
      if (!data || !data.length) return;
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
bot.command(["g", "G"], async (ctx) => {
  try {
    const number = parseInt(ctx.message.text.split(" ")[1]);

    if (number) {
      const question = await database.getQuestion({ hide: false, number });

      if (question) {
        ctx.reply(
          `#${question.number}. ${question.question} \nvotes:(${
            question.votes
          }) ${
            question.answer
              ? "\nanswer: " + question.answer
              : "\nnot answered yet"
          }`
        );
      } else {
        ctx.reply("no question found with number " + number);
      }
    } else {
      ctx.reply("please enter a number");
    }
  } catch (e) {
    console.log(e);
  }
});

// add new question
bot.command(["q", "Q"], async (ctx) => {
  try {
    const questions = await database.getAllQuestions();

    const text = ctx.message.text.split(" ");

    text.shift();

    const question = text.join(" ");

    if (question.length < 5) {
      return ctx.reply(messages.questionMinMessage);
    }

    if (question) {
      const val = Math.floor(1000 + Math.random() * 9000);
      const number = val + questions.length + 1;

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
  } catch (e) {
    console.log(e);
  }
});

// add new question
bot.command(["d", "D"], async (ctx) => {
  try {
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
  } catch (e) {
    console.log(e);
  }
});

// add new question
bot.command(["a", "A"], async (ctx) => {
  try {
    const text = ctx.message.text.split(" ");

    text.shift();

    const number = parseInt(text.shift());

    const answer = text.join(" ");

    if (number) {
      const res = await database.updateQuestion({
        number,
        data: { $set: { answer, answered: true } },
      });

      if (res.modifiedCount > 0) {
        ctx.reply("question has been updated with answer");
      } else {
        ctx.reply("no question found with number " + number);
      }
    } else {
      ctx.reply("please enter a number");
    }
  } catch (e) {
    console.log(e);
  }
});

// get all questions
bot.command(["all", "All"], async (ctx) => {
  try {
    if (ctx.chat.type == "private" || ctx.from._is_in_admin_list) {
      ctx.reply("getting all questions...");

      const questions = await database.getAllQuestions({
        hide: false,
      });

      if (questions.length === 0) {
        return ctx.reply(messages.noQuestionsMessage);
      }
      let message = "all questions:\n";

      for (let i = 0; i < questions.length; i++) {
        let question = questions[i];

        message += `\n\n #${question.number}. ${question.question} \nvotes:(${
          question.votes
        }) ${
          question.answer
            ? "\nanswer: " + question.answer
            : "\nnot answered yet"
        }`;

        if (message.length > 4090) {
          ctx.reply(message.slice(0, 4090));
          message = message.slice(4090);
        }
      }

      ctx.reply(message);
    } else {
      ctx.reply(
        "to see all questions use the /all command in the bot private chat @mrhbqabot also you can use /allAnswered to get the answered questions and /allNotAnswered to get all notanswered questions"
      );
    }
  } catch (e) {
    console.log(e);
  }
});

bot.command(
  ["allnotanswered", "Allnotanswered", "AllNotAnswered"],
  async (ctx) => {
    try {
      if (ctx.chat.type == "private" || ctx.from._is_in_admin_list) {
        ctx.reply("getting all not answered questions...");

        const questions = await database.getAllQuestions({
          hide: false,
          answered: false,
        });

        if (questions.length === 0) {
          return ctx.reply(messages.noQuestionsMessage);
        }
        let message = "all unaswered questions:\n";

        for (let i = 0; i < questions.length; i++) {
          let question = questions[i];

          message += `\n\n #${question.number}. ${question.question} \nvotes:(${
            question.votes
          }) ${
            question.answer
              ? "\nanswer: " + question.answer
              : "\nnot answered yet"
          }`;

          if (message.length > 4090) {
            ctx.reply(message.slice(0, 4090));
            message = message.slice(4090);
          }
        }

        ctx.reply(message);
      } else {
        ctx.reply(
          "to see all questions use the /all command in the bot private chat @mrhbqabot also you can use /allAnswered to get the answered questions and /allNotAnswered to get all not answered questions"
        );
      }
    } catch (e) {
      console.log(e);
    }
  }
);

bot.command(["allanswered", "Allanswered", "AllAnswered"], async (ctx) => {
  try {
    if (ctx.chat.type == "private" || ctx.from._is_in_admin_list) {
      ctx.reply("getting all answered questions...");

      const questions = await database.getAllQuestions({
        hide: false,
        answered: true,
      });

      if (questions.length === 0) {
        return ctx.reply(messages.noQuestionsMessage);
      }
      let message = "all answered questions:\n";

      for (let i = 0; i < questions.length; i++) {
        let question = questions[i];

        message += `\n\n #${question.number}. ${question.question} \nvotes:(${
          question.votes
        }) ${
          question.answer
            ? "\nanswer: " + question.answer
            : "\nnot answered yet"
        }`;

        if (message.length > 4090) {
          ctx.reply(message.slice(0, 4090));
          message = message.slice(4090);
        }
      }

      ctx.reply(message);
    } else {
      ctx.reply(
        "to see all questions use the /all command in the bot private chat @mrhbqabot also you can use /allAnswered to get the answered questions and /allNotAnswered to get all notanswered questions"
      );
    }
  } catch (e) {
    console.log(e);
  }
});

// vote for a question
bot.command(["up", "Up", "UP", "uP"], async (ctx) => {
  try {
    const number = parseInt(ctx.message.text.split(" ")[1]);

    if (number) {
      ctx.session.votes = ctx.session?.votes || { [ctx.from.id]: {} };

      if (
        ctx.session.votes[ctx.from.id] &&
        ctx.session.votes[ctx.from.id][number]
      ) {
        return ctx.reply("you already voted for this question");
      } else {
        const question = await database.updateQuestion({
          number,
          data: { $inc: { votes: 1 } },
        });

        if (question?.modifiedCount > 0) {
          ctx.session.votes[ctx.from.id][number] = true;
          ctx.reply("Thanks for your vote");
        } else {
          ctx.reply(
            "Question not found you can see all questions with /all or /allquestions"
          );
        }
      }
    } else {
      ctx.reply("Please enter a valid question number");
    }
  } catch (e) {
    console.log(e);
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
