/** biome-ignore-all lint/suspicious/noConsole: logs vão ajudar a identificar o comportamento do client */

import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';

export const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  authStrategy: new LocalAuth({}),
});

client.once('ready', () => {
  console.info('Client is ready!');
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('message_create', (message) => {
  if (message.body === '!ping') {
    // send back "pong" to the chat the message was sent in
    client.sendMessage(message.from, 'pong');
  }
});
