const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config({ path: "./config.env" });
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(require("./routes/record.js"));
const dbo = require("./db/conn");

app.use((req, res, next) => {
  console.log('Incoming Request:', req.method, req.url);
  next();
});

dbo.connectToServer(async function (err) {
  if (err) {
    process.exit(1);
  } else {
    const db = dbo.getDb();
    const collectionCount = await db.collection("products").countDocuments();

    // przy łączeniu się z serwerem dodaję produkty do bazy tylko wtedy, kiedy jest ona pusta
    if (collectionCount === 0) {
      const productsData = [
        { name: "Sword", price: 145, description: "Found on the door step, in a niche state", quantity: 1, unit: "pcs" },
        { name: "Hobgoblin", price: 90, description: "Were running in the basement, I need to get rid of 'em", quantity: 81, unit: "pcs" },
        { name: "SOLID Rules", price: 90, description: "Verily, all doth ken, yet none doth assume.", quantity: 1, unit: "pcs" },
        { name: "Ronin", price: 43, description: "Dunno, tought of this movie while doing it", quantity: 47, unit: "pcs" },
        { name: "Js kolos from sem2", price: 1000, description: "Treasure worth any price", quantity: 17, unit: "pcs" },
        { name: "Paint", price: 10, description: "To color up your grey world", quantity: 17, unit: "gallon" }
      ];

      db.collection("products").insertMany(productsData, function (err, res) {
        if (err) {
          console.error("Error inserting documents:", err);
          process.exit(1);
        } else {
          console.log("Documents inserted:", res.insertedCount);
        }
      });
    }

    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });

    process.on('SIGINT', () => {
      dbo.closeConnection();
      process.exit(0);
    });

  }
});
