const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_ID = process.env.ZAPI_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(bodyParser.json());

const cidadesPermitidas = [
  'Arujá', 'Barueri', 'Carapicuíba', 'Cotia', 'Diadema', 'Embu das Artes', 'Ferraz de Vasconcelos', 'Guarulhos', 'Itapevi', 'Itaquaquecetuba',
  'Jandira', 'Mauá', 'Mogi das Cruzes', 'Osasco', 'Poá', 'Santo André', 'São Bernardo do Campo', 'São Paulo', 'Suzano', 'Taboão da Serra',
  'Caieiras', 'Cajamar', 'Campo Limpo Paulista', 'Francisco Morato', 'Franco da Rocha', 'Jundiaí', 'Mairiporã', 'Belo Horizonte', 'Ibirité',
  'Sabará', 'Santa Luzia', 'Confins', 'Betim', 'Contagem', 'Aparecida de Goiânia', 'Goiânia', 'Trindade', 'Senador Canedo', 'Goianira',
  'Anápolis', 'Aragoiânia', 'Bonfinópolis', 'Brazabrantes', 'Caldazinha', 'Caturaí', 'Goianápolis', 'Guapó', 'Inhumas', 'Nerópolis',
  'Nova Veneza', 'Santo Antônio de Goiás', 'Terezópolis de Goiás', 'Hidrolândia', 'Almirante Tamandaré', 'Araucária', 'Colombo',
  'Curitiba', 'Fazenda Rio Grande', 'Pinhais', 'Piraquara', 'São José dos Pinhais', 'Manaus', 'Duque de Caxias', 'Nilópolis', 'Nova Iguaçu',
  'Rio de Janeiro', 'São João de Meriti', 'Niterói', 'São Gonçalo', 'Mesquita', 'Queimados', 'Belford Roxo', 'Salvador', 'Lauro de Freitas',
  'Monte Mor', 'Valinhos', 'Vinhedo', 'Americana', 'Campinas', 'Hortolândia', 'Nova Odessa', 'Sumaré', "Santa Bárbara D'Oeste", 'Paulínia',
  'Caucaia', 'Eusébio', 'Fortaleza', 'Itaitinga', 'Maracanaú', 'Maranguape', 'Pacatuba', 'Horizonte', 'Pacajus', 'Pindoretama', 'Teresina',
  'Timon', 'Altos', 'Demerval Lobão', 'Cariacica', 'Serra', 'Vila Velha', 'Vitória', 'Viana', 'Alvorada', 'Porto Alegre', 'Cachoeirinha',
  'Canoas', 'Eldorado do Sul', 'Esteio', 'São Leopoldo', 'Sapucaia do Sul', 'Gravataí', 'Guaíba', 'Novo Hamburgo', 'Campo Bom',
  'Estância Velha', 'Sapiranga', 'Viamão', 'Parnamirim', 'Extremoz', 'Macaíba', 'Natal', 'São Gonçalo do Amarante', 'Raposa',
  'São José de Ribamar', 'São Luis', 'Paço do Lumiar', 'João Pessoa', 'Ananindeua', 'Belém', 'Marituba', 'Balneário Camboriú',
  'Barra Velha', 'Camboriú', 'Ilhota', 'Itajaí', 'Itapema', 'Navegantes', 'Penha', 'Balneário Piçarras', 'Campo Grande'
];

// Função para normalizar texto
function normalizar(txt) {
  return txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Webhook de entrada
app.post('/webhook', async (req, res) => {
  const { message, sender } = req.body;
  if (!message) return res.sendStatus(200);

  const texto = message.toLowerCase();
  const cidadeEncontrada = cidadesPermitidas.find(cidade =>
    normalizar(texto).includes(normalizar(cidade))
  );

  if (!cidadeEncontrada) {
    await enviarMensagem(sender, `Atualmente trabalhamos com pagamento na entrega apenas para algumas cidades. Por favor, envie o nome da sua cidade para verificarmos a disponibilidade.`);
    return res.sendStatus(200);
  }

  const prompt = `Você é um vendedor persuasivo. O cliente quer comprar o produto AmazonKaps com pagamento na entrega. Ele é de ${cidadeEncontrada}. Conduza a conversa com técnicas de gatilhos mentais e coleta de dados para envio (nome, endereço completo e ponto de referência). Seja direto, rápido e vendedor.`;

  try {
    const resposta = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt },
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
    console.error(e.response?.data || e);
    await enviarMensagem(sender, 'Ocorreu um erro ao processar sua mensagem. Tente novamente.');
  }

  res.sendStatus(200);
});

// Enviar mensagem via Z-API
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
