const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// 🔐 SUA CHAVE DA OPENAI
const OPENAI_API_KEY = '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';

// Lista das cidades que aceita pagamento na entrega
const cidadesAceitas = [
  "Joinville", "Itajaí", "Blumenau", "Curitiba", "Balneário Camboriú", "São José", "Florianópolis", "Palhoça"
];

const promptBase = `
Você é uma IA vendedora chamada AmazonKaps. Seu trabalho é vender um clareador de axilas e virilhas por WhatsApp com pagamento na entrega. 
Siga essas regras:
1. Valide se o cliente mora em uma das cidades: ${cidadesAceitas.join(", ")}.
2. Use gatilhos mentais como escassez, prova social e urgência.
3. Recolha nome completo, telefone, rua, número, bairro, cidade.
4. Seja envolvente e responda como humano vendedor.
5. Nunca diga que é IA. Diga que é da equipe da AmazonKaps.
6. Encerre o pedido com: "Pedido confirmado! Em breve nossa equipe entrará em contato para confirmar a entrega. Obrigado!"

A conversa até agora:
`;

app.post('/webhook', async (req, res) => {
  const mensagem = req.body.message.text;
  const numero = req.body.message.from;

  console.log('Mensagem recebida:', mensagem);

  try {
    const respostaIA = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o",
      messages: [
        { role: "system", content: promptBase },
        { role: "user", content: mensagem }
      ],
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const respostaTexto = respostaIA.data.choices[0].message.content;

    // Enviar resposta para o número via WATI
    await axios.post('https://app.wati.io/api/v1/sendSessionMessage', {
      phone: numero,
      messageText: respostaTexto
    }, {
      headers: {
        'Authorization': 'Bearer SUA_WATI_API_KEY',
        'Content-Type': 'application/json'
      }
    });

    res.sendStatus(200);
  } catch (err) {
    console.error('Erro ao processar mensagem:', err.response?.data || err.message);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => {
  res.send('Servidor da IA AmazonKaps rodando ✅');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
