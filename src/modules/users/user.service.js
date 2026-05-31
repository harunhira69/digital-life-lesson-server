const { client } = require("../../config/db");

const usersCollection = () =>
  client.db("digital_life_lesson").collection("users");

const createUser = async (payload) => {
  return await usersCollection().insertOne(payload);
};

const findUserByEmail = async (email) => {
  return await usersCollection().findOne({
    email,
  });
};

const updateUser = async (email, payload) => {
  return await usersCollection().updateOne(
    { email },
    {
      $set: payload,
    }
  );
};

const getAllUsers = async () => {
  return await usersCollection()
    .find()
    .toArray();
};

module.exports = {
  createUser,
  findUserByEmail,
  updateUser,
  getAllUsers,
};