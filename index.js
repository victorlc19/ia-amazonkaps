require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ULTRAMSG_INSTANCE = 'instance135429';
const ULTRAMSG_TOKEN = 'upfkz3u8fm3m01ud';

const cidadesAceitas = [
  "Arujá", "Barueri", "Carapicuíba", "Cotia", "Diadema", "Embu das Artes", "Ferras de Vasconcelos",
  "Guarulhos", "Itapevi", "Itaquaquecetuba", "Jandira", "Mauá", "Magi das Cruzes", "Osasco", "Poá",
  "Santo André", "São Bernando do Campo", "São Paulo", "Suzano", "Taboão da Serra", "Caieiras", "Cajamar",
  "Campo Limpo Paulista", "Francisco Morato", "Franco da Rocha", "Jundiaí", "Mairiporã", "Belo Horizonte",
  "Ibirité", "Sabará", "Santa Luzia", "Confins", "Betim", "Contagem", "Aparecidad de Goiânia", "Goiânia",
  "Trindade", "Senador Canedo", "Goianira", "Anápolis", "Aragoiânia", "Bonfinópolis", "Brazabrantes",
  "Caldazinha", "Caturaí", "Goianápolis", "Guapó", "Inhumas", "Nerópolis", "Nova Veneza",
  "Santo Antônio de Goiás", "Terezópolis de Goiás", "Hidrolância", "Almirante tamandaré", "Araucária",
  "Colombo", "Curitiba", "Fazenda Rio Grande", "Pinhais", "Piraquara", "São José dos Pinhais", "Manaus",
  "Duque de Caxias", "Nilópolis", "Nova Iguaçu", "Rio de Janeiro", "São João de Mariti", "Niterói",
  "São Gonçalo", "Mesquita", "Queimados", "Belford Roxo", "Salvador", "Lauro de Freitas", "Monte Mor",
  "Valinhos", "Vinhedo", "Americana", "Campinas", "Hortolândia", "Nova Odessa", "Sumaré",
  "Santa Bárbara D'Oeste", "Paulínia", "Caucaia", "Eusébio", "Fortaleza", "Itaitinga", "Maracanaú",
  "Maranguape", "Pacatuba", "Horizonte", "Pacajus", "Pindoretama", "Teresina", "Timon", "Altos",
  "Demerval Lobão", "Cariacica", "Serra", "Vila Velha", "Vitória", "Viana", "Alvorada", "Porto Alegre",
  "Cachoeirinha", "Canoas", "Eldorado do Sul", "Esteio", "São Leopoldo", "Sapucaia do Sul", "Gravataí",
  "Guaíba", "Novo Hamburgo", "Campo bom", "Estância Velha", "Sapiranga", "Viamão", "Parnamirim",
  "Extremoz", "Macaíba", "Natal", "São Gonçalo do Amarante", "Raposa", "São José de Ribamar",
  "São Luis", "Paço do Lumiar", "João Pessoa", "Ananindeua", "Belém", "Marituba", "Balneário Camboriú",
  "Barra Velha", "Camboriú", "Ilhota", "Itajaí", "Itapema", "Navegantes", "Penha", "Balneário Piçarras",
  "Campo Grande"
];

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

    await axios.post(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`, {
      token: ULTRAMSG_TOKEN,
      to: numero,
      body: respostaTexto
    });

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
