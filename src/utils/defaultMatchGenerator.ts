
import { supabase } from "@/integrations/supabase/client";
import { MatchType, RoomMode, RoomType } from "@/utils/matchTypes";
import { getSystemSettings } from "./systemSettingsApi";

// Generate 5 default matches for the day at specified times (5 PM - 9 PM)
export const generateDefaultMatches = async (adminId: string): Promise<boolean> => {
  try {
    // Get system settings for profit margin
    const settings = await getSystemSettings();
    const profitMargin = settings.matchProfitMargin || 40; // Default to 40% if not set
    
    // Get today's date and check if matches already exist
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if matches already exist for today
    const { data: existingMatches, error: checkError } = await supabase
      .from('matches')
      .select('id')
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString());
      
    if (checkError) {
      console.error("Error checking existing matches:", checkError);
      return false;
    }
    
    // If matches already exist for today, don't generate more
    if (existingMatches && existingMatches.length >= 5) {
      console.log("Default matches already exist for today");
      return true;
    }
    
    // Define default match configurations
    const defaultMatches = [
      {
        hour: 17, // 5 PM
        type: MatchType.BattleRoyale,
        mode: RoomMode.Solo,
        entry_fee: 20,
        slots: 48,
        prize_pool: 800,
      },
      {
        hour: 18, // 6 PM
        type: MatchType.BattleRoyale,
        mode: RoomMode.Duo,
        entry_fee: 30,
        slots: 48,
        prize_pool: 1200,
      },
      {
        hour: 19, // 7 PM
        type: MatchType.BattleRoyale,
        mode: RoomMode.Squad,
        entry_fee: 40,
        slots: 48,
        prize_pool: 1600,
      },
      {
        hour: 20, // 8 PM
        type: MatchType.BattleRoyale,
        mode: RoomMode.Solo,
        entry_fee: 50,
        slots: 48,
        prize_pool: 2000,
      },
      {
        hour: 21, // 9 PM
        type: MatchType.ClashSquad,
        mode: RoomMode.Squad,
        entry_fee: 60,
        slots: 48,
        prize_pool: 2400,
      },
    ];
    
    // Generate matches
    const matchInserts = [];
    for (const match of defaultMatches) {
      // Skip if a match at this time already exists
      if (existingMatches?.some(em => {
        const matchDate = new Date(em.start_time);
        return matchDate.getHours() === match.hour;
      })) {
        continue;
      }
      
      // Create start time
      const startTime = new Date(today);
      startTime.setHours(match.hour, 0, 0, 0);
      
      // Calculate prize distribution
      const firstPrize = Math.floor(match.prize_pool * 0.6);
      const secondPrize = Math.floor(match.prize_pool * 0.3);
      const thirdPrize = match.prize_pool - firstPrize - secondPrize;
      
      matchInserts.push({
        type: match.type.toLowerCase(),
        mode: match.mode.toLowerCase(),
        room_type: RoomType.Normal.toLowerCase(),
        slots: match.slots,
        entry_fee: match.entry_fee,
        prize: match.prize_pool,
        first_prize: firstPrize,
        second_prize: secondPrize,
        third_prize: thirdPrize,
        coins_per_kill: 5,
        start_time: startTime.toISOString(),
        status: 'upcoming',
        created_by: adminId
      });
    }
    
    // Insert matches if any need to be created
    if (matchInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('matches')
        .insert(matchInserts);
        
      if (insertError) {
        console.error("Error creating default matches:", insertError);
        return false;
      }
      
      // Log the action
      await supabase
        .from('system_logs')
        .insert({
          admin_id: adminId,
          action: 'Default Matches Created',
          details: `Created ${matchInserts.length} default matches for ${today.toISOString().split('T')[0]}`
        });
    }
    
    return true;
  } catch (error) {
    console.error("Error generating default matches:", error);
    return false;
  }
};

// Function to check and generate matches if needed (can be called daily)
export const checkAndGenerateDefaultMatches = async (adminId: string): Promise<void> => {
  const now = new Date();
  
  // Only generate matches once per day, early in the morning
  if (now.getHours() < 8) {
    await generateDefaultMatches(adminId);
  }
};
