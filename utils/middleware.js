const logger = require("./logger")
const User = require("../models/user")
const jwt = require("jsonwebtoken")

const requestLogger = (request, response, next) => {
  logger.info("Method: ", request.method)
  logger.info("Path: ", request.path)
  logger.info("Body: ", request.body)
  next()
}

const tokenExtractor = (request, response, next) => {
  const auth = request.get("authorization")
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    request.token = auth.substring(7)
    return next()
  }
  next()
}

const userExtractor = async (request, response, next) => {
  if (request.token) {
    let decodedToken = null
    try {
      decodedToken = jwt.verify(request.token, process.env.SECRET)
    } catch (err) {
      return next(err)
    }

    const user = await User.findById(decodedToken.id)
    request.user = user
  }
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted ID" })
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message })
  } else if (error.name === "JsonWebTokenError") {
    return response.status(401).json({ error: "invalid token" })
  } else if (error.name === "TokenExpiredError") {
    return response.status(401).json({
      error: "token expired",
    })
  }

  next(error)
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
}
