
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
    const matchTypes = [
      { type: "battle_royale", mode: "solo", slots: 48, coinsPerKill: 1 },
      { type: "battle_royale", mode: "duo", slots: 48, coinsPerKill: 2 },
      { type: "battle_royale", mode: "squad", slots: 48, coinsPerKill: 1 },
      { type: "clash_squad", mode: "squad", slots: 8, coinsPerKill: 0 },
      { type: "clash_squad", mode: "squad", slots: 8, coinsPerKill: 0 }
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
      
      // Calculate entry fee and prize pool
      // For simplicity, use entry fee of 10 coins for all matches
      const entryFee = 10;
      // Prize pool is entry fee * slots * (1 - profit margin / 100)
      const totalPossibleFees = entryFee * matchConfig.slots;
      const prizePool = Math.floor(totalPossibleFees * (1 - profitMargin / 100));
      
      // Calculate prize distribution (50% first, 30% second, 20% third)
      const firstPrize = Math.floor(prizePool * 0.5);
      const secondPrize = Math.floor(prizePool * 0.3);
      const thirdPrize = prizePool - firstPrize - secondPrize; // Ensure total adds up exactly
      
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
