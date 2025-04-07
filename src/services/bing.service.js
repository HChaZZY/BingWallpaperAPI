const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const config = require('../../config/default.json');
const writeFile = promisify(fs.writeFile);
const { createLogger } = require('../utils/logger');

const logger = createLogger('bing-service');

class BingService {
  constructor() {
    this.apiUrl = config.bing.apiUrl;
    this.baseUrl = config.bing.baseUrl;
    this.cachePath = config.cache.path;
    this.metadataPath = config.cache.metadataPath;
    this.maxRetryAttempts = config.retry.maxAttempts;
    this.retryDelay = config.retry.delayMs;
  }

  async getMetadata() {
    let retryCount = 0;

    while (retryCount < this.maxRetryAttempts) {
      try {
        logger.info('Acquiring Bing wallpaper metadata...');
        const response = await axios.get(this.apiUrl);

        if (response.status !== 200 || !response.data || !response.data.images) {
          throw new Error('Invalid response from Bing API');
        }

        logger.info('Bing wallpaper metadata acquired successfully.');
        return response.data;
      } catch (error) {
        retryCount++;
        logger.error(`Failed to acquire Bing wallpaper metadata (Attempt ${retryCount}/${this.maxRetryAttempts}): ${error.message}`);

        if (retryCount < this.maxRetryAttempts) {
          logger.info(`Retry after ${this.retryDelay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          throw new Error(`Failed to acquire Bing wallpaper metadata, max retries reached:  ${error.message}`);
        }
      }
    }
  }

  generateWallpaperUrl(metadata) {
    try {
      if (!metadata || !metadata.images || !metadata.images[0]) {
        throw new Error('Invalid metadata provided.');
      }

      const image = metadata.images[0];
      const urlBase = image.urlbase;

      const uhdUrl = `${urlBase}_UHD.jpg`;
      const fullUhdUrl = `${this.baseUrl}${uhdUrl}`;

      logger.info(`Generated wallpaper URL: ${fullUhdUrl}`);

      return {
        url: fullUhdUrl,
        startDate: image.startdate,
        title: image.title,
        copyright: image.copyright
      };
    } catch (error) {
      logger.error(`GenerateWallpaperUrl error:  ${error.message}`);
      throw error;
    }
  }

  async downloadWallpaper(url) {
    try {
      logger.info(`Downloading wallpaper from:  ${url}`);

      const cacheDir = path.dirname(this.cachePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'arraybuffer'
      });

      if (response.status !== 200) {
        throw new Error(`Download failed with status code: ${response.status}`);
      }

      await writeFile(this.cachePath, response.data);
      logger.info(`Wallpaper saved to:  ${this.cachePath}`);

      return true;
    } catch (error) {
      logger.error(`Download wallpaper error:  ${error.message}`);
      throw error;
    }
  }

  async saveMetadata(metadata) {
    try {
      const cacheDir = path.dirname(this.metadataPath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      await writeFile(this.metadataPath, JSON.stringify(metadata, null, 2));
      logger.info(`Metadata saved to: ${this.metadataPath}`);

      return true;
    } catch (error) {
      logger.error(`Metadata save error: ${error.message}`);
      throw error;
    }
  }

  async checkAndUpdateWallpaper() {
    try {
      const metadata = await this.getMetadata();
      const wallpaperInfo = this.generateWallpaperUrl(metadata);

      let needUpdate = true;

      if (fs.existsSync(this.metadataPath)) {
        try {
          const oldMetadata = JSON.parse(fs.readFileSync(this.metadataPath, 'utf8'));
          if (oldMetadata.images &&
              oldMetadata.images[0] &&
              oldMetadata.images[0].startdate === metadata.images[0].startdate) {
            needUpdate = false;
            logger.info('Wallpaper is up to date. No update needed.');
          }
        } catch (error) {
          logger.warn(`Failed to read old metadata, forced update: ${error.message}`);
        }
      }

      if (needUpdate) {
        await this.downloadWallpaper(wallpaperInfo.url);
        await this.saveMetadata(metadata);

        logger.info('Wallpaper updated successfully.');
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Failed to check and update wallpaper: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new BingService();