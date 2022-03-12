require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  validateUserInfo,
  validateLogin,
  validateDeposits,
  validateWithdraws,
  validateAdminInfo,
  validateAdminLogin,
  validateMongoDbId,
  validateUserExists,
} = require("./Midleware");
const mongoose = require("mongoose");
const { Users } = require("./Models/User");
const { UserBalances } = require("./Models/Balance");
const { ObjectId } = require("mongodb");

const { admins } = require("./Models/Admin");
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.qjyik.mongodb.net/${process.env.MONGO_DB_NAME}?retryWrites=true&w=majority`;

mongoose
  .connect(uri)
  .then(() => {
    app.post("/admins", validateAdminInfo, (req, res) => {
      const { email, fullname, password } = req.body;

      admins[email] = {
        email,
        fullname,
        password,
      };

      console.table(admins);

      res.send(admins[email]);
    });

    app.post("/adminlogin", validateAdminLogin, (req, res) => {
      //const { email } = req.body;
      res.send({ users, usersBalances });
    });

    app.post("/users", validateUserInfo, async (req, res) => {
      // Make sure that the body has email, fullname, and password
      // If even ONE is missing, we can't process this request
      const { email, fullname, password } = req.body;

      try {
        // Check that a user with that email doesn't already exist
        const currentUser = await Users.findOne({ email }).exec();

        // A user with that email already exists
        if (currentUser !== null) {
          return res.status(400).json({ error: "User already exists" });
        }

        // Didn't find a user with that email, so create a new one
        const newUser = new Users({ email, password, fullname });
        newUser.save();

        // After creating a new user, use the same email to create them a balance
        const newUserBalance = new UserBalances({ email });
        const balance = await newUserBalance.save();

        // Send to the client the balance info of this new user
        res.send(balance);
      } catch (error) {
        console.log(error);
      }
    });

    app.post("/login", validateLogin, async (req, res) => {
      const { email } = req.body;

      const currentUser = await UserBalances.findOne({ email }).exec();

      res.send(currentUser);
    });

    // Route to deposit (update balance)
    // Accepts an ?id query parameter for balance id (sent after creating account)
    // Accepts a depositAmount in the body of the request
    // Sends back an update balance
    // PUT /balances/deposit?id=
    app.put(
      "/balances/deposit",
      validateMongoDbId,
      validateUserExists,
      validateDeposits,

      async (req, res) => {
        const { id } = req.query;
        const { depositAmount } = req.body;

        try {
          const newBalance = await UserBalances.findByIdAndUpdate(
            { _id: ObjectId(id) },
            { $inc: { balance: depositAmount } },
            { new: true }
          );

          res.send(newBalance);
        } catch (error) {
          console.log(error);
          return res
            .status(500)
            .json({ error: "connectiont to database failed" });
        }
      }
    );

    // Route to withdraw (update balance)
    // Accepts an ?id query parameter for balance id (sent after creating account)
    // Accepts a withdrawAmount in the body of the request
    // Sends back an update balance
    // PUT /balances/withdraw?id=
    app.put(
      "/balances/withdraw",
      validateMongoDbId,
      validateUserExists,
      validateWithdraws,
      async (req, res) => {
        const { id } = req.query;
        const { withdrawAmount } = req.body;

        try {
          const amountToDecreateBy = -1 * withdrawAmount;

          const newBalance = await UserBalances.findByIdAndUpdate(
            { _id: ObjectId(id) },
            { $inc: { balance: amountToDecreateBy } },
            { new: true }
          );

          res.send(newBalance);
        } catch (error) {
          console.log(error);
          return res
            .status(500)
            .json({ error: "connectiont to database failed" });
        }
      }
    );

    app.get("/test", (req, res) => {
      res.send("<h1>Welcome to BadBank API</h1>");
    });

    app.listen(PORT);
  })
  .catch((err) => {
    console.log(err);
  });
