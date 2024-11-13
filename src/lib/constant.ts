import * as dotenv from 'dotenv'
dotenv.config()

export const DATABASE_URL = process.env.DATABASE_URL || ''
export const DATABASE_NAME = process.env.DATABASE_NAME || ''
export const TORRENT_FILES_COLLECTION = process.env.TORRENT_FILES_COLLECTION || ''
export const PEERS_COLLECTION = process.env.PEERS_COLLECTION || ''
