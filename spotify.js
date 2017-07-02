const { getJSON, postJSON } = require('./http')
const { chain, curry, compose } = require('ramda')
const { safeProp, safeHead } = require('./utils')
const Future = require('fluture')
const { maybeToFuture } = require('./utils')

const CLIENT_ID = 'b03740660cad4846b28ed45a6760ab69'
const CLIENT_SECRET = '406d9c93c11b417b9ab3f9f9d59b9247'

const authHeader =
  Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')

const cacheAccessToken = res => res

// getAccessToken :: () -> Future String
const getAccessToken = () =>
  postJSON({Authorization: 'Basic '+authHeader},
           'https://accounts.spotify.com/api/token',
           {grant_type: 'client_credentials'})
  .map(JSON.parse)
  .map(cacheAccessToken)

const trackUrl = id => `https://api.spotify.com/v1/tracks/${id}`

// bearerTokenHeader :: String -> {}
const bearerTokenHeader = token =>
({
  Authorization: `Bearer ${token}`
})

// getTrackInfo :: String -> String -> Future JSON
const getTrackInfo = curry((trackId, accessToken) =>
  getJSON(bearerTokenHeader(accessToken), trackUrl(trackId)))

// contactSpotify :: String -> Future JSON
const contactSpotify = trackId =>
  getAccessToken()
  .map(safeProp('access_token'))
  .chain(maybeToFuture)
  .chain(getTrackInfo(trackId))
  .map(JSON.parse)

// getTrackName :: {} -> Maybe String
const getTrackName = safeProp('name')

// getFirstTrackArtist :: {} -> Maybe String
const getFirstTrackArtist = compose(
  chain(safeProp('name')),
  chain(safeHead),
  safeProp('artists'))

// callSpotify :: [String] -> Future [String]
const callSpotify = songs =>
  songs.traverse(Future.of, contactSpotify)

module.exports = {
  callSpotify,
  getFirstTrackArtist,
  getTrackName,
}