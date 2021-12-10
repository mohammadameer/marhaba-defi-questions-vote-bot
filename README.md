# Marhaba Defi Questions Vote Bot

this is a bot for Marhaba defi community  to ask question and vote on the questions

![marhaba defi questions vote bot](https://user-images.githubusercontent.com/35637666/145621475-51c52fc1-5932-4781-8b16-29bee2e312ec.gif)

## getting started

* you can use the bot directly on [telegram](https://t.me/marhaba_defi_questions_vote_bot) you can chat with it directly or add it to your group

* you can host your own bot by:
  - fork this repo and install deps `npm i` or `yarn`
  - create a telegram bot by messaging botfather on [telegram](https://t.me/BotFather) and get you token - save it on safe place 🏃
  - add `.env` file and copy from `.env.example` you will need your bot token and assign it to `BOT_TOKEN`
  - now you will need to host your bot code you can use heroku make sure to add your config variable
  - congrats you have a questions vote bot 🥳
  
 ## feature that can be added
 
 * add a command to get last price of the project token, the change in the last 24 hours, week, or year
 * instead of local json you can use a real database to save all the questions for latter instead of resetting
 * 
 * make the max questions and date for reset configurable
 * add a command to get the 5, 10, 20 most upvoted questions
 * add unit tests to make sure all commands work correctly

