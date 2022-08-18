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

//TODO mostBlogs and mostLikes part4a exercises

module.exports = {
  totalLikes,
  favoriteBlog,
}
