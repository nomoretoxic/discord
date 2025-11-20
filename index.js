require('dotenv').config(); // Load variables from .env
const { Client, GatewayIntentBits } = require('discord.js');
const { status } = require('minecraft-server-util');

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SERVER_IP = process.env.SERVER_IP;
const SERVER_PORT = parseInt(process.env.SERVER_PORT) || 25565;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL) || 5000;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let previousPlayers = new Set();

async function checkPlayers() {
    try {
        const result = await status(SERVER_IP, SERVER_PORT);
        const currentPlayers = new Set(result.players.sample?.map(p => p.name) || []);

        const joined = [...currentPlayers].filter(x => !previousPlayers.has(x));
        const left = [...previousPlayers].filter(x => !currentPlayers.has(x));

        const channel = await client.channels.fetch(CHANNEL_ID);

        joined.forEach(player => channel.send(`✅ **${player} joined the server!**`));
        left.forEach(player => channel.send(`❌ **${player} left the server!**`));

        previousPlayers = currentPlayers;
    } catch (err) {
        console.log('Server offline or unreachable');
    }
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    checkPlayers();
    setInterval(checkPlayers, POLL_INTERVAL);
});

client.login(TOKEN);
