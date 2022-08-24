const blogsRouter = require("express").Router()
const Blog = require("../models/blog")
const User = require("../models/user")
const jwt = require("jsonwebtoken")

blogsRouter.get("/", async (request, response) => {
  // Blog.find({}).then((blogs) => {
  //   response.json(blogs)
  // })

  const blogs = await Blog.find({}).populate("user", { name: 1, username: 1 })
  response.json(blogs)
})

blogsRouter.get("/:id", async (request, response, next) => {
  try {
    const blog = await Blog.findById(request.params.id)
    if (blog) {
      return response.json(blog)
    } else {
      return response.status(404).json({ error: "blog not found" })
    }
  } catch (err) {
    next(err)
  }
})

blogsRouter.delete("/devdelete", async (request, response) => {
  await Blog.deleteMany({})
  response.status(204)
})

blogsRouter.post("/", async (request, response, next) => {
  let incomingBlog = request.body

  if (!incomingBlog.likes) {
    incomingBlog = { ...incomingBlog, likes: 0 }
  }

  if (!incomingBlog.title || !incomingBlog.author) {
    return response.status(400).end()
  }

  let decodedToken
  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET)
  } catch (err) {
    return next(err)
  }

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: "token missing or invalid" })
  }

  const user = await User.findById(decodedToken.id)
  if (!user) {
    return response.status(404).json({ error: "user not found" }).end()
  }

  const blog = new Blog({
    title: incomingBlog.title,
    author: incomingBlog.author,
    url: incomingBlog.url,
    likes: incomingBlog.likes,
    user: user._id,
  })

  try {
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog)
  } catch (err) {
    next(err)
  }

  // blog
  //   .save()
  //   .then((result) => {
  //     response.status(201).json(result)
  //   })
  //   .catch((err) => next(err))
})

blogsRouter.delete("/:id", async (request, response, next) => {
  let decodedToken = null
  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET)
  } catch (err) {
    return next(err)
  }

  const blogToBeDeleted = await Blog.findById(request.params.id)
  console.log(blogToBeDeleted)
  const doesUserOwnBlog =
    blogToBeDeleted.user.toString() === decodedToken.id ? true : false
  if (doesUserOwnBlog) {
    try {
      await Blog.findByIdAndRemove(request.params.id)
      return response.status(204).end()
    } catch (err) {
      return next(err)
    }
  } else {
    return response.status(401).json({ error: "wrong user" })
  }
})

blogsRouter.put("/:id", async (request, response, next) => {
  const body = request.body

  const newBlog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  }

  try {
    const res = await Blog.findByIdAndUpdate(request.params.id, newBlog, {
      new: true,
    })
    response.json(res)
  } catch (err) {
    next(err)
  }
})

module.exports = blogsRouter
