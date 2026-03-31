# EmbedBoard

EmbedBoard is a full-stack link dashboard where you can save, preview, organize, hide, and manage useful URLs.

It includes:

- A **React frontend** for interactive link management
- A **Spring Boot backend** with REST APIs
- **H2 in-memory database** for link storage
- Smart preview metadata extraction and embeddability checks

---

## Features

- Add links with optional descriptions
- View saved links in an interactive card grid
- Inline iframe rendering for embeddable links
- Smart fallback preview cards when iframe embedding is blocked
- Hide/unhide links for privacy
- Copy URL to clipboard
- Delete links with confirmation modal
- Undo last delete
- Clear all links
- Export links to JSON
- Search and sort links
- Light/Dark theme support

---

## Tech Stack

### Frontend

- React 19
- Axios
- CSS (custom styles + animations)
- Create React App (`react-scripts`)

### Backend

- Java 21
- Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- H2 Database
- Jsoup (for preview metadata scraping)

---

## Project Structure

```text
EmbedBoard/
  backend/
    pom.xml
    src/main/java/com/example/backend/
      controller/
        LinkController.java
        PreviewController.java
      model/
        Link.java
      repository/
        LinkRepository.java
    src/main/resources/
      application.properties
  frontend/
    package.json
    src/
      App.js
      components/
        AddLink.js
        LinkViewer.js
```

---

## Prerequisites

Install the following before running:

- **Java 21+**
- **Maven 3.9+**
- **Node.js 18+** (or 20+ recommended)
- **npm 9+**

---

## Configuration

Current backend config:

- App name: `backend`
- Backend port: `8083`

From `backend/src/main/resources/application.properties`:

```properties
spring.application.name=backend
server.port=8083
```

Frontend is configured to call:

- `http://localhost:8083/api`

---

## Run Locally

Open two terminals from the project root.

### 1) Start backend

```powershell
cd backend
mvn spring-boot:run
```

Backend will start at:

- `http://localhost:8083`

### 2) Start frontend

```powershell
cd frontend
npm install
npm start
```

Frontend dev server will start at:

- `http://localhost:3000`

---

## API Reference

Base URL:

- `http://localhost:8083/api`

### Links API

#### Create link

- **POST** `/links`

Request body:

```json
{
  "url": "https://example.com",
  "description": "Useful reference"
}
```

Response body (example):

```json
{
  "id": 1,
  "url": "https://example.com",
  "description": "Useful reference"
}
```

#### Get all links

- **GET** `/links`

Response body (example):

```json
[
  {
    "id": 1,
    "url": "https://example.com",
    "description": "Useful reference"
  }
]
```

#### Delete link

- **DELETE** `/links/{id}`

Response:

- `204 No Content`

---

### Preview API

#### Get preview metadata

- **GET** `/preview?url=<encoded_url>`

Example:

```http
GET /api/preview?url=https%3A%2F%2Fexample.com
```

Response body (example):

```json
{
  "url": "https://example.com",
  "domain": "example.com",
  "title": "Example Domain",
  "description": "Example description",
  "thumbnail": "https://example.com/og-image.jpg",
  "embeddable": false
}
```

Notes:

- The backend checks headers like `X-Frame-Options` and `Content-Security-Policy`
- If metadata fetch fails, sensible fallback values are returned

---

## Build

### Backend build

```powershell
cd backend
mvn clean package
```

### Frontend build

```powershell
cd frontend
npm run build
```

Frontend production build output:

- `frontend/build/`

---

## Common Issues

### Backend command fails from repository root

If `mvn spring-boot:run` fails from root, run inside `backend/`:

```powershell
cd backend
mvn spring-boot:run
```

### Frontend cannot reach backend

Check:

- Backend is running on port `8083`
- No firewall/proxy is blocking localhost
- Frontend API base in code points to `http://localhost:8083/api`

### Some links do not render in iframe

This is expected for sites that block embedding. EmbedBoard shows a smart preview card fallback for those links.

---

## Future Improvements (Optional)

- Persistent DB (PostgreSQL/MySQL) instead of in-memory H2
- Authentication and per-user dashboards
- Tags/folders for links
- Bulk import/export
- Docker setup for one-command startup

---
 
