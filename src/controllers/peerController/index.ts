/* eslint-disable @typescript-eslint/no-unused-vars */
import expressAsyncHandler from 'express-async-handler'
import { createPeer, deletePeer, findAvailablePeers, readPeerById, updatePeer } from '../../models/Peer'
import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'

export const createPeerController = expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  res.json(await createPeer(req.body))
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
    console.log(req.params)
    res.json(await findAvailablePeers(new ObjectId(req.params.torrentId)))
  }
)
export const announcePeerController = expressAsyncHandler(async (req, res, next) => {
  try {
    const { peerId, port, torrents } = req.body
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip
    // live time would be 5 minutes from now
    const liveTime = new Date(Date.now() + 5 * 60 * 1000)

    // Ensure the metadata has required fields
    if (!peerId || !port || !torrents || !Array.isArray(torrents)) {
      res.status(400).json({ message: 'Invalid metadata format.' })
      return
    }

    // Update the Peers collection
    const peer = { _id: new ObjectId(peerId as string), ip, port, liveTime, download: 0, upload: 0, torrents }
    const result = await updatePeer(new ObjectId(peerId as string), peer)
  } catch (error) {
    console.error('Error in /announce:', error)
    res.status(500).json({ message: 'Error announcing peer' })
  }
})
