# Nike Mind Stock Alerts

A real-time stock monitoring and alert system for Nike products. Get notified instantly when the Nike Mind 001 and other Nike products are back in stock at major retailers.

## Features

- 🔄 **Real-time Stock Monitoring** - Automatically checks stock across multiple retailers every 5 minutes
- 📧 **Email Alerts** - Get notified immediately when products are back in stock
- 💬 **Discord Notifications** - Post alerts directly to your Discord channel
- 🛒 **Multi-Retailer Support** - Monitors Nike, Foot Patrol, JD Sports, Foot Locker, and SNKRS
- 📊 **Stock History** - Track stock patterns and availability over time
- 🌐 **REST API** - Create and manage alerts programmatically
- ⚡ **CLI Tool** - Quick command-line stock checks

## Supported Retailers

- Nike (nike.com)
- SNKRS
- Foot Patrol (footpatrol.com)
- JD Sports (jdsports.co.uk)
- Foot Locker (footlocker.com)

## Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd nike-mind
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from the example:
```bash
cp .env.example .env
```

4. **Set up your Discord Bot**:
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click "New Application" → name it "Nike Stock Alerts"
   - Go to "Bot" tab → Click "Add Bot"
   - Copy the TOKEN and add to `.env`:
     ```
     DISCORD_BOT_TOKEN=your-token-here
     ```
   - Enable "Message Content Intent" under PRIVILEGED GATEWAY INTENTS
   - Go to "OAuth2" → "URL Generator"
   - Select `bot` under scopes
   - Select `Send Messages` and `Embed Links` under permissions
   - Open the generated URL to add bot to your server
   - Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
   - Right-click your Discord channel → Copy Channel ID
   - Add to `.env`:
     ```
     DISCORD_CHANNEL_ID=your-channel-id-here
     ```

## Quick Start

That's it! Just start the server:

```bash
npm start
```

The bot will:
1. Connect to Discord
2. Start monitoring Nike Mind 001 every 5 minutes
3. Post to your configured channel when it's back in stock

### Check Stock Manually

```bash
npm run check-stock HQ4307-002 https://www.nike.com/t/mind-001-mens-pregame-mules-Ky4BSP5I/HQ4307-002
```

## Optional: Manual Stock Check

Check stock manually without waiting for the 5-minute interval:

```bash
npm run check-stock HQ4307-002 https://www.nike.com/t/mind-001-mens-pregame-mules-Ky4BSP5I/HQ4307-002
```

## Configuration

Edit `.env` to customize:

```bash
# Server port
PORT=3000

# Stock check interval in milliseconds (default: 5 minutes)
CHECK_INTERVAL_MS=300000

# Email configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Default product (Nike Mind 001)
NIKE_PRODUCT_SKU=HQ4307-002
NIKE_PRODUCT_NAME=Nike Mind 001
NIKE_PRODUCT_URL=https://www.nike.com/t/mind-001-mens-pregame-mules-Ky4BSP5I/HQ4307-002
```

## Database

The system uses SQLite for data persistence:
- `alerts` - User alert subscriptions
- `stock_history` - Historical stock checks
- `retailers` - Retailer information

Database file: `data/nike-stock.db`

## Development

### Install dev dependencies
```bash
npm install --save-dev
```

### Run in development mode with auto-reload
```bash
npm run dev
```

### Run tests
```bash
npm test
```

## How It Works

1. **User Creates Alert** - Subscribes to stock notifications for a product (email or Discord)
2. **Background Monitor** - Runs every 5 minutes to check stock
3. **Stock Check** - Queries multiple retailers for product availability
4. **Alert Trigger** - If product is in stock, sends notification to all subscribers
5. **History Logging** - Records all stock checks for analytics

## Example Use Case

You just want to be notified when Nike Mind 001 is back in stock:

1. **Set up your Discord bot** (follow Installation section above)
2. **Add bot token and channel ID to `.env`**
3. **Run:**
   ```bash
   npm start
   ```

Done! The bot will automatically check every 5 minutes and post a Discord message when it finds stock. You'll get a nice formatted embed with:
- Product name and status
- Which retailers have it in stock
- Direct link to buy

## Troubleshooting

### Discord bot not sending alerts
- Verify `DISCORD_BOT_TOKEN` is correct (check it starts with `ODk...`)
- Verify `DISCORD_CHANNEL_ID` is correct (should be numbers only)
- Check that the bot is in your Discord server
- Verify the bot has "Send Messages" and "Embed Links" permissions
- Look at server console output for error messages

### Stock checks failing
- Retailer website might have changed HTML structure
- Check server logs for specific error messages
- Try manual check: `npm run check-stock <sku> <url>`

### Database errors
- Ensure `data/` directory exists
- Check file permissions on `data/nike-stock.db`
- Delete the database and restart to reinitialize

## Performance Notes

- Stock checks are staggered (1-2 seconds between retailers) to avoid rate limiting
- Default check interval is 5 minutes - adjust `CHECK_INTERVAL_MS` as needed
- Email sending is asynchronous and won't block stock checks

## Future Enhancements

- SMS alerts
- Slack notifications
- Mobile app
- Advanced filtering (size, color, price)
- REST API key authentication
- User dashboard
- Persistent notification state (prevent duplicate alerts)

## License

MIT
