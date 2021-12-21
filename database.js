import { MongoClient as mongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;

const dbLink = "marhaba-questions-vote-bot";
const questionsCollection = "questions";

let insert = function (data, collectionName = questionsCollection) {
  return new Promise((resolve, reject) => {
    try {
      mongoClient.connect(uri, (err, client) => {
        if (err) {
          reject(err);
          return;
        }
        const db = client.db(dbLink).collection(collectionName);
        db.insertOne(data, (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
            client.close();
          }
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};
let update = function (query, data, collectionName = questionsCollection) {
  return new Promise((resolve, reject) => {
    try {
      mongoClient.connect(uri, (err, client) => {
        if (err) {
          reject(err);
          return;
        }
        let groups = client.db(dbLink).collection(collectionName);
        groups
          .updateOne(query, data)
          .then((res) => {
            client.close();
            resolve(res);
          })
          .catch((error) => {
            console.log(
              `database error in ${collectionName} group update ` + error,
              "error"
            );
            reject(error);
          });
      });
    } catch (error) {
      reject(error);
    }
  });
};

let remove = function (query, collectionName = questionsCollection) {
  return new Promise((resolve, reject) => {
    try {
      mongoClient.connect(uri, (err, client) => {
        if (err) {
          reject(err);
          return;
        }

        let groups = client.db(dbLink).collection(collectionName);
        groups
          .deleteOne(query)
          .then((res) => {
            client.close();
            resolve(res);
          })
          .catch((error) => {
            console.log("database error in function query " + error, "error");
          });
      });
    } catch (error) {
      reject(error);
    }
  });
};
var query = function (query = {}, collectionName = questionsCollection) {
  return new Promise((resolve, reject) => {
    try {
      mongoClient.connect(uri, (err, client) => {
        if (err) {
          console.log("QUERY IN DATABASE", err);
          resolve([]);
          return;
        }
        const db = client.db(dbLink).collection(collectionName);
        db.find(query).toArray((err, res) => {
          if (err) {
            console.log("QUERY IN DATABASE", err);
            resolve([]);
          } else {
            if (res) resolve(res);
            else resolve([]);
            client.close();
          }
        });
      });
    } catch (error) {
      console.log("QUERY IN DATABASE", error);
      resolve([]);
    }
  });
};

let newQuestion = async ({ number, question }) => {
  // Insert question to 'questions' collection
  await insert({ number, question, votes: 0 });
};

let deleteQuestion = async ({ number }) => {
  const res = await remove({ number });
  return res;
};

let updateQuestion = async ({ number, data }) => {
  const question = await update({ number }, data);
  return question;
};

let getQuestion = async ({ number }) => {
  let question = await query({ number });

  return question ? question[0] : null;
};

let getAllQuestions = async () => {
  let questions = await query();

  return questions;
};

export default {
  newQuestion,
  deleteQuestion,
  updateQuestion,
  getQuestion,
  getAllQuestions,
};
