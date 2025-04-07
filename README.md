# BingWallpaperAPI

This project is a simple API service that caches the daily Bing wallpaper and provides it for use in other applications. It fetches the wallpaper metadata from the Bing API, downloads the image, and saves it locally.

## Features

- Fetches the daily Bing wallpaper.
- Caches the wallpaper image and metadata.
- Provides an API endpoint to access the wallpaper.
- Automatically updates the wallpaper on a daily basis.

## Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/HChaZZY/BingWallpaperAPI.git
    cd BingWallpaperAPI
    ```
2.  Install the dependencies:

    ```bash
    npm install
    ```

3.  **Docker** (Optional)

    - Using Docker Compose:

        ```bash
        docker-compose up -d
        ```

    - Using Docker:

        ```bash
        docker build -t bing-wallpaper-api .
        docker run -d -p 3000:3000 bing-wallpaper-api
        ```

## Usage

1.  Configure the settings in `config/default.json` if needed:
    - Server port and host (`server.port` and `server.host`)
    - Bing API URL (`bing.apiUrl` and `bing.baseUrl`)
    - Cache paths (`cache.path` and `cache.metadataPath`)
    - Update schedule (`schedule.checkInterval`, using cron format)
    - Retry settings (`retry.maxAttempts` and `retry.delayMs`)

2.  Start the server:

    ```bash
    npm start
    ```
    
    After successful startup, the console will display the following information:
    ```
    Listening 0.0.0.0:3000
    http://localhost:3000 for Wallpaper
    ```

3.  Access wallpaper and health check:
    - Wallpaper image: `http://localhost:3000/images`
    - Health check: `http://localhost:3000/health`

## System Requirements

- Node.js >= 14.0.0

## Main Dependencies

- Express: Web server framework
- Axios: HTTP client
- node-cron: Scheduled task scheduling
- Winston: Log recording

## License

MIT License

© 2025 HCha. All rights reserved.
