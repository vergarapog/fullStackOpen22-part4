const usersRouter = require("express").Router()
const User = require("../models/user")
const bcrypt = require("bcrypt")

usersRouter.get("/", async (request, response) => {
  const users = await User.find({}).populate("blogs", {
    title: 1,
    url: 1,
    author: 1,
  })
  response.json(users)
})

usersRouter.post("/", async (request, response, next) => {
  const { username, password, name } = request.body

  if (!username || !password) {
    return response.status(400).json({ error: "invalid username or password" })
  }

  if (password.length < 3) {
    return response
      .status(400)
      .json({ error: "password must be at least 3 characters long" })
  }

  const ifUserExists = await User.findOne({ username })
  if (ifUserExists) {
    return response.status(400).json({ error: "username must be unique" })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  try {
    const savedUser = await user.save()
    response.status(201).json(savedUser)
  } catch (err) {
    return next(err)
  }
})

module.exports = usersRouter
