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

4. (Optional) Configure email alerts:
   - Enable 2-Factor Authentication on your Gmail account
   - Generate an [App-specific password](https://myaccount.google.com/apppasswords)
   - Add to `.env`:
     ```
     EMAIL_SERVICE=gmail
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASSWORD=your-app-specific-password
     ```

5. (Optional) Get your Discord webhook URL:
   - Open your Discord server and go to a channel where you want stock alerts
   - Right-click the channel → Edit Channel
   - Go to Integrations → Webhooks
   - Click "New Webhook"
   - Give it a name (e.g., "Nike Stock Alerts")
   - Copy the webhook URL - you'll use this when creating alerts

## Quick Start

### Create a Discord Stock Alert

```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "HQ4307-002",
    "productName": "Nike Mind 001",
    "productUrl": "https://www.nike.com/t/mind-001-mens-pregame-mules-Ky4BSP5I/HQ4307-002",
    "webhookUrl": "https://discordapp.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN",
    "notificationMethod": "discord"
  }'
```

### Create an Email Stock Alert

```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "HQ4307-002",
    "productName": "Nike Mind 001",
    "productUrl": "https://www.nike.com/t/mind-001-mens-pregame-mules-Ky4BSP5I/HQ4307-002",
    "userEmail": "your-email@example.com",
    "notificationMethod": "email",
    "size": "M"
  }'
```

### Start the Server

```bash
npm start
```

The server will:
1. Start on port 3000
2. Initialize the database
3. Begin monitoring all active alerts every 5 minutes
4. Send email alerts when products come back in stock

### Check Stock Manually

```bash
npm run check-stock HQ4307-002 https://www.nike.com/t/mind-001-mens-pregame-mules-Ky4BSP5I/HQ4307-002
```

## API Endpoints

### Alerts Management

#### Create Alert
```
POST /api/alerts
```
**Body:**
```json
{
  "productId": "string",
  "productName": "string",
  "productUrl": "string",
  "userEmail": "string (required for email)",
  "webhookUrl": "string (required for discord/webhook)",
  "notificationMethod": "email|discord|webhook",
  "size": "string (optional)"
}
```

**Examples:**
- **Discord**: Send alert to Discord channel
  ```json
  {
    "productId": "HQ4307-002",
    "productName": "Nike Mind 001",
    "productUrl": "https://www.nike.com/...",
    "webhookUrl": "https://discordapp.com/api/webhooks/...",
    "notificationMethod": "discord"
  }
  ```

- **Email**: Send alert to email
  ```json
  {
    "productId": "HQ4307-002",
    "productName": "Nike Mind 001",
    "productUrl": "https://www.nike.com/...",
    "userEmail": "you@example.com",
    "notificationMethod": "email"
  }
  ```

#### Get User Alerts
```
GET /api/alerts/user/:email
```

#### Get All Active Alerts
```
GET /api/alerts
```

#### Update Alert
```
PUT /api/alerts/:id
```
**Body:**
```json
{
  "active": true|false
}
```

#### Delete Alert
```
DELETE /api/alerts/:id
```

### Stock Checking

#### Check Stock (Manual)
```
POST /api/stock/check
```
**Body:**
```json
{
  "productSku": "HQ4307-002",
  "productUrl": "https://www.nike.com/..."
}
```

#### Get Stock History
```
GET /api/stock/history/:productId?limit=50
```

#### Get Current Stock Status
```
GET /api/stock/status/:productId
```

#### Trigger Manual Stock Check
```
POST /api/stock/check-all
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

You want to be notified when Nike Mind 001 (HQ4307-002) is back in stock:

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Create a Discord alert:**
   ```bash
   curl -X POST http://localhost:3000/api/alerts \
     -H "Content-Type: application/json" \
     -d '{
       "productId": "HQ4307-002",
       "productName": "Nike Mind 001 - Mens Pregame Mules",
       "productUrl": "https://www.nike.com/t/mind-001-mens-pregame-mules-Ky4BSP5I/HQ4307-002",
       "webhookUrl": "https://discordapp.com/api/webhooks/YOUR_ID/YOUR_TOKEN",
       "notificationMethod": "discord"
     }'
   ```

3. **Wait for notifications** - You'll receive a Discord message in your channel when the product is back in stock at any supported retailer

## Troubleshooting

### Email alerts not sending
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`
- If using Gmail, ensure App-specific password is generated
- Check server logs for error messages

### Discord alerts not sending
- Verify the webhook URL is correct and hasn't expired
- Check that the Discord bot has permission to post in the channel
- Make sure the webhook URL includes both ID and token parts
- Check server logs for specific error messages

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
