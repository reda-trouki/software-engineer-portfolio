// Copies your local content (data/db.json) into data/seed.json, the content a fresh
// Netlify deployment starts with. Messages and the PIN hash are NOT copied.
// Usage: npm run seed:from-db
import { readFileSync, writeFileSync } from 'node:fs';

const db = JSON.parse(readFileSync('data/db.json', 'utf8'));
db.messages = [];
db.settings = {};
if (String(db.profile?.photoUrl || '').startsWith('/media/')) {
  console.log('Note: your photo is an upload (/media/...). Uploads are not part of the seed:');
  console.log('re-upload it in Admin > Profile after deploying, or put it in public/me.jpg and use /me.jpg.');
  db.profile.photoUrl = '';
}
writeFileSync('data/seed.json', JSON.stringify(db, null, 2));
console.log('data/seed.json updated from data/db.json');
