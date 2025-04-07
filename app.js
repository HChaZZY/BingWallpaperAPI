const express = require('express');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const bingService = require('./src/services/bing.service');
const config = require('./config/default.json');
const { createLogger } = require('./src/utils/logger');

const logger = createLogger('app');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || config.server.port;
const HOST = config.server.host;

const wallpaperCachePath = path.resolve(config.cache.path);
const metadataCachePath = path.resolve(config.cache.metadataPath);

const cacheDir = path.dirname(wallpaperCachePath);
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  logger.info(`Created cache directory: ${cacheDir}`);
}

async function updateWallpaper() {
  try {
    logger.info('Start checking for wallpaper update...');
    const updated = await bingService.checkAndUpdateWallpaper();

    if (updated) {
      logger.info('Wallpaper updated. Saving metadata...');
    } else {
      logger.info('Wallpaper does not need updating.');
    }
  } catch (error) {
    logger.error(`Wallpaper update failed: ${error.message}`);
  }
}

(async () => {
  try {
    if (!fs.existsSync(wallpaperCachePath)) {
      logger.info('No cached wallpaper found. Downloading...');
      await updateWallpaper();
    } else {
      logger.info(`Found cached wallpaper: ${wallpaperCachePath}`);
    }
  } catch (error) {
    logger.error(`Initial wallpaper load failed: ${error.message}`);
  }
})();

cron.schedule(config.schedule.checkInterval, async () => {
  logger.info('Executing scheduled wallpaper update.');
  await updateWallpaper();
});

app.get('/images', (req, res) => {
  try {
    if (fs.existsSync(wallpaperCachePath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');

      return res.sendFile(wallpaperCachePath);
    } else {
      logger.warn('No wallpaper found in cache. Returning 404.');
      return res.status(404).send('No wallpaper found.');
    }
  } catch (error) {
    logger.error(`Wallpaper request failed:  ${error.message}`);
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/health', (req, res) => {
  return res.json({ status: 'OK', version: '1.0.0' });
});

app.get('/metadata', (req, res) => {
  try {
    const metadataPath = path.resolve(config.cache.metadataPath);
    if (fs.existsSync(metadataPath)) {
      const metadata = fs.readFileSync(metadataPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(metadata);
    } else {
      logger.warn('No metadata found in cache. Returning 404.');
      return res.status(404).send('No metadata found.');
    }
  } catch (error) {
    logger.error(`Metadata request failed: ${error.message}`);
    return res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, HOST, () => {
  logger.info(`Listening ${HOST}:${PORT}`);
  logger.info(`http://localhost:${PORT} for Wallpaper`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception:  ${error.message}`, { stack: error.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UnhandledPromiseRejection: ', { reason });
});