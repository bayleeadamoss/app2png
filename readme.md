## APP 2 PNG

Convert a Mac `*.app` file to a `.png`.

### Usage

~~~ javascript
const app2png = require('app2png')
app2png.convert('/Applications/Zazu.app', './Zazu.png').then(() => {
  console.log('done')
})
~~~
