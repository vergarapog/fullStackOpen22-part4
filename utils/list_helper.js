var _ = require("lodash")

const totalLikes = (arrayBlogs) => {
  const result = arrayBlogs.reduce((accu, curr) => {
    return accu + curr.likes
  }, 0)
  return result
}

const favoriteBlog = (arrayBlogs) => {
  const result = arrayBlogs.reduce((accu, curr) => {
    return accu.likes > curr.likes ? accu : curr
  })

  return result
}

//my solution for mostBlogs
// const mostBlogs = (arrayBlogs) => {
//   const allAuthors = arrayBlogs.reduce((accu, curr) => {
//     return [...accu, { author: curr.author, blogs: 0 }]
//   }, [])

//   const uniqueAuthors = _.uniqBy(allAuthors, "author")

//   arrayBlogs.forEach((blog) => {
//     const currAuthorIndex = _.findIndex(uniqueAuthors, (obj) => {
//       return obj.author === blog.author
//     })

//     if (currAuthorIndex !== -1) {
//       uniqueAuthors[currAuthorIndex].blogs += 1
//     }
//   })

//   const mostBlogs = uniqueAuthors.reduce(
//     (accu, curr) => {
//       return accu.blogs > curr.blogs ? accu : curr
//     },
//     { blogs: -1 }
//   )

//   return mostBlogs
// }

//internet solution for mostBlogs
const mostBlogs = _.flow(
  (blogs) => _.countBy(blogs, "author"), // count by the author
  _.toPairs, // convert to array of [key, value] pairs
  (blogs) => _.maxBy(blogs, _.last), // get the entry with most blogs
  (blog) => _.zipObject(["author", "blogs"], blog) // convert to an object
)

//my solution for mostLikes
const mostLikes = (blogs) => {
  const authorPerLikes = blogs.reduce((accu, curr) => {
    const authorIndexInArray = accu.findIndex(
      (item) => item.author === curr.author
    )

    if (authorIndexInArray === -1) {
      return [...accu, { author: curr.author, likes: curr.likes }]
    } else {
      // const updatedAuthorObj = (accu[authorIndexInArray] += curr.likes)
      // return [...accu, updatedAuthorObj]
      accu[authorIndexInArray].likes += curr.likes
      return accu
    }
  }, [])

  const mostLikes = _.maxBy(authorPerLikes, "likes")

  return mostLikes
}

module.exports = {
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
