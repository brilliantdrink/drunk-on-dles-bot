import type Frame from './frame.js'
import {getFeature} from './feature-matching.js'
import {getDetect} from './detection/detect.js'
import {Vector3} from '../score-collection/helpers.js'

const waffleHeader = getFeature('waffle-header.png')
const background: Vector3 = [238, 239, 241]
const panel: Vector3 = [255, 255, 255]

const detector = getDetect({
  gameplay: {
    colors: [{
      values: background,
      minRelativeCoverage: .3,
    },{
      values: panel,
      minRelativeCoverage: .3,
      maxRelativeCoverage: .7,
    },],
    features: [{
      image: waffleHeader,
      minMatches: 50,
    },],
  },
})

export async function detectWaffle(frame: Frame): Promise<boolean> {
  if (await detector(frame)) {
    frame.detectedDle = 'waffle'
    return true
  } else return false
}

// waffle cheers: see if done
const waffleCheerStrings: {
  [Key in '-1' | '0' | '1' | '2' | '3' | '4' | '5']: {
    part1: string[],
    part2: string[],
    part3: string[],
    special?: string[],
  }
} = {
  "0": {
    "part1": ["Phew!"],
    "part2": ["You got there.", "You did it.", "Gosh.", "Wowee."],
    "part3": ["That was nail biting.", "That was close!"]
  },
  "1": {
    "part1": ["Great!", "Success!", "Good work!"],
    "part2": ["Congratulations.", "Lovely stuff.", "Bravo.", "Kudos to you.", "Well done."],
    "part3": ["Bish bash bosh.", "Keep it up!", "That was very good.", "That will do nicely.", "Very good."]
  },
  "2": {
    "part1": ["Splendid!", "Success!", "Good work!"],
    "part2": ["Congratulations.", "Lovely stuff.", "Bravo.", "Kudos to you.", "Well done."],
    "part3": ["Bish bash bosh.", "Keep it up!", "That was very good.", "That will do nicely.", "Very good."]
  },
  "3": {
    "part1": ["Impressive!", "Great!", "Superb!", "Awesome!", "Bosh!", "Hot diggity dog!"],
    "part2": ["Well done.", "Jolly good stuff.", "Canny effort.", "Good effort.", "Bravo."],
    "part3": ["You did good kid.", "That was snazzy.", "That was very good.", "That was lovely.", "You did marvellously.", "I like it. Have some stars.", "I am thrilled for you.", "You rock."]
  },
  "4": {
    "part1": ["Magnificent!", "Excellent!", "Bingo bango!", "Bonanza!", "Fantastic!", "Wonderful!", "Terrific!", "Back of the net!", "Jackanackanory!", "Buckaroo!", "Sublime!"],
    "part2": ["Top job.", "Great work.", "Top class stuff.", "Wow.", "Wowee.", "Wowzers.", "Good golly.", "Good golly Miss Molly.", "Good gracious.", "Gosh.", "Golly gee whiz.", "Crikey.", "By Jove.", "Hats off to you."],
    "part3": ["You are very good at this.", "You are rather good at this.", "That was brilliant.", "That was marvellous.", "That was superb.", "That was spiffy.", "That was exquisite.", "That was very clever.", "That was snazzy.", "You’re really going to town."],
    "special": ["You go Glen Coco!", "Four stars for you Glen Coco!"]
  },
  "5": {
    "part1": ["Genius!", "Perfect!", "Incredible!", "Wondrous!", "Fandabidozi!", "Heavens to Betsy!", "Jiminy Jillikers!", "Jumping Jelly Sticks!", "Great Scott!", "Cor blimey, guv\'nor!", "Blimey O\'Riley!", "Mighty Mittens!", "Beard of Zeus!", "Odin\'s Raven!", "O Frabjous Day!", "Callooh! Callay!"],
    "part2": ["A perfect game.", "Top notch.", "Glorious.", "Remarkable.", "Astonishing.", "Fabulous.", "Astounding.", "Phenomenal.", "Tremendous.", "Exquisite."],
    "part3": ["*chef\'s kiss*", "You can\'t get better than that.", "You have serious talent.", "That was a delight to behold.", "What a dazzling performance.", "That was wonderful.", "That was majestic.", "That was magnificent.", "You nailed it.", "You\'re my hero."]
  },
  "-1": {"part1": ["Game Over"], "part2": ["You devoured this waffle in "], "part3": [""]}
}

const waffleWonCheers: string[] = []
const waffleLostCheers: string[] = []
for (const score in waffleCheerStrings) {
  const sortInto = score === '-1' ? waffleLostCheers : waffleWonCheers
  const parts = waffleCheerStrings[score as keyof typeof waffleCheerStrings]
  for (const strings of Object.values(parts)) {
    for (const string of strings) {
      if (!string) continue
      sortInto.push(string.toLowerCase())
    }
  }
}

export {waffleWonCheers, waffleLostCheers}
