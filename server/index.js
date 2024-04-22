const express = require("express")
const path = require("path")
const app = express()


app.use(express.static(path.resolve(__dirname, 'public')))


app.get("/apple", (req, res) => {
    console.log("238910")
    res.json({
        name: 'apple'
    })
})

app.listen("9090", () => {
    console.log("success")
})
