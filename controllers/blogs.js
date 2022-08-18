const blogsRouter = require("express").Router()
const Blog = require("../models/blog")

blogsRouter.get("/", (request, response) => {
  Blog.find({}).then((blogs) => {
    response.json(blogs)
  })
})

blogsRouter.post("/", (request, response, next) => {
  let incomingBlog = request.body

  if (!incomingBlog.likes) {
    incomingBlog = { ...incomingBlog, likes: 0 }
  }

  if (!incomingBlog.title && !incomingBlog.title) {
    response.status(400).end()
  }

  let blog = new Blog(incomingBlog)

  blog
    .save()
    .then((result) => {
      response.status(201).json(result)
    })
    .catch((err) => next(err))
})

blogsRouter.delete("/:id", async (request, response, next) => {
  try {
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
  } catch (err) {
    next(err)
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

blogsRouter.delete("/devdelete", async (request, response) => {
  await Blog.deleteMany({})
})

module.exports = blogsRouter
