import { Telegraf, Context } from 'telegraf';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://yourdomain.com/game';
const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

// Initialize bot
const bot = new Telegraf<Context>(TOKEN);

// Initialize Express server for serving the web app
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../game/dist')));

/**
 * Bot command: /start
 * Greets the user and shows the main menu
 */
bot.start(async (ctx: Context) => {
  const userId = ctx.from?.id;
  const firstName = ctx.from?.first_name || 'Player';

  console.log(`[Bot] User ${userId} (${firstName}) started the bot`);

  const welcomeMessage = `
🎮 Welcome to K-Cover Dance Life! 🎤

Manage your K-pop career, build relationships with NPCs, and reach the top!

Choose an action:
  `;

  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎮 Play Game',
            web_app: {
              url: WEB_APP_URL,
            },
          },
        ],
        [
          {
            text: '📊 My Stats',
            callback_data: 'stats',
          },
          {
            text: '⚙️ Settings',
            callback_data: 'settings',
          },
        ],
        [
          {
            text: '❓ Help',
            callback_data: 'help',
          },
          {
            text: '📝 About',
            callback_data: 'about',
          },
        ],
      ],
    },
  });
});

/**
 * Bot command: /help
 * Shows help information
 */
bot.command('help', async (ctx: Context) => {
  const helpText = `
🎮 K-Cover Dance Life - Help

**Game Features:**
  🎤 Create your K-pop artist character
  🎵 Train and improve your skills
  💰 Earn money and reputation
  👥 Build relationships with NPCs
  🤝 Join teams and work on projects
  🎁 Give gifts and special greetings
  📈 Track your career progress

**Web App Buttons:**
  • 🎮 Play Game - Open the main game
  • 📊 My Stats - View your achievements
  • ⚙️ Settings - Adjust preferences
  • ❓ Help - Get assistance
  • 📝 About - Learn more

**Tips:**
  1. Manage your energy carefully
  2. Build relationships to unlock opportunities
  3. Join teams for better projects
  4. Save your progress regularly
  5. Check events for special opportunities

For more help, visit our website or contact support.
  `;

  await ctx.reply(helpText, { parse_mode: 'Markdown' });
});

/**
 * Bot command: /about
 * Shows information about the game
 */
bot.command('about', async (ctx: Context) => {
  const aboutText = `
📝 About K-Cover Dance Life

**K-Cover Dance Life** is an interactive game where you manage the career of a K-pop artist.

**Version:** 1.4.0
**Platform:** Telegram Web App
**Language:** TypeScript + React

**Features:**
  ✨ Dynamic character creation
  🎯 Career progression system
  👥 Deep NPC relationship mechanics
  🎁 Gift and greeting system
  💼 Team management
  🎬 Project system
  📊 Statistics tracking

**Development:**
  Built with React + Vite for frontend
  Powered by Telegraf for Telegram integration
  Uses Telegram CloudStorage for save data

**Support:**
  Contact us for bug reports or suggestions!
  `;

  await ctx.reply(aboutText, { parse_mode: 'Markdown' });
});

/**
 * Callback query handler
 */
bot.on('callback_query', async (ctx: Context) => {
  const data = (ctx.callbackQuery as any)?.data;

  switch (data) {
    case 'stats':
      await ctx.answerCbQuery('Stats feature coming soon!', { show_alert: false });
      break;
    case 'settings':
      await ctx.answerCbQuery('Settings feature coming soon!', { show_alert: false });
      break;
    case 'help':
      await ctx.reply(
        '📖 For detailed help, use /help command',
      );
      break;
    case 'about':
      await ctx.reply(
        '📝 For more information, use /about command',
      );
      break;
    default:
      await ctx.answerCbQuery();
  }
});

/**
 * Handle web_app_data from the game
 * This is called when the web app sends data back to the bot
 */
bot.on('web_app_data', async (ctx: Context) => {
  console.log('[Bot] Received web_app_data:', ctx.webAppData);

  if (ctx.webAppData?.data) {
    try {
      const dataString = typeof ctx.webAppData.data === 'string' 
        ? ctx.webAppData.data 
        : JSON.stringify(ctx.webAppData.data);
      const gameData = JSON.parse(dataString);
      console.log('[Bot] Game data:', gameData);

      // Handle the data (e.g., save to database, award badges, etc.)
      // For now, just acknowledge receipt
      await ctx.reply('✅ Game data received and saved!');
    } catch (error) {
      console.error('[Bot] Error parsing game data:', error);
      await ctx.reply('❌ Error saving data. Please try again.');
    }
  }
});

/**
 * Default handler for unknown commands
 */
bot.command('unknown', async (ctx: Context) => {
  await ctx.reply(
    '❓ Unknown command. Use /start to see available options or /help for more information.'
  );
});

/**
 * Error handler
 */
bot.catch((err: any, ctx: Context) => {
  console.error('[Bot] Error:', err);
  ctx.reply('❌ An error occurred. Please try again later.').catch(() => {
    console.error('[Bot] Could not send error message');
  });
});

/**
 * Express middleware to serve the game web app
 */
app.get('/game', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../../game/dist/index.html'));
});

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Bot info endpoint
 */
app.get('/api/bot-info', async (_req: Request, res: Response) => {
  try {
    const me = await bot.telegram.getMe();
    res.json({
      success: true,
      bot: {
        id: me.id,
        username: me.username,
        first_name: me.first_name,
      },
      webAppUrl: WEB_APP_URL,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get bot info',
    });
  }
});

/**
 * Start the bot and server
 */
async function start() {
  try {
    // Start Express server
    app.listen(PORT, () => {
      console.log(`[Server] Express server running on port ${PORT}`);
      console.log(`[Server] Web app available at http://localhost:${PORT}/game`);
      console.log(`[Server] Environment: ${NODE_ENV}`);
    });

    // Launch bot
    const webhookUrl = process.env.WEBHOOK_URL;
    if (webhookUrl && NODE_ENV === 'production') {
      // Use webhook in production if URL is provided
      console.log(`[Bot] Starting bot with webhook: ${webhookUrl}`);
      await bot.telegram.setWebhook(`${webhookUrl}/bot${TOKEN}`);

      app.post(`/bot${TOKEN}`, (req: Request, res: Response) => {
        try {
          bot.handleUpdate(req.body).catch((err: any) => {
            console.error('[Bot] Webhook error:', err);
            res.status(500).send('Internal Server Error');
          });
          res.status(200).send('OK');
        } catch (err) {
          console.error('[Bot] Webhook error:', err);
          res.status(500).send('Internal Server Error');
        }
      });
    } else {
      // Use polling (default)
      console.log('[Bot] Starting bot with polling');
      bot.launch();
    }

    console.log('[Bot] Bot started successfully! 🚀');
  } catch (error) {
    console.error('[Bot] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Bot] Shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Bot] Shutting down gracefully...');
  await bot.stop();
  process.exit(0);
});

// Start the application
start().catch(console.error);
