interface Peer {
  _id?: ObjectId
  ip: string
  port: number
  liveTime: Date
  download: number
  upload: number
  torrents: PeerTorrent[]
}

interface PeerTorrent {
  torrentId: ObjectId
  pieceHashes: string[]
}
