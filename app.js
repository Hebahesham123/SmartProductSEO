const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const openaiPrompt = (title, tags) => `
Write a compelling, SEO-optimized product description for:
Title: ${title}
Tags: ${tags}
Make it persuasive, 80–100 words long using high-search keywords.
`;

const generateDescription = async (title, tags) => {
  const response = await axios.post('https://api.openai.com/v1/completions', {
    model: "text-davinci-003",
    prompt: openaiPrompt(title, tags),
    max_tokens: 200,
    temperature: 0.7
  }, {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    }
  });
  return response.data.choices[0].text.trim();
};

const updateProduct = async (id, description) => {
  const url = `https://${process.env.SHOPIFY_STORE}/admin/api/2023-10/products/${id}.json`;
  await axios.put(url, {
    product: {
      id,
      body_html: description
    }
  }, {
    headers: {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    }
  });
};

app.post('/generate-descriptions', async (req, res) => {
  const products = req.body.products; // [{ id, title, tags }]
  for (const product of products) {
    const { id, title, tags } = product;
    const description = await generateDescription(title, tags);
    await updateProduct(id, description);
  }
  res.send('Descriptions updated successfully!');
});

app.get('/', (req, res) => {
  res.send('AI Shopify Description App is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));