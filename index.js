import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { status } from 'minecraft-server-util';

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
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

        // Detect joins and leaves
        const joined = [...currentPlayers].filter(x => !previousPlayers.has(x));
        const left = [...previousPlayers].filter(x => !currentPlayers.has(x));

        const guild = await client.guilds.fetch(GUILD_ID);
        const channel = await guild.channels.fetch(CHANNEL_ID);

        // Send join messages with skin head
        joined.forEach(player => {
            const uuid = result.players.sample.find(p => p.name === player)?.id;

            const embed = new EmbedBuilder()
                .setTitle(`🟢 ${player} joined the server!`)
                .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=64&overlay`)
                .setColor("Green");

            channel.send({ embeds: [embed] });
        });

        // Send leave messages with skin head
        left.forEach(player => {
            const uuid = result.players.sample.find(p => p.name === player)?.id;

            const embed = new EmbedBuilder()
                .setTitle(`🔴 ${player} left the server!`)
                .setThumbnail(`https://crafatar.com/avatars/${uuid}?size=64&overlay`)
                .setColor("Red");

            channel.send({ embeds: [embed] });
        });

        previousPlayers = currentPlayers;

    } catch (err) {
        console.log("Server offline or unreachable");
    }
}

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    checkPlayers();
    setInterval(checkPlayers, POLL_INTERVAL);
});

client.login(TOKEN);
