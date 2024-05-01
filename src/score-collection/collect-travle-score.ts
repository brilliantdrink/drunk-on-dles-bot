import Frame from '../dle-detection/frame.js'
import type State from '../state.js'
import {recogniseText} from '../dle-detection/ocr.js'
import terminalImage from 'terminal-image'
import sharp from 'sharp'
import {getColorAmount} from '../dle-detection/analyze-color.js'
import {Vector3} from './helpers.js'

const greenConfetti: Vector3 = [150, 248, 109]
const yellowConfetti: Vector3 = [250, 243, 116]
const purpleConfetti: Vector3 = [146, 36, 227]

export async function collectTravleScore(frame: Frame, state: State): Promise<{
  hasWon: boolean | null,
  guesses: number | null
} | null> {
  const greenConfettiAmount = await getColorAmount(frame.imageSharpNoChat, greenConfetti)
  const yellowConfettiAmount = await getColorAmount(frame.imageSharpNoChat, yellowConfetti)
  const purpleConfettiAmount = await getColorAmount(frame.imageSharpNoChat, purpleConfetti)
  if (greenConfettiAmount > 100 && yellowConfettiAmount > 100 && purpleConfettiAmount > 100)
    return null
  if (frame.view === 'score') {
    return collectScoreFromBoard(frame, state)
  } else if (frame.view === 'gameplay') {
    return collectScoreFromScreen(frame, state)
  } else return null
}

const wonGuessesRegex = /success! you got from .+? to .+? in (\d+) guess(es)?/

async function collectScoreFromBoard(frame: Frame, state: State) {
  const won = (await frame.recognisedText)?.includes('success! you got from ') && (await frame.recognisedText)?.includes('the shortest solution was')
  const lost = (await frame.recognisedText)?.includes('so close. you were just ')
  const hasWon = won ? true : (lost ? false : null)
  let guesses = null
  if (won) {
    const wonGuessesMatch = (await frame.recognisedText)?.match(wonGuessesRegex)
    if (wonGuessesMatch) guesses = Number(wonGuessesMatch[1])
  }
  // todo implement lost guess count (but honestly elby will never lose this game)
  return {guesses, hasWon}
}

async function collectScoreFromScreen(frame: Frame, state: State) {
  const resize = 1.5
  const image = await frame.imageSharpNoChat.clone()
    .extract({left: 400, width: 600, top: 650, height: 280}).toBuffer()
    .then(sharp)
    .then(img => img
      // .normalize({lower: 90, upper: 100})
      .resize({width: 600 * resize, height: 280 * resize, kernel: 'cubic'})
    )
  const guessesText = await recogniseText(image, 3)

  // console.log(await terminalImage.buffer(await image.toBuffer()))
  const pastGuesses = "Past guesses (click to show/hide):"

  const guessesPureText = guessesText
    .substring(guessesText.indexOf(pastGuesses) + pastGuesses.length, guessesText.length)
    .trim()
    .toLowerCase()
  // console.log([guessesPureText])
  let countriesCounted = 0
  const matchedCountries: string[] = []
  for (const travleCountry of travleCountriesSortedForUse) {
    if (!guessesPureText.includes(travleCountry) || matchedCountries.includes(travleCountry)) continue
    if (travleCountry in countryNamesContainedInOthers) {
      const otherCountries = countryNamesContainedInOthers[travleCountry as keyof typeof countryNamesContainedInOthers]
      let startIndex = 0
      let countryIndex = null
      let i = 0
      do {
        i++
        let didMatch = false
        const indexInSubstring = guessesPureText.substring(startIndex).indexOf(travleCountry)
        if (indexInSubstring === -1) break
        countryIndex = startIndex + indexInSubstring
        // console.log(countryIndex)
        for (const otherCountry of otherCountries) {
          // console.log(otherCountry)
          if ('stringAfter' in otherCountry) {
            const start = countryIndex + travleCountry.length
            const end = start + otherCountry.stringAfter.length
            const foundAfterString = guessesPureText.substring(start, end)
            if (otherCountry.stringAfter === foundAfterString) {
              matchedCountries.push(otherCountry.country)
              // console.log('after', otherCountry.country, travleCountry)
              countriesCounted++
              didMatch = true
              startIndex = end
              break
            }
          } else {
            const foundBeforeString = guessesPureText.substring(countryIndex - otherCountry.stringBefore.length, countryIndex)
            if (otherCountry.stringBefore === foundBeforeString) {
              matchedCountries.push(otherCountry.country)
              // console.log('before', otherCountry.country, travleCountry)
              countriesCounted++
              didMatch = true
              startIndex = countryIndex - otherCountry.stringBefore.length + otherCountry.country.length
              break
            }
          }
        }
        if (didMatch) continue
        countriesCounted++
        // console.log('normal2', travleCountry)
        startIndex = countryIndex + travleCountry.length
      } while (i < 20)
    } else {
      // console.log('normal', travleCountry)
      countriesCounted++
    }
  }
  return {guesses: countriesCounted, hasWon: null}
}

