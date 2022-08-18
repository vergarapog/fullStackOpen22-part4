const totalLikes = require("../utils/list_helper.js").totalLikes
const favoriteBlog = require("../utils/list_helper.js").favoriteBlog

const mongoose = require("mongoose")
const supertest = require("supertest")
const Blog = require("../models/Blog")
const app = require("../app")

const api = supertest(app)

const blogs = [
  {
    _id: "5a422a851b54a676234d17f7",
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
    __v: 0,
  },
  {
    _id: "5a422aa71b54a676234d17f8",
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
    __v: 0,
  },
  {
    _id: "5a422b3a1b54a676234d17f9",
    title: "Canonical string reduction",
    author: "Edsger W. Dijkstra",
    url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    likes: 12,
    __v: 0,
  },
  {
    _id: "5a422b891b54a676234d17fa",
    title: "First class tests",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    likes: 10,
    __v: 0,
  },
  {
    _id: "5a422ba71b54a676234d17fb",
    title: "TDD harms architecture",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
    likes: 0,
    __v: 0,
  },
  {
    _id: "5a422bc61b54a676234d17fc",
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    likes: 2,
    __v: 0,
  },
]

const listWithOneBlog = [
  {
    _id: "5a422aa71b54a676234d17f8",
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
    __v: 0,
  },
]

beforeEach(async () => {
  await Blog.deleteMany({})

  const blogMongoObjs = blogs.map((b) => {
    return new Blog(b)
  })
  const arrayPromises = blogMongoObjs.map((b) => {
    return b.save()
  })
  await Promise.all(arrayPromises)
}, 15000)

describe("total likes", () => {
  test("of empty list is zero", () => {
    expect(totalLikes([])).toBe(0)
  })
  test("when list has only one blog equals the likes of that", () => {
    expect(totalLikes(listWithOneBlog)).toBe(5)
  })
  test("of a bigger list is calculated right", () => {
    expect(totalLikes(blogs)).toBe(36)
  })
})

describe("favorite blog", () => {
  test("returns the highest liked among an array", () => {
    expect(favoriteBlog(blogs)).toEqual({
      _id: "5a422b3a1b54a676234d17f9",
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
      __v: 0,
    })
  })
})

describe("api endpoint tests", () => {
  test("fetching all blogs", async () => {
    const returnedBlogs = await api.get("/api/blogs")
    // console.log(returnedBlogs.body)
    expect(returnedBlogs.body.length).toBe(blogs.length)
  })
  test("a blog object's unique identifier is defined in property id", async () => {
    const returnedBlogs = await api.get("/api/blogs")

    expect(returnedBlogs.body[0].id).toBeDefined()
  })
  test("a blog can be added", async () => {
    const blogsAtStart = blogs

    const toBeAddedBlog = {
      title: "Days of Frankfurt",
      author: "Frank Doghot",
      url: "hotdog.com",
      likes: 50,
    }

    const res = await api
      .post("/api/blogs")
      .send(toBeAddedBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    const blogsAtEnd = await api.get("/api/blogs")

    expect(blogsAtEnd.body).toHaveLength(blogs.length + 1)

    // const allContents = blogsAtEnd.body.reduce((accu, curr) => {
    //   return [...accu, curr.title]
    // }, [])

    const allContents = blogsAtEnd.body.map((b) => {
      return b.title
    })

    expect(allContents).toContain("Days of Frankfurt")
  })
  test("if a like property is missing from post request, it should be added and default to 0", async () => {
    const toBeAddedBlog = {
      title: "Frankfurt 2",
      author: "Frank Dog",
      url: "dsdsdas",
    }

    const result = await api
      .post("/api/blogs")
      .send(toBeAddedBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/)

    expect(result.body.likes).toBeDefined()
    expect(result.body.likes).toBe(0)
  })
  test("if title and url is missing from request, should receive code 400 - bad request", async () => {
    const toBeAddedBlog = {
      author: "Frank Dog",
    }

    await await api.post("/api/blogs").send(toBeAddedBlog).expect(400)
  })
  test("a blog can be deleted", async () => {
    const allBlogsAtStart = await api.get("/api/blogs")

    const firstBlog = allBlogsAtStart.body[0]

    await api.delete(`/api/blogs/${firstBlog.id}`).expect(204)

    const allBlogsAtEnd = await api.get("/api/blogs")

    expect(allBlogsAtEnd.body).toHaveLength(allBlogsAtStart.body.length - 1)
  })
  test("a like property of a blog can be updated", async () => {
    const allBlogsAtStart = await api.get("/api/blogs")
    const firstBlog = allBlogsAtStart.body[0]

    const updatedBlog = {
      ...firstBlog,
      likes: firstBlog.likes * 2,
    }

    await api.put(`/api/blogs/${firstBlog.id}`).send(updatedBlog).expect(200)

    const allBlogsAtEnd = await api.get("/api/blogs")
    const firstBlogAtEnd = allBlogsAtEnd.body[0]

    expect(firstBlogAtEnd.likes).toBe(firstBlog.likes * 2)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
