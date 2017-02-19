const path = require('path')
const fs = require('fs')
const plist = require('simple-plist')
const { exec } = require('child_process')

const getIconFile = (appFileInput) => {
  return new Promise((resolve, reject) => {
    const plistPath = path.join(appFileInput, 'Contents', 'Info.plist')
    plist.readFile(plistPath, (err, data) => {
      if (err || !data.CFBundleIconFile) {
        return resolve('/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns')
      }
      const iconFile = path.join(appFileInput, 'Contents', 'Resources', data.CFBundleIconFile)
      const iconFiles = [iconFile, iconFile + '.icns', iconFile + '.tiff']
      const existedIcon = iconFiles.find((iconFile) => {
        return fs.existsSync(iconFile)
      })
      resolve(existedIcon || '/System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns')
    })
  })
}

const sortIcons = (icons) => {
  const aWins = -1
  const bWins = 1
  const catWins = 0
  return icons.sort((a, b) => {
    const aSize = parseInt(a.match(/(\d+)x\1/)[1], 10)
    const bSize = parseInt(b.match(/(\d+)x\1/)[1], 10)
    if (aSize === bSize) {
      if (a.indexOf('@2x') > -1) return aWins
      if (b.indexOf('@2x') > -1) return bWins
      return catWins
    }
    if (aSize > bSize) return aWins
    if (aSize < bSize) return bWins
    return catWins
  })
}

const icnsToPng = (iconFile, pngFileOutput) => {
  const outputDir = pngFileOutput + '.iconset'
  return new Promise((resolve, reject) => {
    exec(`iconutil --convert iconset '${iconFile}' --output '${outputDir}'`, (error) => {
      if (error) return reject(error)
      fs.readdir(outputDir, (error, files) => {
        if (error) return reject(error)
        const realIcons = files.map((file) => {
          return path.join(outputDir, file)
        })
        const biggestIcon = sortIcons(realIcons).find(Boolean)
        fs.rename(biggestIcon, pngFileOutput, (error) => {
          error ? reject(error) : resolve(realIcons.filter((file) => {
            return file !== biggestIcon
          }))
        })
      })
    })
  }).then((files) => {
    // Cleanup temp icons
    return Promise.all(files.map((file) => {
      return new Promise((resolve, reject) => {
        fs.unlink(file, (error) => {
          error ? reject(error) : resolve()
        })
      })
    }))
  }).then(() => {
    // Cleanup temp directory
    return new Promise((resolve, reject) => {
      fs.rmdir(outputDir, (error) => {
        error ? reject(error) : resolve()
      })
    })
  })
}

const tiffToPng = (iconFile, pngFileOutput) => {
  return new Promise((resolve, reject) => {
    exec(`sips -s format png '${iconFile}' --out '${pngFileOutput}'`, (error) => {
      error ? reject(error) : resolve()
    })
  })
}

module.exports = {
  convert: (appFileInput, pngFileOutput) => {
    return getIconFile(appFileInput).then((iconFile) => {
      if (iconFile.substr(-4) === 'icns') {
        return icnsToPng(iconFile, pngFileOutput)
      } else {
        return tiffToPng(iconFile, pngFileOutput)
      }
    })
  },
}
