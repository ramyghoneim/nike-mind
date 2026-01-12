const axios = require('axios');
const crypto = require('crypto');
const { isDiscordBotReady } = require('./discordBot');
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

let monitoringActive = false;
let previousHash = null;
let previousContent = null;
const CHECK_INTERVAL = process.env.WEBSITE_CHECK_INTERVAL_MS || 5000; // 5 seconds default
const WEBSITE_URL = 'https://buynyctoken.com/';

const generateContentHash = (content) => {
  return crypto.createHash('md5').update(content).digest('hex');
};

const fetchWebsiteContent = async () => {
  try {
    const response = await axios.get(WEBSITE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching website:', error.message);
    return null;
  }
};

const sendWebsiteChangeNotification = async (channelId, url, changeDetails) => {
  const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
  const discordBot = require('./discordBot');

  if (!discordBot.isDiscordBotReady()) {
    console.error('Discord bot is not ready');
    return false;
  }

  try {
    const client = discordBot.getDiscordClient();
    const channel = await client.channels.fetch(channelId);

    if (!channel || channel.type !== ChannelType.GuildText) {
      console.error(`Channel ${channelId} is not a valid text channel`);
      return false;
    }

    const embed = {
      title: '🚨 Website Change Detected!',
      description: `Changes have been detected on the monitored website.`,
      color: 15844367, // Gold/Orange color
      fields: [
        {
          name: 'Website',
          value: url,
          inline: false
        },
        {
          name: 'Change Type',
          value: changeDetails || 'Content modification detected',
          inline: false
        },
        {
          name: 'Detected At',
          value: new Date().toLocaleString(),
          inline: false
        }
      ],
      footer: {
        text: 'Website Change Monitor',
      },
      timestamp: new Date()
    };

    // Build message with optional user mention
    const messageContent = process.env.DISCORD_USER_ID
      ? `<@${process.env.DISCORD_USER_ID}> Website change alert!`
      : '';

    await channel.send({
      content: messageContent,
      embeds: [embed]
    });
    console.log(`Discord notification sent for website change`);
    return true;
  } catch (error) {
    console.error(`Error sending Discord notification:`, error.message);
    return false;
  }
};

const checkForChanges = async () => {
  console.log(`[${new Date().toISOString()}] Checking ${WEBSITE_URL} for changes...`);

  const content = await fetchWebsiteContent();

  if (!content) {
    console.log('Failed to fetch website content');
    return;
  }

  const currentHash = generateContentHash(content);

  if (previousHash === null) {
    // First run - store initial state
    previousHash = currentHash;
    previousContent = content;
    console.log(`Initial content hash stored: ${currentHash}`);
    return;
  }

  if (currentHash !== previousHash) {
    console.log(`🚨 CHANGE DETECTED on ${WEBSITE_URL}!`);
    console.log(`Previous hash: ${previousHash}`);
    console.log(`New hash: ${currentHash}`);

    // Send Discord notification
    const channelId = process.env.DISCORD_CHANNEL_ID;
    if (channelId && isDiscordBotReady()) {
      await sendWebsiteChangeNotification(
        channelId,
        WEBSITE_URL,
        'Website content has changed - check immediately!'
      );
    } else if (!channelId) {
      console.warn('DISCORD_CHANNEL_ID not configured in .env');
    } else {
      console.warn('Discord bot not ready yet');
    }

    // Update stored hash
    previousHash = currentHash;
    previousContent = content;
  } else {
    console.log(`No changes detected (hash: ${currentHash.substring(0, 8)}...)`);
  }
};

const startWebsiteMonitoring = () => {
  if (monitoringActive) {
    console.log('Website monitoring already active');
    return;
  }

  monitoringActive = true;
  console.log(`Website monitoring started for ${WEBSITE_URL} (interval: ${CHECK_INTERVAL}ms)`);

  // Run initial check
  checkForChanges();

  // Schedule periodic checks
  setInterval(checkForChanges, CHECK_INTERVAL);
};

const stopWebsiteMonitoring = () => {
  monitoringActive = false;
  console.log('Website monitoring stopped');
};

module.exports = {
  startWebsiteMonitoring,
  stopWebsiteMonitoring,
  checkForChanges
};
