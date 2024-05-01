import 'dotenv/config'
import {Model, Sequelize} from 'sequelize'
// @ts-ignore
import SequelizeMock from 'sequelize-mock'

export const sequelize = process.env.noDB === '1'
  ? new SequelizeMock()
  : await checkConnections([process.env.POSTGRES_HOST_DOCKER ?? '', process.env.POSTGRES_HOST ?? ''])

async function checkConnections(hosts: string[]) {
  let sequelize
  for (const host of hosts) {
    sequelize = new Sequelize(
      process.env.POSTGRES_DB ?? '',
      process.env.POSTGRES_USER ?? '',
      process.env.POSTGRES_PASSWORD ?? '',
      {
        database: process.env.POSTGRES_DB ?? '',
        host,
        dialect: 'postgres',
        logging: false,
      }
    )
    try {
      await sequelize.authenticate()
      break
    } catch (e) {

    }
  }
  if (!sequelize) throw new Error('Could not connect to any database host')
  return sequelize
}

class ModelMock {
  public static init() {}
  public static sync() {}
  public static build() {return new ModelMock()}
  public save() {}
  public static findOne() {return null}
  public static findAll() {return []}
  public static create() {return Promise.resolve()}
}

const ModelExport = process.env.noDB === '1' ? (ModelMock as unknown as typeof Model) : Model
export {ModelExport as Model}
