const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_ID = process.env.ZAPI_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(bodyParser.json());

const cidadesPermitidas = [ /* ... (sua lista completa de cifdades aqui) ... */ ];

function normalizar(txt) {
  return txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

app.post('/webhook', async (req, res) => {
  console.log('Recebido:', JSON.stringify(req.body)); // 👈 Isso vai mostrar nos logs da Render
  res.sendStatus(200);

  const { message, sender } = req.body;
  if (!message || !sender) return;

  const texto = message.toLowerCase();

  const cidadeEncontrada = cidadesPermitidas.find(cidade =>
    normalizar(texto).includes(normalizar(cidade))
  );

  const promptBase = cidadeEncontrada
    ? `Você é um vendedor persuasivo. O cliente quer comprar o produto AmazonKaps com pagamento na entrega. Ele é de ${cidadeEncontrada}. Conduza a conversa com técnicas de gatilhos mentais e coleta de dados para envio (nome, endereço completo e ponto de referência). Seja direto, rápido e vendedor.`
    : `Você é um vendedor persuasivo. O cliente quer comprar o produto AmazonKaps. Conduza a conversa com técnicas de gatilhos mentais e colete o nome da cidade para verificar se é atendida com pagamento na entrega. Seja direto e vendedor.`

  try {
    const resposta = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: promptBase },
        { role: 'user', content: texto }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const respostaIA = resposta.data.choices[0].message.content;
    await enviarMensagem(sender, respostaIA);
  } catch (e) {
    console.error('Erro na IA:', e.response?.data || e);
    await enviarMensagem(sender, 'Ocorreu um erro ao processar sua mensagem. Tente novamente.');
  }
});

async function enviarMensagem(numero, texto) {
  try {
    await axios.post(`https://api.z-api.io/instances/${ZAPI_ID}/token/${ZAPI_TOKEN}/send-text`, {
      phone: numero,
      message: texto
    });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err.response?.data || err);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
