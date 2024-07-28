import express, { Request, Response } from 'express';
import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize the app and environment variables
const app = express();
const { COOKIE, TOKEN_URL, LYRICS_BASE_URL, CLIENT_ID, CLIENT_SECRET, SEARCH_TOKEN, SEARCH_URL } = process.env;

// Configure winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
    ]
});

// Route handlers
app.get('/key', (req: Request, res: Response) => {
    logger.info('Key endpoint hit');
    res.send("success");
});

app.get('/getLyrics/:trackId', async (req: Request, res: Response) => {
    try {
        logger.info(`Fetching lyrics for track ID: ${req.params.trackId}`);
        const tokenResponse = await axios.get(TOKEN_URL!, {
            headers: {
                "Cookie": `sp_dc=${COOKIE}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36"
            }
        });
        const { accessToken } = tokenResponse.data;

        const lyricsResponse = await axios.get(`${LYRICS_BASE_URL}${req.params.trackId}?format=json&vocalRemoval=false&market=from_token`, {
            headers: {
                "App-platform": "WebPlayer",
                "Authorization": `Bearer ${accessToken}`,
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36"
            }
        });

        res.send(lyricsResponse.data);
    } catch (error: any) {
        logger.error(`Error fetching lyrics for track ID: ${req.params.trackId} - ${error.message}`);
        res.status(500).send('Failed to fetch lyrics');
    }
});

app.get('/getLyricsByName/:musician/:track', async (req: Request, res: Response) => {
    try {
        logger.info(`Searching for lyrics by musician: ${req.params.musician}, track: ${req.params.track}`);
        const encoded = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
        logger.debug('Encoded token:', encoded);

        const tokenResponse = await axios.post(SEARCH_TOKEN!, new URLSearchParams({ grant_type: 'client_credentials' }), {
            headers: {
                'Authorization': `Basic ${encoded}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        const accessToken = tokenResponse.data.access_token;
        const searchUrl = `${SEARCH_URL}?q=artist:${encodeURIComponent(req.params.musician)}%20track:${encodeURIComponent(req.params.track)}&type=track&limit=10`;
        logger.debug('Search URL:', searchUrl);

        const searchResponse = await axios.get(searchUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        const tracks = searchResponse.data.tracks.items;

        if (!tracks.length) {
            logger.warn('No tracks found');
            return res.status(404).send("No tracks found");
        }

        let filteredTracks = tracks.filter((track: any) => {
            const isRemix = track.name.toLowerCase().includes("remix");
            return req.query.remix === 'true' ? isRemix : !isRemix;
        }).sort((a: any, b: any) => b.popularity - a.popularity);

        if (!filteredTracks.length) {
            filteredTracks = tracks.filter((track: any) => !track.name.toLowerCase().includes("remix")).sort((a: any, b: any) => b.popularity - a.popularity);
        }

        const realTrack = filteredTracks.shift();

        if (realTrack) {
            logger.info(`Found track ID: ${realTrack.id}`);
            res.redirect(`/getLyrics/${realTrack.id}`);
        } else {
            logger.warn('No suitable tracks found');
            res.status(404).send("No suitable tracks found");
        }
    } catch (error: any) {
        logger.error(`Error searching for lyrics - ${error.message}`);
        res.status(500).send('Failed to search for lyrics');
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    logger.info(`Server started on port ${PORT}`);
});

export default app;
