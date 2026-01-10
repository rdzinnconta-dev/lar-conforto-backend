import express from 'express';
import QRCode from 'qrcode';
import { PIX } from 'gpix';  // ou import gpix from 'gpix' dependendo da versão

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ← Coloque suas informações reais aqui ↓
const CONFIG_PIX = {
  chave: '43999229986',       // ← SUA CHAVE PIX REAL
  nome: 'Pod vibes 2026',        // Nome do recebedor
  cidade: 'São Paulo',                // Cidade
  identificador: 'podvibe'            // Identificador (txid curto)
};

app.post('/api/gerar-pix-qr', async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Carrinho vazio' });
    }

    // Calcula total em centavos (seu frontend já envia em centavos)
    const totalCentavos = items.reduce((sum, item) => {
      return sum + (Number(item.unit_price) * Number(item.quantity));
    }, 0);

    const valor = (totalCentavos / 100).toFixed(2);

    // Gera payload PIX estático
    const pix = PIX.static()
      .setKey(CONFIG_PIX.chave)
      .setAmount(valor)
      .setName(CONFIG_PIX.nome)
      .setCity(CONFIG_PIX.cidade)
      .setIdentifier(CONFIG_PIX.identificador);

    const payload = pix.getBRCode();       // string "00020126..." completa

    // Gera imagem QR em base64
    const qrCodeBase64 = await QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    });

    res.json({
      success: true,
      valor: Number(valor),
      qrCodeBase64,
      payload
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Erro ao gerar PIX' });
  }
});

// Rota de teste
app.get('/health', (req, res) => res.json({ status: 'ok', api: 'Pix Vibe 2026' }));

app.listen(PORT, () => {
  console.log(`API PIX rodando → porta ${PORT}`);
});