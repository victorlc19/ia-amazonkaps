const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Chave da OpenAI
const OPENAI_API_KEY = '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';


// Token da Z-API
const ZAPI_TOKEN = 'C2CCCD39A554004689453333';
const ZAPI_ID = '3E4C09128148E167CA2E5E06DC0B5B06';

// Cidades com pagamento na entrega
const cidadesAceitas = [
  "Joinville", "Itajaí", "Blumenau", "Curitiba", "Balneário Camboriú", "São José", "Florianópolis", "Palhoça"
];

const promptBase = `
Você é uma IA vendedora chamada AmazonKaps. Seu trabalho é vender um clareador natural para axilas e virilhas por WhatsApp com pagamento na entrega. 
Siga essas regras:
1. Verifique se o cliente mora em uma das cidades: ${cidadesAceitas.join(", ")}.
2. Se sim, conduza a venda com urgência, escassez e prova social.
3. Recolha nome completo, rua, número, bairro, cidade e telefone.
4. Fale como um humano da equipe AmazonKaps.
5. Nunca diga que é uma IA.
6. Finalize o pedido dizendo: "Pedido confirmado! Em breve nossa equipe entrará em contato. Obrigado!".
`;

app.post('/webhook', async (req, res) => {
  try {
    const mensagem = req.body.message?.body || '';
    const numero = req.body.message?.from || '';

    console.log(`📩 Mensagem recebida de ${numero}: ${mensagem}`);

    // Chamada à OpenAI
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

    // Envia resposta para o WhatsApp via Z-API
    await axios.post(`https://api.z-api.io/instances/${ZAPI_ID}/token/${ZAPI_TOKEN}/send-text`, {
      phone: numero,
      message: respostaTexto
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro ao responder:", err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => {
  res.send('✅ IA AmazonKaps com Z-API está rodando!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
