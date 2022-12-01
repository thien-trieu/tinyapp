const express = require("express");
const cookieSession = require('cookie-session');
const morgan = require("morgan");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 8080; 

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"))

app.use(cookieSession({
  name: 'session',
  keys: ['whatismysecretkeygoingtobe', 'imnotsurewhatitsgoingtobe']

}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "lbbg1M",
  }
};

const usersDatabase = {
  lbbg1M: {
    id: 'lbbg1M',
    email: 'hello@itsme.com',
    password: '$2a$10$baVx1exxSjurnseSg/Bt/OdfA.gM2rHmYYNJg6nbnm1uFW0vW4.nW'
  }
}

// generate random URL ID / User ID
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function generateRandomString() {
  let result = "";
  const length = 6;
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// returns null if user does not exist, returns user object if found.
const getUserByEmail = (email, database) => {
  let result = null
  for (let ids in database){
    if (email === database[ids].email) {
      result = database[ids]
    } 
  }
  return result
}

// returns url database for specific user only. returns undefined if id is not found in urldatabase.
const urlsForUser = (id) => {
  let obj = {}
 
   for (let ids in urlDatabase){
     if (id === urlDatabase[ids].userID){
       obj[ids] = urlDatabase[ids]
     }
   }
   return obj
 }
 

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id)
  
  const templateVars = { 
    urls: userUrls,
    user: usersDatabase[req.session.user_id]
  };
  
  console.log('user database:', usersDatabase)
  console.log('url database:', urlDatabase)

  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  
  // if user is already logged in, redirect user.
  if (req.session.user_id){
    return res.redirect('/urls')
  }
  
  const templateVars = {
    user: usersDatabase[req.session.user_id]
  };

  res.render("register", templateVars)
});

app.post("/register", (req, res) => {
  const id = generateRandomString()

  const email = req.body.email
  const password = req.body.password

  const user = getUserByEmail(email, usersDatabase)
  const hashedPassword = bcrypt.hashSync(password, 10);

  // must enter a email and password to register
  if (!email || !password) {
    return res
    .status(400)
    .send('Unable to complete registration. You did not enter your email/password to register.')
  } 
  
  // can not register with an existing email
  if (user !== null) {
    return res
    .status(400)
    .send('Unable to complete registration. The email you entered already exist. Please log in if you are already registered.')
    
  } 

  // If registration is successful, add user info to userDatabase.
  usersDatabase[id] = {
    id: id, 
    email: email, 
    password: hashedPassword
  }

  // store user_id session in cookie and redirect user.
  req.session.user_id = id
  res.redirect('/urls')
})

app.get("/login", (req, res) => {
  const templateVars = {
    user: usersDatabase[req.session.user_id]
  };

  // if user is logged in, redirect user
  if (req.session.user_id) {
    return res.redirect('/urls')
  }
  
  res.render("login", templateVars);
})

// where form is for creating new shortURL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: usersDatabase[req.session.user_id]
  };

  if (!req.session.user_id){
    return res.redirect('/login')
  }

  res.render("urls_new", templateVars);
});

// submit form for new shortURL then get redirected to /urls/shortId path
app.post("/urls", (req, res) => {
  const shortId = generateRandomString();
  urlDatabase[shortId] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  };

  if (!req.session.user_id){
    return res.send('Sorry you are not logged in. Please login to create new short URL')
  }

  res.redirect(`/urls/${shortId}`);
});


app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id
  const userId = req.session.user_id
  const userUrls = urlsForUser(req.session.user_id)

  // should return a relevant error message if id does not exist
  if (urlDatabase[id] === undefined){
    return res.send("Sorry, the URL you are trying to delete does not exist :(")
  }

  // should return a relevant error message if the user is not logged in
  if (!req.session.user_id) {
    return res.send("Sorry, you can not delete a URL if you are not logged in :(")
  }

  // should return a relevant error message if the user does not own the URL
  if (userUrls[id].userID !== userId){
    return res.send('Sorry, you can not delete a URL that you do not own :(')
  }

  delete urlDatabase[id];
  res.redirect("/urls/");
});

// edit shortURL with a different longURL
app.post('/urls/:id', (req, res) => {
  const id = req.params.id
  const userId = req.session.user_id
  const userUrls = urlsForUser(req.session.user_id)

  // should return a relevant error message if id does not exist
  if (urlDatabase[id] === undefined){
    return res.send("Sorry, the short URL you are trying to edit does not exist")
  }

  // should return a relevant error message if the user is not logged in
  if (!req.session.user_id) {
    return res.send("Sorry, you can not edit a URL if you are not logged in")
  }

  // should return a relevant error message if the user does not own the URL
  if (userUrls[id].userID !== userId){
    return res.send('Sorry you can not edit this page')
  }

  urlDatabase[id] = {
    longURL: req.body.longURL,
    userID: userId
  };

  res.redirect("/urls/");
});


app.post('/login', (req,res) =>{
  const email = req.body.email
  const password = req.body.password


  const user = getUserByEmail(email, usersDatabase)
  const userId = user.id

  if (!user){
   return res.status(403).send('Error: Email does not exist, please try again!')
  }

  const hashedPassword = usersDatabase[userId].password
  const passwordWorks = bcrypt.compareSync(password, hashedPassword)

  console.log('pw', password)
  console.log('pw works:', passwordWorks)
  console.log('hashed pw:', hashedPassword)
  console.log('user db:', usersDatabase)
  console.log('user', user)

  if (!passwordWorks){
    return res.status(403).send('Error: Password is incorrect, please try again!')
  }

  req.session.user_id = userId
  // res.cookie('user_id', userId)
  res.redirect('/urls/')
})

app.post('/logout', (req, res) =>{

  req.session = null
  // res.clearCookie('user_id')
  res.redirect('/login')
})

// shortId path
app.get("/urls/:id", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id)
  const id = req.params.id

  if (!req.session.user_id) {
    return res.send("You must be logged in to view this page.")
  }

  if (!urlDatabase[req.params.id]){
    return res.send("The Short URL ID does not exist! Please try again.")
  }

  if (userUrls[id] === undefined){
    return res.send("This short URL does not belong to you.")
  }

  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id].longURL,
    user: usersDatabase[req.session.user_id]
   };

  res.render("urls_show", templateVars);
});

// if you click on shortId on the page, you then get redirected to the longURL 
app.get("/u/:id", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id)
  const id = req.params.id

  if (!req.session.user_id) {
    return res.send("You must be logged in to view this page :(")
  }

  if (!urlDatabase[req.params.id]){
    return res.send("The Short URL ID does not exist! Please try again.")
  }

  if (userUrls[id] === undefined){
    return res.send("This short URL does not belong to you :(")
  }

  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});