# 🍺 Beer Catalog

Semester project for Advanced Database Systems (UTB FAI).
Backend for a beer catalog: Node.js + Express + MongoDB Atlas (official Node.js driver).

## 📝 Requirements

- Node.js 20.6 or newer (needed for `--env-file`)
- A MongoDB Atlas cluster with the database and both collections created
- Your current IP address allowed in Atlas (Network Access)

## 🛠️ Setup

1. Clone repository
   ```
   git clone https://github.com/Mikydosh/adb-project.git
   cd adb-project
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a file named `.env` in the project root (next to `server.js`):

   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/
   DB_NAME=<your database name>
   PORT=3000
   ```

   | Variable | Meaning |
   |---|---|
   | `MONGODB_URI` | Atlas connection string (Atlas → Connect → Drivers) |
   | `DB_NAME` | Name of the database that holds the collections |
   | `PORT` | Port the API listens on (optional, default 3000) |

   ⚠️ The `.env` file contains the database password. Never commit or share it.

4. In Atlas, open **Network Access** and add your current IP address.
   This must be repeated when working from a new network.

## ▶️ Run

```
node --env-file=.env server.js
```

The terminal should print `Connected to MongoDB Atlas` and
`API running at http://localhost:3000`.
Opening `http://localhost:3000/` in a browser shows `My API is running!`.

## 🛢 Database

Database: MongoDB Atlas, two collections linked by `brewery_id`.

**beers** (main collection)

| Field | Description |
|---|---|
| `beer_id` | Unique beer ID (used in the API URLs) |
| `name` | Beer name |
| `style` | Beer style |
| `abv` | Alcohol by volume (%) |
| `description` | Short description |
| `brewery_id` | Reference to `breweries.brewery_id` |

**breweries** (related collection)

| Field | Description |
|---|---|
| `brewery_id` | Unique brewery ID |
| `name` | Brewery name |
| `city` | City |
| `country` | Country |
| `founded_year` | Year the brewery was founded |

Relationship: `beers.brewery_id` → `breweries.brewery_id`

### Indexes

Text index on `beers`, used by the search endpoint:

```js
db.beers.createIndex({ name: "text", style: "text", description: "text" })
```

## 📡 API Endpoints

Base URL: `http://localhost:3000`

| Method | Endpoint | Description | Status |
|---|---|---|---|
| GET | `/beers` | All beers | ✅ Done |
| GET | `/beers/:id` | One beer by `beer_id` | ✅ Done |
| GET | `/breweries` | All breweries | ✅ Done |
| GET | `/breweries/:id` | One brewery by `brewery_id` | ✅ Done |
| GET | `/beers/search?query=` | Text search in beers | ✅ Done |
| POST | `/beers` | Add a new beer | ✅ Done |
| PUT | `/beers/:id` | Edit a beer | ✅ Done |
| DELETE | `/beers/:id` | Delete a beer | ✅ Done |

Status codes: `200` OK, `201` created, `400` invalid input, `404` not found, `409` duplicate `beer_id`, `500` server error.

### Text search

| | |
|---|---|
| Collection | `beers` |
| Indexed fields | `name`, `style`, `description` |
| Query | `{ $text: { $search: query } }`, sorted by `textScore` |
| Endpoint | `GET /beers/search?query=ipa` |

Search is case-insensitive. An empty `query` returns `400`; no match returns `200` with an empty list.

### Add a beer

`POST /beers` with a JSON body:

```json
{
  "beer_id": 31,
  "name": "Example Lager",
  "style": "Lager",
  "abv": 4.8,
  "description": "Optional text",
  "brewery_id": 1
}
```

Required: `beer_id` (whole number, unique), `name`, `style` (text), `abv` (number 0–100), `brewery_id` (existing brewery). `description` is optional.

### Edit a beer

`PUT /beers/:id` with a JSON body containing only the fields to change:

```json
{
  "abv": 5.2,
  "description": "New description"
}
```

Allowed fields: `name`, `style`, `abv`, `description`, `brewery_id` (must exist). `beer_id` cannot be changed. Returns the updated beer, `404` if the beer does not exist, `400` for invalid or empty input.

### Delete a beer

`DELETE /beers/:id` has no body. Returns `200` with a confirmation message, or `404` if the beer does not exist.
