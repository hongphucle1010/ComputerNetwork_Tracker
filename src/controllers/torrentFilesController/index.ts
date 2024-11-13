/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from 'express'
import expressAsyncHandler from 'express-async-handler'
import { createTorrentFile, deleteTorrentFile, readTorrentFileById, updateTorrentFile } from '../../models/TorrentFile'
import { ObjectId } from 'mongodb'

export const createTorrentFileController = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.json(await createTorrentFile(req.body))
  }
)

export const readTorrentFileByIdController = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.json(await readTorrentFileById(new ObjectId(req.params.id)))
  }
)

export const updateTorrentFileController = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.json(await updateTorrentFile(new ObjectId(req.params.id), req.body))
  }
)

export const deleteTorrentFileController = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    res.json(await deleteTorrentFile(new ObjectId(req.params.id)))
  }
)

export const registerTorrentController = expressAsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, size, pieces } = req.body

      // Ensure the metadata has required fields
      if (!name || !size || !pieces || !Array.isArray(pieces)) {
        res.status(400).json({ message: 'Invalid metadata format.' })
        return
      }

      // Insert into the TorrentFiles collection
      const torrentFile = { name, size, pieces }
      const result = await createTorrentFile(torrentFile)

      res.status(200).json({ message: 'Torrent metadata uploaded successfully.', id: result.insertedId })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Error uploading torrent metadata.' })
    }
  }
)
