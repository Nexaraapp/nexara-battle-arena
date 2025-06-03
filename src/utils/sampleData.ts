import { supabase } from "@/integrations/supabase/client";

export const insertSampleRules = async () => {
  const sampleRules = [
    // General Rules
    {
      category: 'general',
      title: 'No Abusive Language',
      content: 'Avoid abusive, offensive, or discriminatory language in chat/usernames.\n\nPenalty: 🔻 10 coins',
      order_index: 1
    },
    {
      category: 'general',
      title: 'No Multiple Accounts',
      content: 'One account per user. Duplicate accounts may lead to penalty.\n\nPenalty: 🔻 20 coins + warning',
      order_index: 2
    },
    {
      category: 'general',
      title: 'Accurate Information',
      content: 'Provide accurate profile and withdrawal info.\n\nPenalty: 🔻 15 coins',
      order_index: 3
    },
    {
      category: 'general',
      title: 'No Match-Fixing',
      content: 'Collaborating to influence match results is prohibited.\n\nPenalty: 🔻 25 coins',
      order_index: 4
    },
    {
      category: 'general',
      title: 'No Exploits or Cheats',
      content: 'Any cheats or third-party tools are banned.\n\nPenalty: 🚫 Permanent ban (only exception)',
      order_index: 5
    },
    {
      category: 'general',
      title: 'Respect Admin Decisions',
      content: 'Admin decisions are final and must be followed.\n\nPenalty: 🔻 10 coins',
      order_index: 6
    },
    {
      category: 'general',
      title: 'Withdrawal Timing Rule',
      content: 'Withdrawals allowed only from 6 PM to 10 PM.\n\nPenalty: ❌ Auto-denied',
      order_index: 7
    },
    {
      category: 'general',
      title: 'No Fake Results',
      content: 'Falsifying kills or placements is a serious offense.\n\nPenalty: 🔻 20 coins',
      order_index: 8
    },

    // Battle Royale Rules
    {
      category: 'battle_royale',
      title: 'Submit Correct Kills',
      content: 'Report accurate kill count.\n\nPenalty: 🔻 10 coins',
      order_index: 1
    },
    {
      category: 'battle_royale',
      title: 'Report Correct Placement',
      content: 'Placement must be truthful.\n\nPenalty: 🔻 15 coins',
      order_index: 2
    },
    {
      category: 'battle_royale',
      title: 'No Teaming in Solo',
      content: 'Teaming in solo mode is unfair.\n\nPenalty: 🔻 20 coins',
      order_index: 3
    },
    {
      category: 'battle_royale',
      title: 'Screenshot Not Required',
      content: 'Screenshots removed — false data leads to penalty.\n\nPenalty: 🔻 20 coins',
      order_index: 4
    },
    {
      category: 'battle_royale',
      title: 'Result Submission Time Limit',
      content: 'Submit result within 1 hour of match end time.\n\nPenalty: ❌ No rewards',
      order_index: 5
    },
    {
      category: 'battle_royale',
      title: 'No Mic Abuse',
      content: 'Avoid abusive mic behavior.\n\nPenalty: 🔻 10 coins',
      order_index: 6
    },

    // Clash Squad Rules
    {
      category: 'clash_squad',
      title: 'Win Determines Prize',
      content: 'Only 1st place team wins. No kill rewards.\n\nPenalty: ℹ️ Info rule',
      order_index: 1
    },
    {
      category: 'clash_squad',
      title: 'No Kill Rewards',
      content: 'Kills have no value in CS matches.\n\nPenalty: ℹ️ Info rule',
      order_index: 2
    },
    {
      category: 'clash_squad',
      title: 'Report Win Honestly',
      content: 'Report win/loss truthfully.\n\nPenalty: 🔻 15 coins',
      order_index: 3
    },
    {
      category: 'clash_squad',
      title: 'No Pre-Arranged Matches',
      content: "Don't fix matches with friends.\n\nPenalty: 🔻 25 coins",
      order_index: 4
    },
    {
      category: 'clash_squad',
      title: 'No Griefing Teammates',
      content: "Don't sabotage teammates.\n\nPenalty: 🔻 10 coins",
      order_index: 5
    },
    {
      category: 'clash_squad',
      title: 'Report Match Quickly',
      content: 'Report results within 30 minutes.\n\nPenalty: ❌ No rewards',
      order_index: 6
    },

    // Violation Tags (Admin only)
    {
      category: 'penalties',
      title: 'New User Tag',
      content: 'First withdrawal from user - Flag for extra check.\n\nAdmin Action: Manual review required',
      order_index: 1
    },
    {
      category: 'penalties',
      title: 'Frequent User Tag',
      content: 'User has frequent transactions.\n\nAdmin Action: Manual review required',
      order_index: 2
    },
    {
      category: 'penalties',
      title: 'Suspicious Behavior',
      content: 'Suspicious result or behavior detected.\n\nAdmin Action: Delay + review',
      order_index: 3
    },
    {
      category: 'penalties',
      title: 'Over Limit',
      content: 'Exceeds withdrawal limit.\n\nAdmin Action: May reduce or delay',
      order_index: 4
    },
    {
      category: 'penalties',
      title: 'Fake Result Penalty',
      content: 'False kills or placement reported.\n\nPenalty: 🔻 20 coins',
      order_index: 5
    },
    {
      category: 'penalties',
      title: 'QR Form Misuse',
      content: 'Invalid payment info provided.\n\nPenalty: ❌ Withdrawal rejected',
      order_index: 6
    },
    {
      category: 'penalties',
      title: 'Late Report',
      content: 'Match result submitted late.\n\nPenalty: ❌ Auto rejected',
      order_index: 7
    },
    {
      category: 'penalties',
      title: 'Toxic Behavior',
      content: 'Reported for toxic behavior.\n\nPenalty: 🔻 10 coins',
      order_index: 8
    }
  ];

  try {
    // Clear existing rules first
    await supabase.from('rules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { data, error } = await supabase
      .from('rules')
      .insert(sampleRules);
    
    if (error) throw error;
    console.log('Sample rules inserted successfully');
    return data;
  } catch (error) {
    console.error('Error inserting sample rules:', error);
    throw error;
  }
};

export const insertSampleMatch = async (userId: string) => {
  const sampleMatch = {
    title: 'Battle Royale - Evening Championship',
    description: 'Join the exciting evening championship match with 50 players!',
    type: 'battle_royale',
    mode: 'battle_royale',
    entry_fee: 50,
    prize: 2000,
    first_prize: 1000,
    second_prize: 600,
    third_prize: 400,
    slots: 50,
    slots_filled: 0,
    status: 'upcoming',
    created_by: userId,
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    coins_per_kill: 5
  };

  try {
    const { data, error } = await supabase
      .from('matches')
      .insert([sampleMatch])
      .select()
      .single();
    
    if (error) throw error;
    console.log('Sample match created successfully');
    return data;
  } catch (error) {
    console.error('Error creating sample match:', error);
    throw error;
  }
};
