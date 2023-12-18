const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')

const dbPath = path.join(__dirname, 'userData.db')
let db

const initializeDB_Server = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})
    app.listen(3000, () => {
      console.log('server running baby')
    })
  } catch (error) {
    console.log(`DB Error:${error}`)
    process.exit(1)
  }
}

app.post('/register/', async (request, response) => {
  const details = request.body
  const {username, name, password, gender, location} = details
  const getUserQuery = `SELECT * FROM user where username="${username}";`
  const dbUser = await db.get(getUserQuery)

  if (dbUser === undefined) {
    if (password.length >= 5) {
      const hashedPswrd = await bcrypt.hash(password, 10)
      const registerUserQuery = `INSERT INTO user(username,name,password, gender, location)
    VALUES ('${username}', '${name}', '${hashedPswrd}','${gender}',${location})
    `
      await db.run(registerUserQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const details = request.body
  const {username, password} = details

  const getUserQuery = `SELECT * FROM user where username="${username}";`
  const dbUser = await db.get(getUserQuery)

  if (dbUser !== undefined) {
    const isPasswordCorrect = await bcrypt.compare(password, dbUser.password)
    if (isPasswordCorrect) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  } else {
    response.status(400)
    response.send('Invalid user')
  }
})

app.put('/change-password', async (request, response) => {
  const details = request.body
  const {username, oldPassword, newPassword} = details
  const getUserQuery = `SELECT * FROM user where username="${username}";`
  const dbUser = await db.get(getUserQuery)

  const isPasswordCorrect = await bcrypt.compare(oldPassword, dbUser.password)
  if (isPasswordCorrect) {
    if (newPassword.length >= 5) {
      const updateUserQuery = `UPDATE user SET 
                                password='${newPassword}'
                                WHERE username='${username}'`
      await db.run(updateUserQuery)
      response.status(200)
      response.send('Password updated')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

initializeDB_Server()
module.exports = app
