require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { QrCodePix } = require('qrcode-pix');
const QRCode = require('qrcode');

const app = express();  // ← CRIE O APP PRIMEIRO AQUI!

app.use(cors({ origin: '*' }));  // permite o frontend acessar
app.use(express.json());

const port = process.env.PORT || 3001;

// Rota de teste (opcional, para confirmar que o servidor está vivo)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend rodando!' });
});

// Rota PIX (depois do app!)
app.post('/api/gerar-pix-qr', async (req, res) => {
  try {
    const { items } = req.body;

    console.log('Itens recebidos:', items);  // debug: veja no terminal

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Itens do carrinho obrigatórios' });
    }

    const totalCentavos = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const totalReais = totalCentavos / 100;

    if (totalReais <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const txid = `POD${Date.now().toString().slice(-8)}`;

    const qrCodePix = QrCodePix({
      version: '01',
      key: process.env.PIX_KEY,
      name: process.env.PIX_NAME,
      city: process.env.PIX_CITY,
      transactionId: txid,
      message: `Pagamento Pedido ${txid}`,
      value: totalReais,
    });

    const payload = qrCodePix.payload();
    const base64Qr = await qrCodePix.base64();

    res.json({
      success: true,
      payload,
      qrCodeBase64: base64Qr,
      valor: totalReais,
      txid,
      message: `Pague exatamente R$ ${totalReais.toFixed(2).replace('.', ',')}`
    });

  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    res.status(500).json({
      error: 'Erro interno ao gerar PIX',
      details: error.message
    });
  }
});

// Inicia o servidor (sempre no final)
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});