
// ============= CONFIGURATION ============= 
// 1. Load the libraries we installed with npm
const express = require("express");
const { MongoClient } = require("mongodb");

// 2. Create the API application
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Prepare the connection to MongoDB Atlas
if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Start with: node --env-file=.env server.js");
    process.exit(1);
}
const client = new MongoClient(process.env.MONGODB_URI);
let db;


// ============= ENDPOINTS ============= 
// Test endpoint: is the API running?
app.get("/", (req, res) => {
    res.send("My API is running!");
});

// --------- BEERS ---------
// GET /beers: return all documents from the beers collection
app.get("/beers", async (req, res) => {
    try {
        const beers = await db.collection("beers").find().toArray();
        res.status(200).json(beers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not read beers from the database" });
    }
});

// GET /beers/:id: return ONE beer by its beer_id
app.get("/beers/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Beer ID must be a whole number" });
        }
        const beer = await db.collection("beers").findOne({ beer_id: id });
        if (!beer) {
            return res.status(404).json({ error: `Beer ${id} not found` });
        }
        res.status(200).json(beer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not read the beer from the database" });
    }
});


// --------- BREWERIES ---------
// GET /breweries: return all documents from the breweries collection
app.get("/breweries", async (req, res) => {
    try {
        const breweries = await db.collection("breweries").find().toArray();
        res.status(200).json(breweries);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not read breweries from the database" });
    }
});

// GET /breweries/:id: return ONE brewery by its brewery_id
app.get("/breweries/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Brewery ID must be a whole number" });
        }
        const brewery = await db.collection("breweries").findOne({ brewery_id: id });
        if (!brewery) {
            return res.status(404).json({ error: `Brewery ${id} not found` });
        }
        res.status(200).json(brewery);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not read the brewery from the database" });
    }
});



// ============= START THE API =============
// 6. Connect to Atlas first, then start the API
async function start() {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("Connected to MongoDB Atlas");
    app.listen(PORT, (error) => {
        if (error) {
            console.error("Could not start the API:", error.message);
            process.exit(1);
        }
        console.log(`API running at http://localhost:${PORT}`);
    });
}
start().catch((error) => {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
});