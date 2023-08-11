const express = require('express')
const crypto = require('node:crypto')

const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const PORT = process.env.PORT ?? 3003

const ACCEPTED_ORIGINS = [
  'http://localhost:3003',
  'http://localhost:8080',
  'http://localhost:8081'
]

const app = express()
app.disable('x-powered-by')

// middleware is used to retrieve data,
// and place it in our request.body property
app.use(express.json())

// All resources that are MOVIES are
// identified with the route /movies
app.get('/movies', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    // CORS --> Cross-Origin-Resource-Sharing.
    // You can use "*", if you want to accept all origins.
    // res.header('Access-Control-Allow-Origin', '*')
    // res.header('Access-Control-Allow-Origin', 'http://localhost:8081')

    res.header('Access-Control-Allow-Origin', origin)
  }

  const { genre } = req.query

  if (genre) {
    const filteredMovies = movies.filter(
      (movie) => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }

  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to-regex
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found 😔' })
})

// The operations are defined by the HTTP verbs.
app.post('/movies', (req, res) => {
  // Here, we gonna do the validations.
  const result = validateMovie(req.body)

  console.log(result.error)

  if (result.error) {
    return res.status(422).json({ error: JSON.parse(result.error.message) })
  }

  const newMovie = {
    id: crypto.randomUUID(), // uuid V4 - Universal Unique Identifier
    ...result.data
  }

  // 🔴 It won't REST, because we save
  // the application state in memmory.
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

// CORS PRE-flight
// Normal methods: GET/HEAD/POST
// Complex methods: PUT/PATH/DELETE

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')

  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
  }
  res.send(200)
})

app.listen(PORT, () => {
  console.log(`server listening on port:http://localhost:${PORT}`)
})
