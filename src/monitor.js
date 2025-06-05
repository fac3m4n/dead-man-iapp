// This could be a serverless function, cron job, or Supabase Edge Function
import { createClient } from "@/utils/supabase/server";
import { IExecDataProtector } from "@iexec/dataprotector";

export async function autoRevealJob() {
  const supabase = createClient();
  // 1. Get all users and their last check-in
  const { data: check_ins } = await supabase.from("check_ins").select("*");
  for (const check_in of check_ins) {
    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("*")
      .eq("wallet_address", check_in.wallet_address)
      .order("created_at", { ascending: false })
      .limit(1);

    const lastCheckIn = checkIns?.[0]?.created_at
      ? new Date(checkIns[0].created_at)
      : null;
    const now = new Date();
    const diff = lastCheckIn ? now - lastCheckIn : Infinity;

    if (diff > 7 * 24 * 60 * 60 * 1000 && !user.revealed) {
      // 2. Reveal the data
      const dataProtector = new IExecDataProtector(/* ...provider... */);
      await dataProtector.processProtectedData({
        protectedData: user.protectedData,
        workerpool: "tdx-labs.pools.iexec.eth",
        app: "0x1919ceb0c6e60f3B497936308B58F9a6aDf071eC",
      });
      // 3. Mark as revealed
      await supabase
        .from("check_ins")
        .update({ revealed: true, revealed_at: now })
        .eq("wallet_address", check_in.wallet_address);
    }
  }
}
