import { DuplicateTranslationEntryError, InvalidResourceFileError, MissingTranslationsError } from './errors'
import fs from 'fs'
import findDuplicatedPropertyKeys from 'find-duplicated-property-keys'

import { info } from './log'
import { getFilesFromFolder } from './utils'

type ResourceDict = { [p: string]: { [q: string]: string } }
type AllTranslations = { [p: string]: string[] }
type AllLanguages = Set<string>

function readPackageJsonFileAsRaw(resourceFile: string): string {
  try {
    return fs.readFileSync(resourceFile, 'utf8')
  } catch (e) {
    throw new InvalidResourceFileError(resourceFile)
  }
}

function checkDuplicateEntries(rawJsonData: string): void {
  const result = findDuplicatedPropertyKeys(rawJsonData)
  if (result.length > 0) {
    throw new DuplicateTranslationEntryError(result[0]['key'])
  }
}

function parseJsonFile(rawJsonFile: string, resourceFile: string): ResourceDict {
  try {
    return JSON.parse(rawJsonFile)
  } catch (e) {
    throw new InvalidResourceFileError(resourceFile)
  }
}

function loadResources(validJson: ResourceDict, allTranslations: AllTranslations, allLanguages: AllLanguages): void {
  for (const [language, translations] of Object.entries(validJson)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, value] of Object.entries(translations)) {
      if (allTranslations[key] === undefined) {
        allTranslations[key] = [language]
      } else {
        allTranslations[key] = allTranslations[key].concat(language)
      }
      allLanguages.add(language)
    }
  }
}

function checkLoadedResources(allTranslations: AllTranslations, allLanguages: AllLanguages): AllTranslations {
  const result: AllTranslations = {}
  const allLanguagesArr = [...allLanguages]

  for (const [translation, langs] of Object.entries(allTranslations)) {
    result[translation] = allLanguagesArr.filter(item => !langs.includes(item))
  }
  return result
}

function checkResources(resourcesPath: string, quietMode: boolean): void {
  info('Started validating resources', quietMode)

  const allTranslations = {}
  const allLanguages = new Set<string>()
  const resourceFiles = getFilesFromFolder(resourcesPath)

  for (const resourceFile of resourceFiles) {
    const rawResourceFile = readPackageJsonFileAsRaw(resourceFile)
    checkDuplicateEntries(rawResourceFile)
    const validJson = parseJsonFile(rawResourceFile, resourceFile)
    loadResources(validJson, allTranslations, allLanguages)
  }
  const res = checkLoadedResources(allTranslations, allLanguages)
  let hasErrors = false
  for (const [str, missingLangs] of Object.entries(res)) {
    if (missingLangs.length !== 0) {
      info(`Missing ${missingLangs} for ${str}`, quietMode)
      hasErrors = true
    }
  }
  if (hasErrors) {
    throw new MissingTranslationsError()
  }

  info('Finished validating without errors!', quietMode)
}

export default checkResources
