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
   git clone https://github.com/Mikydosh/adb-api.git
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

   The `.env` file contains the database password. Do not commit or share it.

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
