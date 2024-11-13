import express from 'express'
import {
  createTorrentFileController,
  deleteTorrentFileController,
  readTorrentFileByIdController,
  updateTorrentFileController,
  registerTorrentController
} from '../controllers/torrentFilesController'
import { announcePeerController, findPiecePeersController } from '~/controllers/peerController'
import {
  createPeerController,
  deletePeerController,
  findAvailablePeersController,
  readPeerByIdController,
  updatePeerController
} from '../controllers/peerController'
export const routes = express.Router()

const torrentFilesRouter = express.Router()
const peersRouter = express.Router()

routes.use('/torrentFiles', torrentFilesRouter)
routes.use('/peers', peersRouter)

torrentFilesRouter.post('/', createTorrentFileController)
torrentFilesRouter.get('/:id', readTorrentFileByIdController)
torrentFilesRouter.put('/:id', updateTorrentFileController)
torrentFilesRouter.delete('/:id', deleteTorrentFileController)

peersRouter.post('/', createPeerController)
peersRouter.get('/:id', readPeerByIdController)
peersRouter.put('/:id', updatePeerController)
peersRouter.delete('/:id', deletePeerController)

routes.post('/register-torrent', registerTorrentController)
routes.put('/announce', announcePeerController)
routes.post('/register-peer', createPeerController)
routes.get('/find-available-peers/:torrentId', findAvailablePeersController)
routes.get('/find-piece-peers/:torrentId/:pieceHash', findPiecePeersController)
