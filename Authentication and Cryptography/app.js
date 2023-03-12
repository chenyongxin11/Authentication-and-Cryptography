import * as dotenv from 'dotenv'
dotenv.config()
import express from 'express'
const app = express()
import mongoose from 'mongoose'
import ejs from 'ejs'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import flash from 'connect-flash'
import bodyParser from 'body-parser'
import User from './models/User.js'
import bcrypt, { hash } from 'bcrypt'
const saltRounds = 10

app.set('view engine', 'ejs')
// middlewares
app.use(express.static('public'))
app.use(cookieParser(process.env.SECRET))
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  }),
)
app.use(flash())
app.use(bodyParser.urlencoded({ extended: true }))

const LoginVerify = (req, res, next) => {
  if (req.session.isVerified !== true) {
    res.redirect('login')
  } else {
    next()
  }
}

mongoose
  .connect('mongodb://127.0.0.1:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to mongodb.')
  })
  .catch((e) => {
    console.log(e)
  })

app.get('/', (req, res) => {
  res.send('home page')
})

app.get('/main', LoginVerify, (req, res) => {
  res.render('main.ejs')
})

app.get('/signup', (req, res) => {
  res.render('signup.ejs')
})

app.post('/signup', async (req, res) => {
  let { username, pwd } = req.body
  let foundUser = await User.findOne({ username })
  if (foundUser) {
    res.send('This username had been used')
  } else {
    bcrypt.genSalt(saltRounds, (err, salt) => {
      if (err) {
        next(err)
      }
      bcrypt.hash(pwd, salt, (err, hash) => {
        let newUser = new User({ username, pwd: hash })
        try {
          newUser
            .save()
            .then(() => {
              res.send('data has been saved')
            })
            .catch((e) => {
              console.log(e)
              res.send('failed to save')
            })
        } catch (e) {
          console.log(e)
          next(e)
        }
      })
    })
  }
})

app.get('/login', (req, res) => {
  res.render('login.ejs')
})

app.post('/login', async (req, res, next) => {
  let { username, pwd } = req.body
  try {
    let foundUser = await User.findOne({ username })
    if (foundUser) {
      bcrypt.compare(pwd, foundUser.pwd, (err, result) => {
        if (err) {
          next(err)
        }
        if (result) {
          req.session.isVerified = true
          res.render('main.ejs')
        } else {
          res.send('Username or Pwd not correct')
        }
      })
    } else {
      res.send('Username or Pwd not correct')
    }
  } catch (e) {
    next(e)
  }
})

app.get('/*', (req, res) => {
  res.status(404).send('404 Page Not Found.')
})

app.use((err, req, res, next) => {
  console.log(err)
  res.status(500).send('Something is wrong, we will fix it soon.')
})

app.listen(3000, () => {
  console.log('Server running on port 3000.')
})
