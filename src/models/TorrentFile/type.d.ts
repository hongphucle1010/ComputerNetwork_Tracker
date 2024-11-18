interface TorrentFile {
  files: MyFile[]
}

interface MyFile {
  size: number
  filename: string
  pieces: Piece[]
}

interface Piece {
  index: number
  size: number
  hash: string
}
