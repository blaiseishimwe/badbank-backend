const emailValidator = require("email-validator");
const passwordValidator = require("password-validator");
const mongoose = require("mongoose");
const { Users } = require("../Models/User");
const { UserBalances } = require("../Models/Balance");
const { ObjectId } = require("mongodb");

const { admins } = require("../Models/Admin");

/*
Set up password-validator
*/
var schema = new passwordValidator();

// Add properties to it
schema
  .is()
  .min(8) // Minimum length 8
  .is()
  .max(12) // Maximum length 12
  .has()
  .uppercase() // Must have uppercase letters
  .has()
  .lowercase() // Must have lowercase letters
  .has()
  .digits(1) // Must have at least 1 digits
  .has()
  .not()
  .spaces(); // Should not have spaces

function validateUserInfo(req, res, next) {
  const { email, fullname, password } = req.body;

  if (email === undefined || fullname === undefined || password === undefined) {
    return res
      .status(400)
      .json({ error: "email, fullname, and password are ALL required" });
  }

  const isValidEmail = emailValidator.validate(email);
  const isValidPassword = schema.validate(password);
  const isValidFullName = fullname.length !== 0 && fullname.includes(" ");

  if (isValidPassword === false) {
    return res.status(400).json({
      error:
        "Your password must be a Minimum length 8, a Maximum length 12, a Must have uppercase letters, a Must have lowercase letters, a Must have at least 1 digits and Should not have spaces",
    });
  }

  if (isValidEmail === false) {
    return res.status(400).json({
      error: "Please enter a valid email",
    });
  }

  if (isValidFullName === false) {
    return res.status(400).json({
      error: "Please enter a valid full name",
    });
  }

  next();
}

async function validateLogin(req, res, next) {
  const { email, password } = req.body;

  // check if we have a user by that email
  const possibleUser = await Users.findOne({ email }).exec();
  if (possibleUser === null) {
    return res
      .status(404)
      .json({ error: "User with that email does not exit" });
  }

  // check if this user entered the saved password
  if (password !== possibleUser.password) {
    return res.status(400).json({ error: "Wrong password" });
  }

  next();
}

function validateDeposits(req, res, next) {
  const { depositAmount } = req.body;

  if (depositAmount <= 0) {
    return res
      .status(400)
      .json({ error: "Please enter a valid amount to deposit" });
  }

  next();
}

async function validateWithdraws(req, res, next) {
  const { id } = req.query;
  const { withdrawAmount } = req.body;

  if (typeof withdrawAmount !== "number") {
    return res
      .status(400)
      .json({ error: "Please enter a valid number to withdraw" });
  }

  if (withdrawAmount <= 0) {
    return res
      .status(400)
      .json({ error: "Please enter a valid amount to withdraw" });
  }

  const currentUser = await UserBalances.findOne({ _id: ObjectId(id) }).exec();

  if (withdrawAmount > currentUser.balance) {
    return res.status(400).json({
      error: "Insufficient amount, please check your balance and try again!",
    });
  }

  next();
}

function validateAdminInfo(req, res, next) {
  const { email, fullname, password } = req.body;

  if (email === undefined || fullname === undefined || password === undefined) {
    return res
      .status(400)
      .json({ error: "email, fullname, and password are ALL required" });
  }

  const isValidEmail = emailValidator.validate(email);
  const isValidPassword = schema.validate(password);
  const isValidFullName = fullname.length !== 0 && fullname.includes(" ");

  if (isValidPassword === false) {
    return res.status(400).json({
      error:
        "Your password must be a Minimum length 8, a Maximum length 12, a Must have uppercase letters, a Must have lowercase letters, a Must have at least 1 digits and Should not have spaces",
    });
  }

  if (isValidEmail === false) {
    return res.status(400).json({
      error: "Please enter a valid email",
    });
  }

  if (isValidFullName === false) {
    return res.status(400).json({
      error: "Please enter a valid full name",
    });
  }

  next();
}

function validateAdminLogin(req, res, next) {
  const { email, password } = req.body;

  // check if we have a user by that email
  const possibleAdmin = admins[email];
  if (possibleAdmin === undefined) {
    return res
      .status(404)
      .json({ error: "User with that email does not exit" });
  }

  // check if this user entered the saved password
  if (password !== possibleAdmin.password) {
    return res.status(400).json({ error: "Wrong password" });
  }

  next();
}

function validateMongoDbId(req, res, next) {
  const { id } = req.query;
  if (id === undefined) {
    return res.status(400).json({ error: "id is required" });
  }

  if (!mongoose.isObjectIdOrHexString(id)) {
    return res.status(400).json({
      error:
        "invalid id. id must be a string of 12 bytes or a string of 24 hex characters",
    });
  }

  next();
}

async function validateUserExists(req, res, next) {
  const { id } = req.query;

  try {
    const possibleUser = await UserBalances.findById({ _id: ObjectId(id) });
    if (possibleUser === null) {
      return res.status(404).json({ error: "User by that id not found" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: "connection to database failed" });
  }
}

module.exports = {
  validateUserInfo,
  validateLogin,
  validateDeposits,
  validateWithdraws,
  validateAdminInfo,
  validateAdminLogin,
  validateMongoDbId,
  validateUserExists,
};
