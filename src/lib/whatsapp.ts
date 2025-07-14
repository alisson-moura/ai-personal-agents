/** biome-ignore-all lint/suspicious/noConsole: logs vão ajudar a identificar o comportamento do client */

import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { executeAlfredAgent } from '../agents/alfred';

export const client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
  authStrategy: new LocalAuth({}),
});

client.once('ready', () => {
  console.info('Client is ready!');
});

client.on('auth_failure', () => {
  console.info('Failed to auth!');
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('message_create', (message) => {
  if (message.from === message.to && !message.body.includes('[Alfred]:')) {
    executeAlfredAgent(message.body)
      .then((response) => message.reply(response))
      .catch(() => message.reply('Erro ao executar o agente de ia.'));
  }
});
