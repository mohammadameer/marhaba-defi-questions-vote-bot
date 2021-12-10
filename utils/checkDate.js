/*
  instead of using a cron job to reset questions every week, here we save the next monday date
  when a user use the bot we check if the date is greater than the last Date if yest we reset the questions
*/

export default function checkDate(ctx) {
  ctx.session.lastDate = ctx.session.lastDate || getNextLastDayOfTheWeek();

  if (new Date() > ctx.session.lastDate) {
    ctx.session.lastDate = getNextLastDayOfTheWeek();
    ctx.session.questions = [];
  } else {
    ctx.session.questions = ctx.session.questions || [];
  }
}

const getNextLastDayOfTheWeek = () => {
  let d = new Date();
  return d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
};
