# Lyrics Fetcher

Microservice for hyperspace music that fetches synced lyrics to any song, via the spotify API.

## Guide

Token Url

```
https://open.spotify.com/get_access_token?reason=transport&productType=web_player
```

Lyrics Base Url

```
https://spclient.wg.spotify.com/color-lyrics/v2/track/
```

Search Token

```
https://accounts.spotify.com/api/token
```

Search URL

```
https://api.spotify.com/v1/search
```

Generate a new app under Spotify's developer dashboard and get the client id and secret key.

To get your spotify cookie, open spotify web and extract the `sp_dc` cookie.

## Endpoints

#### Search lyrics by Track ID

```
GET http://localhost:3000/getLyrics/{trackId}
```

This endpoint allows you to search for lyrics of a specific track using the Spotify Track ID.

#### Search lyrics by Artist Name and Track Name

```
GET htts://localhost:3000/getLyricsByName/{artistName}/{trackName}?remix={true/false}
```

This endpoint allows you to search for lyrics of a specific track using the Artist Name and Track Name.

The `remix` query parameter is optional, if set to true it will only return official remix songs.
Example:

```
http://localhost:3000/getLyricsByName/Asake/Sungba?remix=true
```