const travleCountries = ["Aruba", "Afghanistan", "Angola", "Anguilla", "Albania", "Åland", "Andorra", "United Arab Emirates", "Argentina", "Armenia", "American Samoa", "Antarctica", "Ashmore and Cartier Islands", "French Southern and Antarctic Lands", "Antigua and Barbuda", "Australia", "Austria", "Azerbaijan", "Burundi", "Belgium", "Benin", "Burkina Faso", "Bangladesh", "Bulgaria", "Bahrain", "The Bahamas", "Bosnia and Herzegovina", "Saint Barthélemy", "Belarus", "Belize", "Bermuda", "Bolivia", "Brazil", "Barbados", "Brunei", "Bhutan", "Botswana", "Central African Republic", "Canada", "Cocos (Keeling) Islands", "Switzerland", "Chile", "People's Republic of China", "Ivory Coast", "Cameroon", "Democratic Republic of the Congo", "Republic of the Congo", "Cook Islands", "Colombia", "Comoros", "Cape Verde", "Costa Rica", "Cuba", "Curaçao", "Christmas Island", "Cayman Islands", "Turkish Republic of Northern Cyprus", "Cyprus", "Czech Republic", "Germany", "Djibouti", "Dominica", "Denmark", "Dominican Republic", "Algeria", "Ecuador", "Egypt", "Eritrea", "Spain", "Estonia", "Ethiopia", "Finland", "Fiji", "Falkland Islands", "Faroe Islands", "Federated States of Micronesia", "France", "Gabon", "United Kingdom", "Georgia", "Guernsey", "Ghana", "Guinea", "Guadeloupe", "The Gambia", "Guinea-Bissau", "Equatorial Guinea", "Greece", "Grenada", "Greenland", "Guatemala", "French Guiana", "Guam", "Guyana", "Hong Kong", "Heard Island and McDonald Islands", "Honduras", "Croatia", "Haiti", "Hungary", "Indonesia", "Isle of Man", "India", "British Indian Ocean Territory", "Ireland", "Iran", "Iraq", "Iceland", "Israel", "Italy", "Jamaica", "Jersey", "Jordan", "Japan", "Siachen Glacier", "Kazakhstan", "Kenya", "Kyrgyzstan", "Cambodia", "Kiribati", "Saint Kitts and Nevis", "South Korea", "Kosovo", "Kuwait", "Laos", "Lebanon", "Liberia", "Libya", "Saint Lucia", "Liechtenstein", "Sri Lanka", "Lesotho", "Lithuania", "Luxembourg", "Latvia", "Macau", "Saint Martin", "Morocco", "Monaco", "Moldova", "Madagascar", "Maldives", "Mexico", "Marshall Islands", "North Macedonia", "Mali", "Malta", "Myanmar", "Montenegro", "Mongolia", "Northern Mariana Islands", "Mozambique", "Mauritania", "Montserrat", "Martinique", "Mauritius", "Malawi", "Malaysia", "Mayotte", "Namibia", "New Caledonia", "Niger", "Norfolk Island", "Nigeria", "Nicaragua", "Niue", "Jan Mayen", "Netherlands", "Caribbean Netherlands", "Norway", "Nepal", "Nauru", "Svalbard", "New Zealand", "Oman", "Pakistan", "Panama", "Azores", "Pitcairn Islands", "Peru", "Philippines", "Palau", "Madeira", "Papua New Guinea", "Poland", "Puerto Rico", "North Korea", "Portugal", "Paraguay", "Palestine", "French Polynesia", "Qatar", "Réunion", "Romania", "Russia", "Rwanda", "Western Sahara", "Saudi Arabia", "Sudan", "South Sudan", "Senegal", "Singapore", "South Georgia and the South Sandwich Islands", "Saint Helena", "Solomon Islands", "Sierra Leone", "El Salvador", "San Marino", "Somaliland", "Somalia", "Saint Pierre and Miquelon", "Serbia", "São Tomé and Príncipe", "Suriname", "Slovakia", "Slovenia", "Sweden", "Eswatini", "Sint Maarten", "Seychelles", "Syria", "Turks and Caicos Islands", "Chad", "Togo", "Thailand", "Tajikistan", "Tokelau", "Turkmenistan", "East Timor", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Tuvalu", "Taiwan", "Tanzania", "Uganda", "Ukraine", "Uruguay", "United States of America", "Uzbekistan", "Vatican City", "Saint Vincent and the Grenadines", "Venezuela", "British Virgin Islands", "United States Virgin Islands", "Vietnam", "Vanuatu", "Wallis and Futuna", "Samoa", "Yemen", "South Africa", "Zambia", "Zimbabwe"].map(s => s.toLowerCase())

const countryNamesContainedInOthers = Object.fromEntries(
  travleCountries
    .filter(country => travleCountries.some(other => other.includes(country) && other !== country))
    .map(country => {
      const containedInData = []
      for (const other of travleCountries) {
        if (!other.includes(country) || other === country) continue
        const indexOfOtherInCountry = other.indexOf(country)
        let data: {
          country: string, stringAfter: string
        } | {
          country: string, stringBefore: string
        } = indexOfOtherInCountry === 0 ? {
          country: other, stringAfter: other.substring(country.length),
        } : {
          country: other, stringBefore: other.substring(0, indexOfOtherInCountry),
        }
        containedInData.push(data)
      }
      return [country, containedInData]
    })
)

const travleCountriesSortedForUse = travleCountries.sort((a, b) => {
  // if "a" should be further front then negative
  // if "a" should be further back then positive
  return Number(b in countryNamesContainedInOthers) - Number(a in countryNamesContainedInOthers)
})
