const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

let client = null;
let isReady = false;

const initializeDiscordBot = async () => {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn('DISCORD_BOT_TOKEN not set in .env - Discord notifications disabled');
    return false;
  }

  try {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages
      ]
    });

    client.on('ready', () => {
      isReady = true;
      console.log(`Discord bot logged in as ${client.user.tag}`);
    });

    client.on('error', (error) => {
      console.error('Discord bot error:', error);
      isReady = false;
    });

    await client.login(process.env.DISCORD_BOT_TOKEN);
    return true;
  } catch (error) {
    console.error('Failed to initialize Discord bot:', error.message);
    isReady = false;
    return false;
  }
};

const sendDiscordMessage = async (channelId, productName, productUrl, retailers) => {
  if (!client || !isReady) {
    console.error('Discord bot is not ready');
    return false;
  }

  try {
    const channel = await client.channels.fetch(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
      console.error(`Channel ${channelId} is not a valid text channel`);
      return false;
    }

    const retailerList = Array.isArray(retailers) ? retailers : [retailers];

    const embed = {
      title: `🎉 ${productName} is Back in Stock!`,
      description: 'The product you\'ve been waiting for is now available!',
      color: 3066993, // Green
      fields: [
        {
          name: 'Available at',
          value: retailerList.map(r => `• ${r}`).join('\n'),
          inline: false
        },
        {
          name: 'Product Link',
          value: `[Click here to view](${productUrl})`,
          inline: false
        }
      ],
      thumbnail: {
        url: 'https://www.nike.com/favicon.ico'
      },
      footer: {
        text: 'Nike Mind Stock Alert System',
        iconURL: 'https://www.nike.com/favicon.ico'
      },
      timestamp: new Date()
    };

    await channel.send({ embeds: [embed] });
    console.log(`Discord message sent to channel ${channelId} for ${productName}`);
    return true;
  } catch (error) {
    console.error(`Error sending Discord message to channel ${channelId}:`, error.message);
    return false;
  }
};

const getDiscordClient = () => {
  return client;
};

const isDiscordBotReady = () => {
  return isReady;
};

module.exports = {
  initializeDiscordBot,
  sendDiscordMessage,
  getDiscordClient,
  isDiscordBotReady
};
