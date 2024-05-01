import Frame, {consecutiveSpaceOrLineBreaks} from '../dle-detection/frame.js'
import type State from '../state.js'
import {recogniseText} from '../dle-detection/ocr.js'
import sharp from 'sharp'
import terminalImage from 'terminal-image'

export async function collectGlobleScore(frame: Frame, state: State): Promise<{
  hasWon: true | null,
  guesses: number
} | null> {
  if (frame.view === 'score') {
    return collectScoreFromBoard(frame, state)
  } else if (frame.view === 'gameplay') {
    return collectScoreFromScreen(frame, state)
  } else return null
}

const statesGuessesRegex = /today's guesses.+?(\d+)\n/

async function collectScoreFromBoard(frame: Frame, state: State): Promise<{ hasWon: true, guesses: number } | null> {
  const statsText = await recogniseText(
    frame.imageSharpNoChat.clone().extract({left: 520, width: 350, top: 150, height: 350}).threshold(40),
    3
  )
  const statsGuessesMatch = statsText.toLowerCase().match(statesGuessesRegex)
  if (!statsGuessesMatch) return null
  const guesses = Number(statsGuessesMatch[1])
  if (isNaN(guesses)) return null
  return {hasWon: true, guesses}
}

async function collectScoreFromScreen(frame: Frame, state: State): Promise<{ hasWon: true | null, guesses: number }> {
  const resize = 2.5
  const image = await frame.imageSharpNoChat.clone()
    .extract({left: 230, width: 960, top: 800, height: 200})
    .extractChannel('red')
    .toBuffer()
    .then(sharp)
    .then(img => img
      .resize({width: 960 * resize, height: 200 * resize, kernel: 'cubic'})
      .normalize({lower: 0, upper: 70})
    )

  // console.log(await terminalImage.buffer(await image.toBuffer()))

  const guessesText = await recogniseText(image, 3)
  // console.log(guessesText)
  const guessTextNoLineBreaks = guessesText.replace(consecutiveSpaceOrLineBreaks, ' ')
  // todo this method is wonky shmonky
  let countriesCounted = countCountryOccurrences(guessTextNoLineBreaks)
  const hasWon = (await frame.recognisedText)?.includes('the mystery country is') ? true : null
  return {guesses: countriesCounted, hasWon}
}

function textInBetween(string: string, expectedStringBefore: string, expectedStringAfter: string) {
  const beforeIndexStart = string.indexOf(expectedStringBefore)
  const beforeIndexEnd = beforeIndexStart + expectedStringBefore.length
  const afterIndexStart = string.indexOf(expectedStringAfter)
  return string.substring(beforeIndexEnd, afterIndexStart)
}

const globleCountries = ["Indonesia", "Malaysia", "Chile", "Bolivia", "Peru", "Argentina", "United Kingdom", "Cyprus", "India", "China", "Israel", "Lebanon", "Ethiopia", "S. Sudan", "Somalia", "Kenya", "Malawi", "Tanzania", "Syria", "France", "Suriname", "Guyana", "South Korea", "North Korea", "Morocco", "Costa Rica", "Nicaragua", "Congo", "Dem. Rep. Congo", "Bhutan", "Ukraine", "Palestine", "Belarus", "Namibia", "South Africa", "Netherlands", "Oman", "Uzbekistan", "Kazakhstan", "Tajikistan", "Lithuania", "Brazil", "Uruguay", "Mongolia", "Russia", "Czechia", "Germany", "Estonia", "Latvia", "Norway", "Sweden", "Finland", "Vietnam", "Cambodia", "Luxembourg", "United Arab Emirates", "Belgium", "Georgia", "North Macedonia", "Albania", "Azerbaijan", "Kosovo", "Türkiye", "Spain", "Laos", "Kyrgyzstan", "Armenia", "Denmark", "Libya", "Tunisia", "Romania", "Hungary", "Slovakia", "Poland", "Ireland", "Greece", "Zambia", "Sierra Leone", "Guinea", "Liberia", "Central African Rep.", "Sudan", "Djibouti", "Eritrea", "Austria", "Iraq", "Italy", "Switzerland", "Iran", "Liechtenstein", "Côte d'Ivoire", "Serbia", "Mali", "Senegal", "Nigeria", "Benin", "Angola", "Croatia", "Slovenia", "Qatar", "Saudi Arabia", "Botswana", "Zimbabwe", "Pakistan", "Bulgaria", "Thailand", "Haiti", "Dominican Rep.", "Chad", "Kuwait", "El Salvador", "Guatemala", "Timor-Leste", "Brunei", "Algeria", "Mozambique", "Eswatini", "Burundi", "Rwanda", "Myanmar", "Bangladesh", "Andorra", "Afghanistan", "Montenegro", "Bosnia and Herzegovina", "Uganda", "Cuba", "Honduras", "Ecuador", "Colombia", "Paraguay", "Portugal", "Moldova", "Turkmenistan", "Jordan", "Nepal", "Lesotho", "Cameroon", "Gabon", "Niger", "Burkina Faso", "Togo", "Ghana", "Guinea-Bissau", "United States of America", "Canada", "Mexico", "Belize", "Panama", "Venezuela", "Papua New Guinea", "Egypt", "Yemen", "Mauritania", "Eq. Guinea", "Gambia", "Australia", "Fiji", "New Zealand", "Madagascar", "Philippines", "Sri Lanka", "Bahamas", "Taiwan", "Japan", "Iceland", "Kiribati", "Trinidad and Tobago", "Grenada", "St. Vin. and Gren.", "Barbados", "Saint Lucia", "Dominica", "Antigua and Barb.", "St. Kitts and Nevis", "Jamaica", "Mauritius", "Comoros", "São Tomé and Príncipe", "Cabo Verde", "Malta", "Singapore", "Tonga", "Samoa", "Solomon Is.", "Micronesia", "Vanuatu", "Palau", "Bahrain", "San Marino", "Monaco", "Vatican City", "Seychelles", "Marshall Is.", "Tuvalu", "Maldives", "Nauru"]

