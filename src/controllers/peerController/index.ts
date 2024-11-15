/* eslint-disable @typescript-eslint/no-unused-vars */
import expressAsyncHandler from 'express-async-handler'
import { createPeer, deletePeer, findAvailablePeers, findPiecePeers, readPeerById, updatePeer } from '../../models/Peer'
import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'

export const createPeerController = expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.json(
    await createPeer({
      ip: req.body.ip,
      port: req.body.port
    })
  )
})

export const readPeerByIdController = expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.json(await readPeerById(new ObjectId(req.params.id)))
})

export const updatePeerController = expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.json(await updatePeer(new ObjectId(req.params.id), req.body))
})

export const deletePeerController = expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.json(await deletePeer(new ObjectId(req.params.id)))
})

export const findAvailablePeersController = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.json(await findAvailablePeers(req.params.torrentId))
  }
)

export const findPiecePeersController = expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { torrentId, pieceIndex } = req.params
  const response = await findPiecePeers(new ObjectId(torrentId), parseInt(pieceIndex))
  res.json(response)
})

export const announcePeerController = expressAsyncHandler(async (req, res, next) => {
  try {
    const { peerId, port, torrents } = req.body
    const ip = req.body.ip
    // live time would be 5 minutes from now
    const liveTime = new Date(Date.now() + 5 * 60 * 1000)

    // Ensure the metadata has required fields
    if (!peerId || !port || !torrents || !Array.isArray(torrents)) {
      res.status(400).json({ message: 'Invalid metadata format.' })
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedTorrents = torrents.map((torrent: any) => {
      return {
        torrentId: new ObjectId(torrent.torrentId as string),
        pieceIndexes: torrent.pieceIndexes
      }
    })

    // Update the Peers collection
    const peer = {
      _id: new ObjectId(peerId as string),
      ip,
      port,
      liveTime,
      download: 0,
      upload: 0,
      torrents: formattedTorrents
    }
    const result = await updatePeer(new ObjectId(peerId as string), peer)
    res.status(200).json({ message: 'Peer announced successfully' })
  } catch (error) {
    console.error('Error in /announce:', error)
    res.status(500).json({ message: 'Error announcing peer' })
  }
})
