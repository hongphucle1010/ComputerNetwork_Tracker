/* eslint-disable @typescript-eslint/no-explicit-any */
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
      const { files } = req.body

      // Validate input
      if (!files || !Array.isArray(files)) {
        res.status(400).json({ message: 'Invalid metadata format.' })
        return
      }

      // Format input to match TorrentFile interface
      const formattedFiles: MyFile[] = files.map((file: any) => {
        const { filename, size, pieces } = file

        if (!filename || typeof filename !== 'string') {
          throw new Error('Invalid file: missing or invalid "filename".')
        }
        if (!size || typeof size !== 'number') {
          throw new Error('Invalid file: missing or invalid "size".')
        }
        if (!pieces || !Array.isArray(pieces)) {
          throw new Error('Invalid file: missing or invalid "pieces".')
        }

        const formattedPieces: Piece[] = pieces.map((piece: any) => {
          const { index, size, hash } = piece

          if (typeof index !== 'number') {
            throw new Error('Invalid piece: missing or invalid "index".')
          }
          if (typeof size !== 'number') {
            throw new Error('Invalid piece: missing or invalid "size".')
          }
          if (!hash || typeof hash !== 'string') {
            throw new Error('Invalid piece: missing or invalid "hash".')
          }

          return { index, size, hash }
        })

        return { filename, size, pieces: formattedPieces }
      })

      const torrentFile: TorrentFile = { files: formattedFiles }

      // Insert into the TorrentFiles collection
      const result = await createTorrentFile(torrentFile)

      res.status(200).json({ message: 'Torrent metadata uploaded successfully.', id: result.insertedId })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: 'Error uploading torrent metadata.' })
    }
  }
)
