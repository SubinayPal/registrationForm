const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require("dotenv");
dotenv.config();


const port = process.env.PORT || 3000;

const username = "registrationFormDB";
const password = "Demo229";

mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.5icqmw6.mongodb.net/registrationFormDB`, {
  useNewUrlParser: true,
  useUnifiedTopology: true

}).then(() => {
  console.log("MongoDB connected successfully");
})
.catch(err => {
  console.error("MongoDB connection error:", err);
});


//Registration Schema
const registrationSchema = new mongoose.Schema({
  email: String,
  password: String,
  cpassword: String,
  fname: String,
  lname: String
})

//Model of registration schema

const Registration = mongoose.model('Registration', registrationSchema);



const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
})
app.post('/register', async (req, res) => {
  try {
    const { email, password, cpassword, fname, lname } = req.body;
    const existingUser = await Registration.findOne({ email: email });
    // if existing user is not found then create a new one and add it to the registration
    if (!existingUser) {

      const newUser = new Registration({
        email,
        password,
        cpassword,
        fname,
        lname
      });
      const user = await newUser.save(); // Save the user and await the promise
      console.log(user);
      res.redirect('/success');
    }
    else {
      console.log("User already exists");
      res.redirect('/error');
    }
  } catch (err) {
    console.error(err);
    res.redirect('/error');
  }
})

app.get('/success', (req, res) => {
  res.sendFile(__dirname + '/views/success.html')
})

app.get('/error', (req, res) => {
  res.sendFile(__dirname + '/views/error.html')
})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})