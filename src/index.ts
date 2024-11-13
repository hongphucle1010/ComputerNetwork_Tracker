/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { NextFunction, Request, Response } from 'express'
import path from 'path'
import { routes } from './routes'
import cors from 'cors'
import { connectToDatabase } from './lib/mongoDbClient'

const app = express()
connectToDatabase()
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.get('/test', (req, res) => {
  res.json({
    message: 'Hi, this is Torrent Tracker Server'
  })
})
app.use('/api', routes)
app.use('/*', (req, res, next) => {
  res.status(404).json({
    message: 'Error: Route not found'
  })
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    message: 'Internal Server Error',
    errors: [err.message]
  })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
