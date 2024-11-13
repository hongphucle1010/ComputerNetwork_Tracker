import { Db, MongoClient } from 'mongodb'
import { DATABASE_NAME, DATABASE_URL } from './constant'

// class MongoDbClient {
//   private client: MongoClient
//   private isConnected: boolean
//   private db: Db

//   constructor() {
//     this.client = new MongoClient(DATABASE_URL)
//     this.isConnected = false
//     this.db = this.client.db(DATABASE_NAME)
//   }

//   async connectToDatabase() {
//     if (!this.isConnected) {
//       await this.client.connect()
//       this.isConnected = true
//       console.log('Connected to MongoDB Atlas')
//     }
//   }

//   getDatabase() {
//     return this.db
//   }
// }

// const mongoDbClient = new MongoDbClient()

// export default mongoDbClient

const mongoDbClient = new MongoClient(DATABASE_URL)
const mongoDb: Db = mongoDbClient.db(DATABASE_NAME)

export async function connectToDatabase() {
  await mongoDbClient.connect()
  console.log('Connected to MongoDB Atlas')
}

export default mongoDb
