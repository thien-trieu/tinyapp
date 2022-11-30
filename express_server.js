const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; 

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const usersDatabase = {
  abc: {
    id: 'abc',
    email: 'a@a.com',
    password: '1234'
  }
}

//Generate random short URL ID
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
//returns null if user does not exist, returns user object if found
const getUserByEmail = (email) => {
  let result = null
  for (let ids in usersDatabase){
    if (email === usersDatabase[ids].email) {
      result = usersDatabase[ids]
    } 
  }
  return result
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
  const templateVars = { 
    urls: urlDatabase,
    user: usersDatabase[req.cookies.user_id]
  };

  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: usersDatabase[req.cookies.user_id]
  };

  // if user is logged in, redirect user
  if (req.cookies.user_id){
    return res.redirect('urls')
  }

  res.render("register", templateVars)
});

app.post("/register", (req, res) => {
  const id = generateRandomString()
  const email = req.body.email
  const password = req.body.password
  const user = getUserByEmail(email)


  if (!email || !password) {
    return res
    .status(400)
    .send('Error: You did not enter your email/password to register')
  } 
  
  if (user !== null) {
    return res
    .status(400)
    .send('Error: Email already exist')
    
  } 

  // adding user info to userDatabase
  usersDatabase[id] = {id: id, email: email, password: password}
  // storing user_id in cookie
  res.cookie('user_id', id)
  res.redirect('/urls')
  
})

app.get("/login", (req, res) => {
  const templateVars = {
    user: usersDatabase[req.cookies.user_id]
  };

  // if user is logged in, redirect user
  if (req.cookies.user_id){
    return res.redirect('urls')
  }
  

  res.render("login", templateVars);
})
// where form is for creating new shortURL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: usersDatabase[req.cookies.user_id]
  };
  
  res.render("urls_new", templateVars);
});

// submit form for new shortURL then get redirected to /urls/shortId path
app.post("/urls", (req, res) => {
  const shortId = generateRandomString();
  urlDatabase[shortId] = req.body.longURL;

  res.redirect(`/urls/${shortId}`);
});


app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls/");
});

// edit shortURL with a different longURL
app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls/");
});


app.post('/login', (req,res) =>{
  const email = req.body.email
  const password = req.body.password

  console.log('email:', email, 'Password:', password)

  let user = getUserByEmail(email)

  console.log('user', user)

  if (!user){
   return res.status(403).send('Error: Email does not exist, please try again!')
  }

  if (user.password !== password){
    return res.status(403).send('Error: Password is incorrect, please try again!')
  }

  console.log('user_id:', user.id)
  // then set the cookie
  res.cookie('user_id', user.id)
  res.redirect('/urls/')
})

app.post('/logout', (req, res) =>{
  res.clearCookie('user_id', req.body.user_id)
  res.redirect('/login')
})

// shortId path
app.get("/urls/:id", (req, res) => {

  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    user: usersDatabase[req.cookies.user_id]
   };

  res.render("urls_show", templateVars);
});

// if you click on shortId on the page, you then get redirected to the longURL 
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});