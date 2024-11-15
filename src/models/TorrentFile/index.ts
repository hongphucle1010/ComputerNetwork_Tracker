/* 
TorrentFile schema:
{
    _id: ObjectId,     // Unique identifier for the torrent file
    name: String,      // Name of the torrent file
    size: Number,      // Total size of the file in bytes
    pieces: [          // Array of pieces associated with the torrent
        {
            index: Number,        // Index of the piece
            size: Number,         // Size of the piece
            hash: String,         // Hash for data integrity check
        }
    ]
}

Peer schema:
{
    _id: ObjectId,     // Unique identifier for the peer
    ip: String,        // IP address of the peer
    port: Number,      // Port number used by the peer
    liveTime: Date, // Online status of the peer
    download: Number,  // Total data downloaded by the peer (in bytes)
    upload: Number,    // Total data uploaded by the peer (in bytes)
    torrents: [
        { 
            torrentId: ObjectId, // Reference to the torrent file
            pieceIndexes: [Number] // Array of piece hashes that the peer has
        }
    ]
}
*/

import { TORRENT_FILES_COLLECTION } from '../../lib/constant'
import mongoDb from '../../lib/mongoDbClient'
import { ObjectId } from 'mongodb'

// CRUD operations for TorrentFile model
export async function createTorrentFile(torrentFile: TorrentFile) {
  return mongoDb.collection(TORRENT_FILES_COLLECTION).insertOne(torrentFile)
}

export async function readTorrentFileById(torrentFileId: ObjectId) {
  return mongoDb.collection(TORRENT_FILES_COLLECTION).findOne({ _id: torrentFileId })
}

export async function updateTorrentFile(torrentFileId: ObjectId, updatedTorrentFile: Partial<TorrentFile>) {
  return mongoDb.collection(TORRENT_FILES_COLLECTION).updateOne({ _id: torrentFileId }, { $set: updatedTorrentFile })
}

export async function deleteTorrentFile(torrentFileId: ObjectId) {
  return mongoDb.collection(TORRENT_FILES_COLLECTION).deleteOne({ _id: torrentFileId })
}
