require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DAIP Ingestion Service online across context target port: ${PORT}`);
});