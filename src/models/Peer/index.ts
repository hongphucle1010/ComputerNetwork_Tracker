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
            pieceHashes: [String] // Array of piece hashes that the peer has
        }
    ]
}
*/

import { ObjectId } from 'mongodb'
import { PEERS_COLLECTION } from '../../lib/constant'
import mongoDb from '../../lib/mongoDbClient'

// CRUD operations for Peer model
export async function createPeer(peer: Peer) {
  return mongoDb.collection(PEERS_COLLECTION).insertOne(peer)
}

export async function readPeerById(peerId: ObjectId) {
  return mongoDb.collection(PEERS_COLLECTION).findOne({ _id: peerId })
}

export async function updatePeer(peerId: ObjectId, updatedPeer: Partial<Peer>) {
  return mongoDb.collection(PEERS_COLLECTION).updateOne({ _id: peerId }, { $set: updatedPeer })
}

export async function deletePeer(peerId: ObjectId) {
  return mongoDb.collection(PEERS_COLLECTION).deleteOne({ _id: peerId })
}

// export async function upsertPeer(peerData: Peer) {
//   const { pieces, ...peerFields } = peerData // Separate pieces from the rest of the fields

//   return mongoDb.collection(PEERS_COLLECTION).updateOne(
//     { _id: peerData._id },
//     {
//       $set: peerFields, // Set all other peer data fields
//       $addToSet: { pieces: { $each: pieces } } // Add only unique pieces
//     },
//     { upsert: true }
//   )
// }

export async function findAvailablePeers(torrentId: ObjectId) {
  return mongoDb
    .collection(PEERS_COLLECTION)
    .find({ torrentId })
    .project({ ip: 1, port: 1, pieces: 1 }) // Only include relevant fields
    .toArray()
}
// export async function findAvailablePeers(torrentId: ObjectId, peerId: ObjectId) {
//   return mongoDb
//     .collection(PEERS_COLLECTION)
//     .find({ torrentId, _id: { $ne: peerId } })
//     .project({ ip: 1, port: 1, pieces: 1 }) // Only include relevant fields
//     .toArray()
// }
