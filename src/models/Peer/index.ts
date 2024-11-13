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
interface PeerCreateParams {
  ip: string
  port: number
}
export async function createPeer(peer: PeerCreateParams) {
  const insertPeer: Peer = {
    ip: peer.ip,
    port: peer.port,
    liveTime: new Date(),
    download: 0,
    upload: 0,
    torrents: []
  }
  return mongoDb.collection(PEERS_COLLECTION).insertOne(insertPeer)
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
  console.log('torrentId', torrentId)
  const pipeline = [
    // Step 1: Match peers that have the specified torrent ID and are still live
    {
      $match: {
        'torrents.torrentId': torrentId, // Convert torrentId to ObjectId
        liveTime: { $gt: new Date() } // Only peers whose liveTime is in the future
      }
    },
    // Step 2: Unwind the `torrents` array to access individual torrent objects
    {
      $unwind: '$torrents'
    },
    // Step 3: Filter to ensure only matching `torrentId` documents remain after unwind
    {
      $match: {
        'torrents.torrentId': torrentId
      }
    },
    // Step 4: Project only necessary fields, including one peer per unique piece hash
    {
      $group: {
        _id: '$torrents.pieceHashes', // Group by piece hash array
        peer: { $first: '$$ROOT' } // Select the first peer in each group
      }
    },
    // Step 5: Format the output to include only the necessary fields
    {
      $project: {
        _id: 0,
        hash: { $arrayElemAt: ['$_id', 0] }, // Extract the hash from the array
        ip: '$peer.ip',
        port: '$peer.port',
        peerId: '$peer._id'
      }
    }
  ]

  return mongoDb.collection(PEERS_COLLECTION).aggregate(pipeline).toArray()
}
// export async function findAvailablePeers(torrentId: ObjectId, peerId: ObjectId) {
//   return mongoDb
//     .collection(PEERS_COLLECTION)
//     .find({ torrentId, _id: { $ne: peerId } })
//     .project({ ip: 1, port: 1, pieces: 1 }) // Only include relevant fields
//     .toArray()
// }

export async function findPiecePeers(torrentId: ObjectId, pieceHash: string) {
  return mongoDb
    .collection(PEERS_COLLECTION)
    .findOne({
      'torrents.torrentId': new ObjectId(torrentId), // Match the specified torrent ID
      'torrents.pieceHashes': pieceHash, // Match the specified piece hash
      liveTime: { $gt: new Date() } // Ensure peer is live
    })
    .then((peer) => {
      if (!peer) return []
      return [{ ip: peer.ip, port: peer.port, peerId: peer._id }]
    })
}
