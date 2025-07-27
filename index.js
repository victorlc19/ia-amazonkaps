require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ULTRAMSG_INSTANCE = process.env.ULTRAMSG_INSTANCE;
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;

const cidadesAceitas = [ /* (sua lista permanece igual) */ ];

const promptBase = `
Você é uma IA vendedora chamada AmazonKaps. Seu trabalho é vender um clareador natural para axilas e virilhas por WhatsApp com pagamento na entrega (COD).
Siga as instruções abaixo em todas as conversas:

1. Verifique se o cliente mora em uma das seguintes cidades: ${cidadesAceitas.join(", ")}.
2. Se a cidade não estiver na lista, diga com empatia que no momento só atendemos algumas regiões específicas com pagamento na entrega.
3. Se estiver na lista, inicie a venda com entusiasmo, usando gatilhos mentais como escassez, urgência, autoridade e prova social.
4. Recolha os seguintes dados de entrega: nome completo, rua, número, bairro, cidade e telefone.
5. Nunca diga que você é uma IA. Você é da equipe da AmazonKaps.
6. Ao final, confirme o pedido com: "✅ Pedido confirmado! Em breve nossa equipe entrará em contato para confirmar a entrega. Obrigado!"

Fale como se fosse um humano vendedor atencioso e direto ao ponto.
`;

app.post('/webhook', async (req, res) => {
  try {
    const mensagem = req.body?.body || '';
    const numero = req.body?.from || '';

    if (!mensagem || !numero) return res.sendStatus(400);

    console.log(`📩 Mensagem recebida de ${numero}: ${mensagem}`);

    const respostaIA = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: promptBase },
          { role: "user", content: mensagem }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const respostaTexto = respostaIA.data.choices[0].message.content;

    await axios.post(
      `https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`,
      {
        to: numero,
        body: respostaTexto,
        priority: "10"
      },
      {
        params: {
          token: ULTRAMSG_TOKEN
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Resposta enviada para ${numero}`);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Erro ao responder:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => {
  res.send('✅ IA AmazonKaps com UltraMsg está rodando!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
