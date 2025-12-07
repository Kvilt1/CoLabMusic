import { parseFile } from 'music-metadata';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MUSIC_DIR = path.join(__dirname, '../public/music');
const COVERS_DIR = path.join(__dirname, '../public/covers');
const OUTPUT_FILE = path.join(__dirname, '../src/data/realSongs.json');

// Ensure covers directory exists
if (!fs.existsSync(COVERS_DIR)) {
    fs.mkdirSync(COVERS_DIR, { recursive: true });
}

async function generateMetadata() {
    const files = fs.readdirSync(MUSIC_DIR).filter(file => /\.(mp3|m4a|wav|flac)$/i.test(file));
    const songs = [];

    console.log(`Found ${files.length} audio files. Processing...`);

    for (let i = 0; i < files.length; i++) {
        const filename = files[i];
        const filePath = path.join(MUSIC_DIR, filename);
        const id = i + 1;

        try {
            const metadata = await parseFile(filePath);
            const { common, format } = metadata;

            // Title: Metadata title or Filename (minus extension)
            const title = common.title || path.parse(filename).name;

            // Artist: Metadata artist or "Unknown Artist". Replace ; with ,
            const artist = common.artists ? common.artists.join(', ') : (common.artist || 'Unknown Artist');
            const formattedArtist = artist.replace(/;/g, ',');

            // Duration: Format seconds to MM:SS
            const durationSec = format.duration || 0;
            const minutes = Math.floor(durationSec / 60);
            const seconds = Math.floor(durationSec % 60);
            const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Date: "Added recently" placeholder or extract creation time if available (using file stats)
            const stats = fs.statSync(filePath);
            const date = "Added recently"; // keeping simple for now, or use stats.mtime.toLocaleDateString();

            // Cover Art
            let coverPath = null;
            if (common.picture && common.picture.length > 0) {
                const pic = common.picture[0];
                const ext = pic.format.split('/')[1] || 'jpg';
                const coverFilename = `cover_${id}.${ext}`;
                const coverFilePath = path.join(COVERS_DIR, coverFilename);

                fs.writeFileSync(coverFilePath, pic.data);
                coverPath = `/covers/${coverFilename}`;
            }

            songs.push({
                id,
                title,
                artist: formattedArtist,
                album: common.album || 'Unknown Album',
                group: 'einkigin', // Assigning all to the new vault
                duration,
                date,
                url: `/music/${filename}`,
                cover: coverPath
            });

            console.log(`Processed: ${title}`);

        } catch (err) {
            console.error(`Error processing ${filename}:`, err.message);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(songs, null, 2));
    console.log(`\nSuccessfully generated metadata for ${songs.length} songs -> ${OUTPUT_FILE}`);
}

generateMetadata();
