const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

let nanoid;
(async () => {
  const nanoidModule = await import('nanoid');
  nanoid = nanoidModule.nanoid;
})();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({ extended: false }));

const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the in-memory SQLite database.');
});

db.run('CREATE TABLE url_mapping (id TEXT PRIMARY KEY, url TEXT NOT NULL)');

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/shorten', (req, res) => {
  const { url, short_id } = req.body;

  if (short_id) {
    db.get('SELECT id FROM url_mapping WHERE id = ?', [short_id], (err, row) => {
      if (err) {
        return console.error(err.message);
      }

      if (row) {
        res.status(400).send('Error: Custom short ID is already taken.');
      } else {
        db.run('INSERT INTO url_mapping (id, url) VALUES (?, ?)', [short_id, url], (err) => {
          if (err) {
            return console.error(err.message);
          }
          res.send(`Shortened URL: http://localhost:3000/${short_id}`);
        });
      }
    });
  } else {
    const id = nanoid(6);
    db.run('INSERT INTO url_mapping (id, url) VALUES (?, ?)', [id, url], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.send(`Shortened URL: http://localhost:3000/${id}`);
    });
  }
});

app.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT url FROM url_mapping WHERE id = ?', [id], (err, row) => {
    if (err) {
      return console.error(err.message);
    }

    if (row) {
      res.redirect(row.url);
    } else {
      res.status(404).render("error", { message: "Error: Short URL does not exist.", error: { status: 404 }})
    };
});

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});

module.exports = {
  app
}