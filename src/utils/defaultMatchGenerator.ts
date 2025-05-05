
import { supabase } from "@/integrations/supabase/client";
import { getSystemSettings } from "./systemSettingsApi";

/**
 * Generate default matches for the day
 * Creates 5 matches at 5 PM, 6 PM, 7 PM, 8 PM, and 9 PM
 */
export const generateDefaultMatches = async (superadminId: string): Promise<boolean> => {
  try {
    // Check if matches are already generated for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
    
    const { data: existingMatches, error: checkError } = await supabase
      .from('matches')
      .select('id, start_time')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay);
      
    if (checkError) {
      console.error("Error checking existing matches:", checkError);
      return false;
    }
    
    // If we already have 5 or more matches for today, don't create more
    if (existingMatches && existingMatches.length >= 5) {
      console.log("Default matches already generated for today");
      return true;
    }
    
    // Get system settings for profit margin
    const settings = await getSystemSettings();
    const profitMargin = settings.matchProfitMargin || 40; // Default to 40% if not set
    
    // Create 5 matches at 5 PM, 6 PM, 7 PM, 8 PM, and 9 PM
    const matchTimes = [17, 18, 19, 20, 21];
    
    // Define match configurations for 1v1 matches
    const matchTypes = [
      { type: "1v1", mode: "1v1", slots: 2, coinsPerKill: 0 },
      { type: "1v1", mode: "1v1", slots: 2, coinsPerKill: 0 },
      { type: "1v1", mode: "1v1", slots: 2, coinsPerKill: 0 },
      { type: "1v1", mode: "1v1", slots: 2, coinsPerKill: 0 },
      { type: "1v1", mode: "1v1", slots: 2, coinsPerKill: 0 }
    ];
    
    // Skip times that already have matches
    const existingTimes = new Set();
    if (existingMatches) {
      existingMatches.forEach(match => {
        if (match.start_time) {
          const matchTime = new Date(match.start_time).getHours();
          existingTimes.add(matchTime);
        }
      });
    }
    
    const matchesToCreate = [];
    let index = 0;
    
    for (const hour of matchTimes) {
      if (existingTimes.has(hour)) {
        console.log(`Match already exists for ${hour}:00`);
        continue;
      }
      
      if (index >= matchTypes.length) {
        index = 0;
      }
      
      const matchConfig = matchTypes[index];
      
      // Calculate start time for this match
      const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, 0, 0).toISOString();
      
      // Entry fee fixed at 10 coins
      const entryFee = 10;
      // Prize is 18 coins
      const prizePool = 18;
      
      // For 1v1, winner takes all
      const firstPrize = prizePool;
      const secondPrize = 0;
      const thirdPrize = 0;
      
      matchesToCreate.push({
        type: matchConfig.type,
        slots: matchConfig.slots,
        entry_fee: entryFee,
        prize: prizePool,
        start_time: startTime,
        status: 'upcoming',
        created_by: superadminId,
        slots_filled: 0,
        mode: matchConfig.mode,
        room_type: "normal",
        first_prize: firstPrize,
        second_prize: secondPrize,
        third_prize: thirdPrize,
        coins_per_kill: matchConfig.coinsPerKill
      });
      
      index++;
    }
    
    // Insert new matches
    if (matchesToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from('matches')
        .insert(matchesToCreate);
        
      if (insertError) {
        console.error("Error creating default matches:", insertError);
        return false;
      }
      
      // Log the action
      await supabase
        .from('system_logs')
        .insert({
          admin_id: superadminId,
          action: 'Default Matches Generated',
          details: `Generated ${matchesToCreate.length} default matches for today`
        });
        
      console.log(`Created ${matchesToCreate.length} default matches`);
      return true;
    } else {
      console.log("No new matches needed to be created");
      return true;
    }
    
  } catch (error) {
    console.error("Error generating default matches:", error);
    return false;
  }
};
