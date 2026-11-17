// Vercel Serverless Function entry point
// Bridges Vercel serverless request handling to the Express application
const app = require('../server/server');

module.exports = app;

