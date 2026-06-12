import { Hono } from 'hono';
import { getRandomQuote } from '../db.js';

const quotes = new Hono();

// GET /api/quotes/random
quotes.get('/random', (c) => {
  const quote = getRandomQuote();
  return c.json({ code: 0, data: { text: quote.text, author: quote.author }, msg: 'success' });
});

export default quotes;
