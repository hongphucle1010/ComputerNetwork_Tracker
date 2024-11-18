interface Peer {
  _id?: ObjectId
  ip: string
  port: number
  liveTime: Date
  download: number
  upload: number
  torrents: PeerTorrent[]
}

interface FilePiece {
  filename: string
  pieceIndexes: number[]
}

interface PeerTorrent {
  torrentId: ObjectId
  files: FilePiece[]
}
