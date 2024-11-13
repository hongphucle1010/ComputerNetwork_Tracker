interface TorrentFile {
  name: string
  size: number
  pieces: Piece[]
}

interface Piece {
  index: number
  size: number
  hash: string
}
