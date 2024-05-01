import * as fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let projectDir = __dirname
while (!fs.existsSync(path.join(projectDir, 'package.json'))) projectDir = path.resolve(projectDir, '..')
export {projectDir}

const tmpDir = path.resolve('temp')
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir)
}
export {tmpDir}
