
// ============= CONFIGURATION ============= 
// 1. Load the libraries we installed with npm
const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");

// 2. Create the API application
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "client"))); // serve the client files from the client folder
const PORT = process.env.PORT || 3000;

// 3. Prepare the connection to MongoDB Atlas
if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Start with: node --env-file=.env server.js");
    process.exit(1);
}
const client = new MongoClient(process.env.MONGODB_URI);
let db;


// ============= HOME ============= 
// Test endpoint: is the API running?
app.get("/", (req, res) => {
    res.send("My API is running!");
});


// ================== [GET] ==================
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


// GET /beers/search?query=...: search beers with the text index
app.get("/beers/search", async (req, res) => {
    try {
        const query = req.query.query;
        if (typeof query !== "string" || query.trim() === "") {
            return res.status(400).json({ error: "Give a search term, for example /beers/search?query=ipa" });
        }
        const beers = await db.collection("beers")
            .find({ $text: { $search: query } }, { projection: { score: { $meta: "textScore" } } })
            .sort({ score: { $meta: "textScore" } })
            .toArray();
        res.status(200).json(beers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not search the beers" });
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


// ================== [POST] ==================
// POST /beers: add a new beer
app.post("/beers", async (req, res) => {
    try {
        const body = req.body || {};

        // A: validate the body
        const errors = [];
        if (!Number.isInteger(body.beer_id)) {
            errors.push("beer_id is required and must be a whole number");
        }
        if (typeof body.name !== "string" || body.name.trim() === "") {
            errors.push("name is required and must be text");
        }
        if (!Number.isInteger(body.plato) || body.plato < 0 || body.plato > 40) {
            errors.push("plato is required and must be a whole number from 0 to 40");
        }
        if (typeof body.style !== "string" || body.style.trim() === "") {
            errors.push("style is required and must be text");
        }
        if (typeof body.abv !== "number" || body.abv < 0 || body.abv > 100) {
            errors.push("abv is required and must be a number from 0 to 100");
        }
        if (!Number.isInteger(body.brewery_id)) {
            errors.push("brewery_id is required and must be a whole number");
        }
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }

        // B: no duplicate, brewery must exist, build the document
        const existing = await db.collection("beers").findOne({ beer_id: body.beer_id });
        if (existing) {
            return res.status(409).json({ error: `Beer ${body.beer_id} already exists` });
        }
        const brewery = await db.collection("breweries").findOne({ brewery_id: body.brewery_id });
        if (!brewery) {
            return res.status(400).json({ errors: [`brewery_id ${body.brewery_id} does not exist`] });
        }

        // C: build the new beer document
        const newBeer = {
            beer_id: body.beer_id,
            name: body.name,
            plato: body.plato,
            style: body.style,
            abv: body.abv,
            description: body.description || "",
            brewery_id: body.brewery_id
        };

        // D: insert it and send it back
        await db.collection("beers").insertOne(newBeer);
        res.status(201).json(newBeer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not add the beer" });
    }
});


// ================== [PUT] ==================
// PUT /beers/:id: change an existing beer
app.put("/beers/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Beer ID must be a whole number" });
        }
        const body = req.body || {};

        // A: check only the fields the client sent
        const errors = [];
        if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim() === "")) {
            errors.push("name must be text and not empty");
        }
        if (body.style !== undefined && (typeof body.style !== "string" || body.style.trim() === "")) {
            errors.push("style must be text and not empty");
        }
        if (body.plato !== undefined && (!Number.isInteger(body.plato) || body.plato < 0 || body.plato > 40)) {
            errors.push("plato must be a whole number from 0 to 40");
        }
        if (body.abv !== undefined && (typeof body.abv !== "number" || body.abv < 0 || body.abv > 100)) {
            errors.push("abv must be a number from 0 to 100");
        }
        if (body.description !== undefined && typeof body.description !== "string") {
            errors.push("description must be text");
        }
        if (body.brewery_id !== undefined && !Number.isInteger(body.brewery_id)) {
            errors.push("brewery_id must be a whole number");
        }
        if (errors.length > 0) {
            return res.status(400).json({ errors: errors });
        }

        // B: collect the allowed changes (beer_id is never changed)
        const allowed = ["name", "plato", "style", "abv", "description", "brewery_id"];
        const changes = {};
        for (const field of allowed) {
            if (body[field] !== undefined) {
                changes[field] = body[field];
            }
        }
        if (Object.keys(changes).length === 0) {
            return res.status(400).json({ error: "Send at least one field to change: " + allowed.join(", ") });
        }
        if (changes.brewery_id !== undefined) {
            const brewery = await db.collection("breweries").findOne({ brewery_id: changes.brewery_id });
            if (!brewery) {
                return res.status(400).json({ errors: [`brewery_id ${changes.brewery_id} does not exist`] });
            }
        }

        // C: update, then send the beer back as it is now
        const result = await db.collection("beers").updateOne({ beer_id: id }, { $set: changes });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: `Beer ${id} not found` });
        }
        const beer = await db.collection("beers").findOne({ beer_id: id });
        res.status(200).json(beer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not change the beer" });
    }
});


// ================== [DELETE] ==================
// DELETE /beers/:id: delete one beer
app.delete("/beers/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Beer ID must be a whole number" });
        }
        const result = await db.collection("beers").deleteOne({ beer_id: id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: `Beer ${id} not found` });
        }
        res.status(200).json({ message: `Beer ${id} deleted` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not delete the beer" });
    }
});


// ============= START THE API =============
// Connect to Atlas first, then start the API
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