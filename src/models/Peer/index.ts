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

import { ObjectId } from 'mongodb'
import { PEERS_COLLECTION, TORRENT_FILES_COLLECTION } from '../../lib/constant'
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

export async function findAvailablePeers(torrentId: string) {
  const pipeline = [
    // Step 1: Match the TorrentFile by torrentId
    {
      $match: { _id: new ObjectId(torrentId) }
    },
    // Step 2: Unwind the pieces array
    {
      $unwind: '$pieces'
    },
    // Step 3: Perform a lookup to find peers for each piece
    {
      $lookup: {
        from: 'peer',
        let: { pieceIndex: '$pieces.index' },
        pipeline: [
          { $unwind: '$torrents' },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$torrents.torrentId', new ObjectId(torrentId)] },
                  { $in: ['$$pieceIndex', '$torrents.pieceIndexes'] },
                  { $gt: ['$liveTime', new Date()] }
                ]
              }
            }
          },
          { $project: { peerId: '$_id', ip: 1, port: 1, _id: 0 } }
        ],
        as: 'peer'
      }
    },
    // Step 4: Format the output
    {
      $project: {
        pieceIndex: '$pieces.index',
        peer: {
          $cond: {
            if: { $gt: [{ $size: '$peer' }, 0] }, // If peers array is not empty
            then: { $arrayElemAt: ['$peer', 0] }, // Take the first peer
            else: {} // Otherwise, return an empty object
          }
        }
      }
    },
    // Step 5: Sort by piece index
    {
      $sort: { pieceIndex: 1 }
    }
  ]

  const result = await mongoDb.collection(TORRENT_FILES_COLLECTION).aggregate(pipeline).toArray()
  const peersArray = result.map((item) => item.peer)
  return peersArray
}
// export async function findAvailablePeers(torrentId: ObjectId, peerId: ObjectId) {
//   return mongoDb
//     .collection(PEERS_COLLECTION)
//     .find({ torrentId, _id: { $ne: peerId } })
//     .project({ ip: 1, port: 1, pieces: 1 }) // Only include relevant fields
//     .toArray()
// }

export async function findPiecePeers(torrentId: ObjectId, pieceIndex: number) {
  return mongoDb
    .collection(PEERS_COLLECTION)
    .findOne({
      'torrents.torrentId': new ObjectId(torrentId), // Match the specified torrent ID
      'torrents.pieceIndexes': pieceIndex, // Match the specified piece hash
      liveTime: { $gt: new Date() } // Ensure peer is live
    })
    .then((peer) => {
      if (!peer) return []
      return [{ ip: peer.ip, port: peer.port, peerId: peer._id }]
    })
}
