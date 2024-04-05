const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
const retry = require('retry');
dotenv.config();

const port = process.env.PORT || 3000;

const username = "registrationFormDB";
const password = "Demo229";
const connectionString = `mongodb+srv://${username}:${password}@cluster0.5icqmw6.mongodb.net/registrationFormDB`;

// Define Registration Schema
const registrationSchema = new mongoose.Schema({
  email: String,
  password: String,
  cpassword: String,
  fname: String,
  lname: String
});

// Define Registration Model
const Registration = mongoose.model('Registration', registrationSchema);

// Retry configuration
const operation = retry.operation({
  retries: 5, // Number of retry attempts
  factor: 2, // Exponential backoff factor
  minTimeout: 1000, // Minimum delay before retrying (in milliseconds)
  maxTimeout: 60000, // Maximum delay before retrying (in milliseconds)
});

// Connect to MongoDB with retry logic
function connectWithRetry(callback) {
  operation.attempt((currentAttempt) => {
    console.log(`Attempting to connect to MongoDB (attempt ${currentAttempt})`);
    mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
      .then(() => {
        console.log("Connected to MongoDB successfully");
        callback(null);
      })
      .catch((error) => {
        console.log(`Error connecting to MongoDB (attempt ${currentAttempt}):`, error.message);
        if (operation.retry(error)) {
          console.log(`Retrying connection to MongoDB (attempt ${currentAttempt + 1})...`);
          return;
        }
        callback(error);
      });
  });
}

// Event listener for successful connection
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

// Start connection with retry logic
connectWithRetry((error) => {
  if (error) {
    console.error('Failed to connect to MongoDB after retries:', error);
  } else {
    // Start your application logic here
    const app = express();
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.get('/', (req, res) => {
      res.sendFile(__dirname + '/views/index.html');
    });

    app.post('/register', async (req, res) => {
      try {
        const { email, password, cpassword, fname, lname } = req.body;
        const existingUser = await Registration.findOne({ email: email });
        if (!existingUser) {
          const newUser = new Registration({ email, password, cpassword, fname, lname });
          const user = await newUser.save();
          console.log(user);
          res.redirect('/success');
        } else {
          console.log("User already exists");
          res.redirect('/error');
        }
      } catch (err) {
        console.error(err);
        res.redirect('/error');
      }
    });

    app.get('/success', (req, res) => {
      res.sendFile(__dirname + '/views/success.html');
    });

    app.get('/error', (req, res) => {
      res.sendFile(__dirname + '/views/error.html');
    });

    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  }
});
