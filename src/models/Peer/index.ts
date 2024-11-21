/* 
TorrentFile schema:
{
    _id: ObjectId,     // Unique identifier for the torrent file
    files: [
      size: Number,      // Total size of the file in bytes
      filename: String,  // Name of the file
      pieces: [          // Array of pieces associated with the torrent
          {
              index: Number,        // Index of the piece
              size: Number,         // Size of the piece
              hash: String,         // Hash for data integrity check
          }
      ]
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
            files: [
              filename: String,  // Name of the file
              pieceIndexes: [Number] // Array of piece hashes that the peer has
            ]
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
    // Step 2: Unwind the files array
    {
      $unwind: '$files'
    },
    // Step 3: Unwind the pieces array within each file
    {
      $unwind: '$files.pieces'
    },
    // Step 4: Perform a lookup to find peers for each piece
    {
      $lookup: {
        from: 'peer',
        let: {
          filename: '$files.filename',
          pieceIndex: '$files.pieces.index'
        },
        pipeline: [
          { $unwind: '$torrents' },
          { $unwind: '$torrents.files' },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$torrents.torrentId', new ObjectId(torrentId)] },
                  { $eq: ['$torrents.files.filename', '$$filename'] },
                  { $in: ['$$pieceIndex', '$torrents.files.pieceIndexes'] },
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
    // Step 5: Group peers by filename and piece index
    {
      $group: {
        _id: {
          filename: '$files.filename',
          pieceIndex: '$files.pieces.index'
        },
        peer: { $first: { $arrayElemAt: ['$peer', 0] } } // Take the first peer if available
      }
    },
    // Step 6: Reformat the result to group by filename
    {
      $group: {
        _id: '$_id.filename',
        pieces: {
          $push: {
            index: '$_id.pieceIndex',
            peer: '$peer'
          }
        }
      }
    },
    // Step 7: Format the final output
    {
      $project: {
        filename: '$_id',
        pieces: {
          $map: {
            input: '$pieces',
            as: 'piece',
            in: {
              ip: { $ifNull: ['$$piece.peer.ip', null] },
              port: { $ifNull: ['$$piece.peer.port', null] },
              peerId: { $ifNull: ['$$piece.peer.peerId', null] }
            }
          }
        }
      }
    }
  ]

  // Execute the aggregation pipeline
  const result = await mongoDb.collection(TORRENT_FILES_COLLECTION).aggregate(pipeline).toArray()

  // Return the formatted result
  return result.map((item) => ({
    filename: item.filename,
    pieces: item.pieces
  }))
}

// export async function findAvailablePeers(torrentId: ObjectId, peerId: ObjectId) {
//   return mongoDb
//     .collection(PEERS_COLLECTION)
//     .find({ torrentId, _id: { $ne: peerId } })
//     .project({ ip: 1, port: 1, pieces: 1 }) // Only include relevant fields
//     .toArray()
// }

export async function findPiecePeers(torrentId: ObjectId, pieceIndex: number, filename: string) {
  return mongoDb
    .collection(PEERS_COLLECTION)
    .find({
      'torrents.torrentId': torrentId,
      'torrents.files': {
        $elemMatch: {
          filename,
          pieceIndexes: pieceIndex
        }
      },
      liveTime: { $gt: new Date() }
    })
    .toArray()
    .then((peers) => {
      return peers.map((peer) => ({ ip: peer.ip, port: peer.port, peerId: peer._id }))
    })
}
