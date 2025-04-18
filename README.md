# Wakanda Books Task

A React application for managing businesses and their articles with robust offline-first functionality and seamless cloud synchronization.

## Features

- Create and manage businesses
- Create and manage articles for each business
- Offline-first functionality with RxDB
- Automatic synchronization with MongoDB Atlas when online

## Technologies Used

- React.js
- TypeScript
- RxDB for local database
- MongoDB Atlas for cloud storage
- React Router for navigation

## Project Overview

This project is designed to help users manage business records and their associated articles. It leverages RxDB for offline-first local storage and automatically syncs data with a MongoDB Atlas cloud database when an internet connection is available. The app is built with React and TypeScript, providing a modern, responsive user experience.

### Offline-First and Sync

- All data is stored locally in the browser using RxDB (IndexedDB).
- When the app detects an internet connection, it automatically syncs local changes to the backend API, which updates MongoDB Atlas.
- The app also pulls the latest data from the cloud to ensure consistency across devices.

## Setup Instructions

1. **Clone the repository**
    ```bash
    git clone https://github.com/Armaansahab/Wakanda_books_Task.git
    cd Wakanda_books_Task
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Start the development server**
    ```bash
    npm run dev
    ```

4. **Build for production**
    ```bash
    npm run build
    ```

5. **Preview the production build**
    ```bash
    npm run preview
    ```

## How It Works

- **Local Database:** RxDB stores all businesses and articles locally, enabling full offline usage.
- **Sync with MongoDB Atlas:** When online, the app syncs local changes to the backend, which updates MongoDB Atlas, and pulls the latest data from the cloud.
- **Network Awareness:** The app detects network status and displays it in the UI, syncing automatically when online.

## Folder Structure

- `/src` - Main source code (components, pages, services, database)
- `/public` - Static assets

## Contribution

Feel free to fork this repository and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.

---

For more details on RxDB and MongoDB Atlas integration, see the code in `src/services/ReplicationService.tsx` and the RxDB schemas in `src/database/models/`.