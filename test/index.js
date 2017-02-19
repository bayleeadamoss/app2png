const app2png = require('../')
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')

const getApps = () => { return new Promise((resolve) => {
    exec('mdfind kind:app', (err, output) => {
      const apps = output.trim().split('\n').filter((app) => {
        const plistPath = path.join(app, 'Contents', 'Info.plist')
        return fs.existsSync(plistPath)
      }).reduce((uniqueAppList, currentApp) => {
        const currentAppName = path.basename(currentApp)
        const foundApp = uniqueAppList.find((uniqueApp) => {
          const uniqueAppName = path.basename(uniqueApp)
          return uniqueAppName === currentAppName
        })
        if (!foundApp) {
          uniqueAppList.push(currentApp)
        }
        return uniqueAppList
      }, [])
      resolve(apps)
    })
  })
}

getApps().then((apps) => {
  const start = new Date()
  return Promise.all(apps.map((app) => {
    const iconPath = path.basename(app) + '.png'
    return app2png.convert(app, iconPath).then(() => {
      console.log('done with', app)
    })
  })).then(() => {
    const end = new Date()
    const endSeconds = (end - start) / 1000
    console.log('done', endSeconds)
  })
}).catch((e) => {
  console.log('error', e)
})
