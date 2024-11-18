/* eslint-disable @typescript-eslint/no-explicit-any */
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
  try {
    const { torrentId, filename, pieceIndex } = req.query

    // Validate input
    if (!torrentId || !filename || pieceIndex === undefined) {
      res.status(400).json({ error: 'Missing required query parameters: torrentId, filename, or pieceIndex' })
      return
    }

    const response = await findPiecePeers(
      new ObjectId(torrentId as string),
      parseInt(pieceIndex as string),
      filename as string
    )

    if (!response.length) {
      res.status(404).json({ error: 'No peers found for the given piece' })
      return
    }

    res.json(response)
  } catch (error) {
    next(error) // Forward error to the error handler
  }
})

export const announcePeerController = expressAsyncHandler(async (req, res, next) => {
  try {
    const { peerId, port, torrents, ip } = req.body

    // Live time would be 5 minutes from now
    const liveTime = new Date(Date.now() + 5 * 60 * 1000)

    // Validate input
    if (!peerId || !port || !torrents || !Array.isArray(torrents)) {
      res.status(400).json({ message: 'Invalid metadata format.' })
      return
    }

    // Format torrents for the new schema
    const formattedTorrents = torrents.map((torrent: any) => {
      if (!torrent.torrentId || !Array.isArray(torrent.files)) {
        throw new Error('Invalid torrent data format.')
      }

      return {
        torrentId: new ObjectId(torrent.torrentId as string),
        files: torrent.files.map((file: any) => {
          if (!file.filename || !Array.isArray(file.pieceIndexes)) {
            throw new Error('Invalid file data format.')
          }
          return {
            filename: file.filename,
            pieceIndexes: file.pieceIndexes
          }
        })
      }
    })

    // Construct the peer object
    const peer = {
      _id: new ObjectId(peerId as string),
      ip,
      port,
      liveTime,
      download: 0,
      upload: 0,
      torrents: formattedTorrents
    }

    // Update the peer in the database
    const result = await updatePeer(new ObjectId(peerId as string), peer)

    if (!result) {
      res.status(500).json({ message: 'Failed to announce peer' })
      return
    }

    res.status(200).json({ message: 'Peer announced successfully' })
  } catch (error) {
    console.error('Error in announcePeerController:', error)
    res.status(500).json({ message: 'Error announcing peer', error: (error as Error).message })
  }
})
