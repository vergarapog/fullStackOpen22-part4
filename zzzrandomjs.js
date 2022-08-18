const axios = require("axios")

const baseURL = "https://api.sampleapis.com/beers/ale"

// axios.get(baseURL).then((resp) => console.log(resp.data[0]))

const getAle = async () => {
  try {
    await axios.get(baseURL).then((resp) => {
      console.log(resp.data[0])
    })
  } catch (error) {
    console.log("hotdogh", error)
  }
}

getAle()

console.log("1")
console.log("2")
console.log("3")