const globleCountriesAbbreviations = ["Indo.", "Malay.", "Chile", "Bolivia", "Peru", "Arg.", "U.K.", "Cyp.", "India", "China", "Isr.", "Leb.", "Eth.", "S. Sud.", "Som.", "Ken.", "Mal.", "Tanz.", "Syria", "Fr.", "Sur.", "Guy.", "S.K.", "N.K.", "Mor.", "C.R.", "Nic.", "Rep. Congo", "D.R.C.", "Bhutan", "Ukr.", "Pal.", "Bela.", "Nam.", "S.Af.", "Neth.", "Oman", "Uzb.", "Kaz.", "Tjk.", "Lith.", "Brazil", "Ury.", "Mong.", "Rus.", "Cz.", "Ger.", "Est.", "Lat.", "Nor.", "Swe.", "Fin.", "Viet.", "Camb.", "Lux.", "U.A.E.", "Belg.", "Abkh.", "N. Mac.", "Alb.", "Aze.", "Kos.", "Tur.", "Sp.", "Laos", "Kgz.", "Arm.", "Den.", "Libya", "Tun.", "Rom.", "Hun.", "Svk.", "Pol.", "Ire.", "Greece", "Zambia", "S.L.", "Gin.", "Liberia", "C.A.R.", "Sudan", "Dji.", "Erit.", "Aust.", "Iraq", "Italy", "Switz.", "Iran", "Liech.", "I.C.", "Serb.", "Mali", "Sen.", "Nigeria", "Benin", "Ang.", "Cro.", "Slo.", "Qatar", "Saud.", "Bwa.", "Zimb.", "Pak.", "Bulg.", "Thai.", "Haiti", "Dom. Rep.", "Chad", "Kwt.", "El. S.", "Guat.", "T.L.", "Brunei", "Alg.", "Moz.", "eSw.", "Bur.", "Rwa.", "Myan.", "Bang.", "And.", "Afg.", "Mont.", "B.H.", "Uga.", "Cuba", "Hond.", "Ecu.", "Col.", "Para.", "Port.", "Mda.", "Turkm.", "Jord.", "Nepal", "Les.", "Cam.", "Gabon", "Niger", "B.F.", "Togo", "Ghana", "GnB.", "U.S.A.", "Can.", "Mex.", "Belize", "Pan.", "Ven.", "P.N.G.", "Egypt", "Yem.", "Mrt.", "Eq. G.", "Gambia", "Auz.", "Fiji", "N.Z.", "Mad.", "Phil.", "Sri L.", "Bhs.", "Taiwan", "Japan", "Iceland", "Kir.", "Tr.T.", "Gren.", "St.V.G.", "Barb.", "S.L.", "D'inca", "Ant.B.", "St.K.N.", "Jam.", "Mus.", "Com.", "S.T.P.", "C.Vd.", "Malta", "Sing.", "Tongo", "Samoa", "S. Is.", "F.S.M.", "Van.", "Palau", "Bahr.", "S.M.", "Mco.", "Vat.", "Syc.", "M. Is.", "Tuv.", "Mald.", "Nauru"]

const dotRegex = /\./g
const dotNotLastRegex = /\.([A-Z])/g
const globleCountriesAbbreviationsAdjustedForOCR = globleCountriesAbbreviations.map(abbr => {
  const dotsAmount = abbr.match(dotRegex)?.length
  if (!dotsAmount || dotsAmount === 0) return abbr
  else if (dotsAmount === 1) return [abbr, abbr.replace('.', ',')]
  else return [abbr, abbr.replace(dotNotLastRegex, '$1')]
})

// this code ugly as fuck
function countCountryOccurrences(string: string) {
  let occurrences = 0
  country_iterator:
    for (let i = 0; i < globleCountries.length; i++) {
      const countryName = globleCountries[i]
      if (string.includes(countryName)) {
        // console.log(countryName)
        occurrences++
        continue
      }
      const countryAbbr = globleCountriesAbbreviationsAdjustedForOCR[i]
      if (typeof countryAbbr === 'string') {
        if (string.includes(countryAbbr)) {
          // console.log(countryAbbr)
          occurrences++
          continue
        }
      } else {
        for (const abbr of countryAbbr) {
          if (string.includes(abbr)) {
            // console.log(abbr)
            occurrences++
            continue country_iterator
          }
        }
      }
    }
  return occurrences
}
