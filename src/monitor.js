import { createClient } from "@supabase/supabase-js";
import TelegramBot from "node-telegram-bot-api";
import CryptoJS from "crypto-js";
import { IExecDataProtectorDeserializer } from "@iexec/dataprotector-deserializer";

// TODO: Replace with your actual Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Placeholder for your decryption logic
async function decryptMessage(encrypted) {
  // Use the deserializer as in app.js
  const deserializer = new IExecDataProtectorDeserializer();
  // The encrypted value is expected to be under the key 'article'
  // If your schema is different, adjust accordingly
  await deserializer.setProtectedData({ article: encrypted });
  const decrypted = await deserializer.getValue("article", "string");
  return decrypted;
}

async function main() {
  const { data: users, error } = await supabase.from("checkins").select("*");

  if (error) {
    console.error("Error fetching check-ins:", error);
    process.exit(1);
  }

  const now = new Date();
  for (const user of users) {
    const lastCheckin = new Date(user.last_checkin);
    const interval = user.checkin_interval_hours || 24; // default 24h
    const hoursSinceCheckin = (now - lastCheckin) / (1000 * 60 * 60);
    if (hoursSinceCheckin > interval) {
      // User missed check-in, trigger kill switch
      const decrypted = await decryptMessage(user.encrypted_message);
      try {
        const bot = new TelegramBot(user.telegram_bot_token);
        await bot.sendMessage(user.telegram_chat_id, decrypted);
        console.log(`Sent message for user ${user.user_id}`);
      } catch (err) {
        console.error(
          `Failed to send Telegram message for user ${user.user_id}:`,
          err
        );
      }
    }
  }
}

main();
