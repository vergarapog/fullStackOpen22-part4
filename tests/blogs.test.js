const totalLikes = require("../utils/list_helper.js").totalLikes
const favoriteBlog = require("../utils/list_helper.js").favoriteBlog

const mongoose = require("mongoose")
const supertest = require("supertest")
const Blog = require("../models/Blog")
const User = require("../models/user")
const bcrypt = require("bcrypt")
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
describe("blog tests", () => {
  describe("- general api blog endpoint tests", () => {
    test("fetching all blogs", async () => {
      const returnedBlogs = await api.get("/api/blogs")
      // console.log(returnedBlogs.body)
      expect(returnedBlogs.body.length).toBe(blogs.length)
    })
    test("a blog object's unique identifier is defined in property id", async () => {
      const returnedBlogs = await api.get("/api/blogs")

      expect(returnedBlogs.body[0].id).toBeDefined()
    })
  })

  describe("- adding a blog", () => {
    test("a blog can be added", async () => {
      //login and get token first
      const userLoginInfo = await api
        .post("/api/login")
        .send({ username: "root", password: "root" })

      const toBeAddedBlog = {
        title: "Days of Frankfurt",
        author: "Frank Doghot",
        url: "hotdog.com",
        likes: 50,
      }

      const res = await api
        .post("/api/blogs")
        .send(toBeAddedBlog)
        .set("Authorization", `Bearer ${userLoginInfo.body.token}`)
        .expect(201)
        .expect("Content-Type", /application\/json/)

      const blogsAtEnd = await api.get("/api/blogs")

      expect(blogsAtEnd.body).toHaveLength(blogs.length + 1)

      const allContents = blogsAtEnd.body.map((b) => {
        return b.title
      })

      expect(allContents).toContain("Days of Frankfurt")
    })
    test("adding a blog fails with status 401 if token is not provided", async () => {
      const toBeAddedBlog = {
        title: "Days of Frankfurt",
        author: "Frank Doghot",
        url: "hotdog.com",
        likes: 50,
      }

      const res = await api.post("/api/blogs").send(toBeAddedBlog).expect(401)

      const blogsAtEnd = await api.get("/api/blogs")

      expect(blogsAtEnd.body).toHaveLength(blogs.length)
    })
    test("if a like property is missing from post request, it should be added and default to 0", async () => {
      //login and get token first
      const userLoginInfo = await api
        .post("/api/login")
        .send({ username: "root", password: "root" })

      const toBeAddedBlog = {
        title: "Frankfurt 2",
        author: "Frank Dog",
        url: "dsdsdas",
      }

      const result = await api
        .post("/api/blogs")
        .send(toBeAddedBlog)
        .set("Authorization", `Bearer ${userLoginInfo.body.token}`)
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
  })

  describe("- updating of a blog", () => {
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

  describe("- deletion of a blog", () => {
    test("a blog can be deleted with a valid user and token", async () => {
      //login and get token first
      const userLoginInfo = await api
        .post("/api/login")
        .send({ username: "root", password: "root" })

      //send a post request with the blog and its user to be deleted
      const blogToBeDeleted = {
        title: "blog1",
        author: "blog1",
        url: "blog1",
        likes: 10,
      }
      await api
        .post("/api/blogs")
        .send(blogToBeDeleted)
        .set("Authorization", `Bearer ${userLoginInfo.body.token}`)

      const allBlogsAtStart = await api.get("/api/blogs")

      //find the sent blog to be deleted in the database
      const blogInDb = await Blog.findOne({ title: "blog1" })

      //delete the blog and supply a valid token
      await api
        .delete(`/api/blogs/${blogInDb.id}`)
        .set("Authorization", `Bearer ${userLoginInfo.body.token}`)
        .expect(204)

      const allBlogsAtEnd = await api.get("/api/blogs")

      expect(allBlogsAtEnd.body).toHaveLength(allBlogsAtStart.body.length - 1)
    })
  })
})

describe("- user tests", () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash("root", 10)

    const validUser = new User({
      username: "root",
      name: "root",
      passwordHash: passwordHash,
    })

    await validUser.save()
  })
  describe("creation of a user", () => {
    test("fails with status code 400 if username or password is not provided", async () => {
      const newUser = {
        name: "Brian",
      }

      await api.post("/api/users").send(newUser).expect(400)
    })
    test("fails with status code 400 if password length is less than 3", async () => {
      const newUser = {
        username: "Brian",
        name: "Brian",
        password: "br",
      }

      await api.post("/api/users").send(newUser).expect(400)
    })
    test("fails with status code 400 if username length is less than 3", async () => {
      const newUser = {
        username: "br",
        name: "Brian",
        password: "brian",
      }

      await api.post("/api/users").send(newUser).expect(400)
    })
    test("fails with status code 400 if username is not unique", async () => {
      const validUserDuplicate = {
        username: "root",
        name: "root",
        password: "root",
      }

      await await api.post("/api/users").send(validUserDuplicate).expect(400)
    })
  })
  describe("login tests", () => {
    test("a valid user can login and receive a token when valid username and password is entered", async () => {
      const validUserCredentials = {
        username: "root",
        password: "root",
      }

      const res = await api
        .post("/api/login")
        .send(validUserCredentials)
        .expect(200)

      expect(res.body.token).toBeDefined()
    })
    test("a user will receive an error if credentials provided are wrong", async () => {
      const invalidUserCredentials = {
        username: "root",
        password: "rooot",
      }

      const res = await api
        .post("/api/login")
        .send(invalidUserCredentials)
        .expect(401)

      expect(res.body.error).toBe("invalid username or password")
    })
  })
})

afterAll(() => {
  mongoose.connection.close()
})
