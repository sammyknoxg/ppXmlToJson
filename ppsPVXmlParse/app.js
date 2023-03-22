const express = require('express')
const app = express()
const port = 5000

const puppeteer = require('puppeteer')  
const { blue, cyan, green, magenta, red, yellow } = require('colorette')

app.get('/scrape', (req, res) => {

  (async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page
      .on('console', message => {
        const type = message.type().substr(0, 3).toUpperCase()
        const colors = {
          LOG: text => text,
          ERR: red,
          WAR: yellow,
          INF: cyan
        }
        const color = colors[type] || blue
        console.log(color(`${type} ${message.text()}`))
      })
    await page.goto('https://taodata-web.nccer.org/')


    // Type into search box.
    await page.type('.homeInput', '22139410')

    // Wait for suggest overlay to appear and click "show all results".
    const searchBtn = '.searchBtn'
    await page.waitForSelector(searchBtn)
    await page.click(searchBtn)

    await browser.close()
    res.send('finished form submission')
  })();
})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})