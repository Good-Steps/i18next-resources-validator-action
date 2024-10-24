import fs from 'fs'

const getFilesFromFolder = function(directory, extension = '.json') {
  files = fs.readdirSync(directory, { withFileTypes: true })
  arrayOfFiles = []
  files.forEach(function(file) {
    if (fs.statSync(directory + "/" + file).isDirectory()) {
      arrayOfFiles = getFilesFromFolder(directory + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(__dirname, directory, "/", file.name))
    }
  })

  return arrayOfFiles.filter(item => item.endsWith(extension))
}

const setInput = (name: string, value: string): void => {
  process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] = value
}

export { getFilesFromFolder, setInput }
