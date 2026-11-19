# 🍺 Beer Catalog

Semester project for Advanced Database Systems (UTB FAI Zlín): a beer catalog with a REST API, a web client and a MongoDB Atlas database.

## 👤 1. Student and project

| | |
|---|---|
| Student | Michal Dolanský |
| Student ID | A26338 |
| Project | Beer Catalog |
| Course | Advanced Database Systems |

**Description.** The application manages a catalog of beers and their breweries. Users can browse and search beers, see a beer with its brewery, and add, edit and delete beers. The client talks only to the REST API, never to the database.

**Screens**

| Screen | File | What it does |
|---|---|---|
| Home | `client/index.html` | Beer list, text search, **Show all**, **New beer** |
| Details | `client/details.html` | One beer with its brewery, **Edit**, **Delete** |
| New / Edit | `client/form.html` | One form for adding (`POST`) and editing (`PUT`); brewery chosen by name |

**Project structure**

```
backend/     REST API (server.js, package.json, .env.example)
client/      web client (index.html, details.html, form.html, style.css, img/)
database/    exported collections (beers.json, breweries.json) and indexes.txt
README.md    project documentation
```

## 🛠️ 2. Technology stack

| Layer | Technology |
| --- | --- |
| Database | MongoDB Atlas |
| Backend | Node.js, Express 5, MongoDB Node.js driver |
| Client | HTML, JavaScript (`fetch`), Bootstrap 5.3 |
| API testing | Thunder Client |

## 🛢 3. Data model

Two collections linked by `brewery_id`.

**beers** (Collection A, main)

| Field | Description |
|---|---|
| `beer_id` | Unique beer ID (used in the API URLs) |
| `name` | Beer name |
| `style` | Beer style |
| `abv` | Alcohol by volume (%) |
| `plato` | Original gravity in degrees Plato (whole number) |
| `description` | Short description |
| `brewery_id` | Reference to `breweries.brewery_id` |

**breweries** (Collection B, related)

| Field | Description |
|---|---|
| `brewery_id` | Unique brewery ID |
| `name` | Brewery name |
| `city` | City |
| `country` | Country |
| `founded_year` | Year the brewery was founded |
| `website` | Official website of the brewery |

**Relationship:** `beers.brewery_id` → `breweries.brewery_id` (many beers belong to one brewery). Details shows the brewery of a beer; the API checks that the brewery exists when a beer is saved.

The collections contain 30 beers and 14 breweries (see `database/`).

## 🔍 4. Text index

| | |
|---|---|
| Collection | `beers` |
| Indexed fields | `name`, `style`, `description` |
| Command | `db.beers.createIndex({ name: "text", style: "text", description: "text" })` |
| Search query | `{ $text: { $search: query } }`, results sorted by `textScore` |
| Endpoint | `GET /beers/search?query=ipa` |

The search endpoint passes `query` to `$text` / `$search`, which uses the text index. Search is case-insensitive; an empty `query` returns `400`, no match returns an empty list. The command is also in `database/indexes.txt`.

## 📡 5. API endpoints

Base URL: `http://localhost:3000`

| Method | URL | Description |
|---|---|---|
| GET | `/beers` | All beers |
| GET | `/beers/search?query=` | Text search in beers |
| GET | `/beers/:id` | One beer by `beer_id` |
| GET | `/breweries` | All breweries |
| GET | `/breweries/:id` | One brewery by `brewery_id` |
| POST | `/beers` | Add a new beer |
| PUT | `/beers/:id` | Edit a beer |
| DELETE | `/beers/:id` | Delete a beer |

Status codes:

- `200` OK
- `201` created
- `400` invalid input
- `404` not found
- `409` duplicate `beer_id`
- `500` server error

### Add a beer

`POST /beers` with a JSON body:

```json
{
  "beer_id": 31,
  "name": "Example Lager",
  "style": "Lager",
  "abv": 4.8,
  "plato": 12,
  "description": "Optional text",
  "brewery_id": 1
}
```

- **Required:** `beer_id` (whole number, unique), `name`, `style`, `abv` (0–100), `plato` (whole number 0–40), `brewery_id` (existing brewery)
- **Optional:** `description`

Returns `201` with the new beer, `400` with a list of errors, or `409` for a duplicate `beer_id`.

### Edit a beer

`PUT /beers/:id` with a JSON body containing only the fields to change, for example `{ "abv": 5.2 }`.

- **Allowed:** `name`, `style`, `abv`, `plato`, `description`, `brewery_id`
- **Cannot be changed:** `beer_id`

Returns the updated beer, `404` if the beer does not exist, or `400` for invalid input.

### Delete a beer

`DELETE /beers/:id` has no body. Returns `200` with a message, or `404` if the beer does not exist.

## ▶️ 6. How to run

**Requirements:** Node.js 20.6 or newer (needed for `--env-file`), a MongoDB Atlas cluster, and an internet connection in the browser (Bootstrap and Bootstrap Icons are loaded from a CDN).

1. Create a database in MongoDB Atlas and import `database/beers.json` into a collection `beers` and `database/breweries.json` into a collection `breweries` (for example in MongoDB Compass: collection → **Add Data** → **Import JSON file**).
2. Create the text index from `database/indexes.txt` (in mongosh, or in Compass: `beers` → **Indexes** → **Create Index** with `name`, `style` and `description` set to `text`).
3. In Atlas, open **Network Access** and add your current IP address (repeat when working from a new network).
4. Go to the backend folder:
   ```
   cd backend
   ```
5. Copy `.env.example` to `.env` and set the values:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
   DB_NAME=<your database name>
   PORT=3000
   ```
   | Variable | Meaning |
   |---|---|
   | `MONGODB_URI` | Atlas connection string (Atlas → Connect → Drivers) |
   | `DB_NAME` | Name of the database that holds both collections |
   | `PORT` | Port of the API (optional, default 3000) |

   ⚠️ The `.env` file contains the database password. Never commit or share it.
6. Install the dependencies:
   ```
   npm install
   ```
7. Start the backend:
   ```
   node --env-file=.env server.js
   ```
   The terminal should print `Connected to MongoDB Atlas` and `API running at http://localhost:3000`.
8. Open **http://localhost:3000** in the browser. The backend serves the `client/` folder, so use this address (opening `client/index.html` from the disk does not work, because the client calls the API with relative URLs).
