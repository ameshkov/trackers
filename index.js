const express = require('express');
const fs = require('fs');
const Database = require('better-sqlite3');
const LISTEN_PORT = 8080;
const SQL_SELECT_TRACKER =
    `SELECT t.id AS "trackerId",
	   t.name AS "trackerName",
	   t.website_url AS "trackerWebsiteUrl",
	   ct.name AS "category",
	   co.name AS "companyName",
	   co.description AS "companyDescription",
	   co.privacy_url AS "companyPrivacyPolicyUrl",
	   co.website_url AS "companyWebsiteUrl"
  FROM tracker_domains td
  JOIN trackers t
    ON td.tracker = t.id
  JOIN categories ct
    ON t.category_id = ct.id
  JOIN companies co
    ON t.company_id = co.id
  JOIN (SELECT ? AS domain) params
 WHERE td.domain = params.domain
    OR params.domain LIKE '%.' || td.domain;`;
const SQL_SELECT_TRACKER_DOMAINS = "SELECT domain FROM tracker_domains WHERE tracker = ?";

// Create the DB schema
console.log('Initializing DB schema');

const dbSql = fs.readFileSync('db.sql').toString();
var db = new Database('trackers.db', { memory: true });
db.exec(dbSql);
console.log('DB schema has been initialized');

// Initialize Express
const app = express();
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/tracker.json', function (req, res) {
    let domain = req.query.domain;
    let row = db.prepare(SQL_SELECT_TRACKER).get(domain) || {};
    if (row.trackerId) {
        row.domains = db.prepare(SQL_SELECT_TRACKER_DOMAINS)
            .all(row.trackerId)
            .map(function (domainRow) {
                return domainRow.domain
            });
    }

    res.send(JSON.stringify(row, 0, 4));
});

// Start the web server
app.listen(LISTEN_PORT, () => console.log('Server is listening on %d', LISTEN_PORT));