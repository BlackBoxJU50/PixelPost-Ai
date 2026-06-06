import 'dotenv/config';
import Groq from 'groq-sdk';

async function listModels() {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const models = await client.models.list();
    console.log(models.data.map(m => m.id).join('\n'));
  } catch (e) {
    console.error(e);
  }
}
listModels();
