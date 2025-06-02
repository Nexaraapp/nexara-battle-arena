
import { supabase } from "@/integrations/supabase/client";

export const insertSampleRules = async () => {
  const sampleRules = [
    {
      category: 'general',
      title: 'Fair Play Policy',
      content: 'All players must follow fair play rules. No cheating, hacking, or exploiting bugs is allowed.',
      order_index: 1
    },
    {
      category: 'general',
      title: 'Account Responsibility',
      content: 'Players are responsible for their account security. Do not share your account credentials.',
      order_index: 2
    },
    {
      category: 'gameplay',
      title: 'Match Entry Requirements',
      content: 'Players must have sufficient coins and provide a valid In-Game Name (IGN) to join matches.',
      order_index: 1
    },
    {
      category: 'gameplay',
      title: 'Result Submission',
      content: 'Match results must be submitted within 30 minutes of match completion with valid screenshots.',
      order_index: 2
    },
    {
      category: 'withdrawal',
      title: 'Withdrawal Window',
      content: 'Withdrawals can only be requested between 6 PM and 10 PM daily. Processing takes 24-48 hours.',
      order_index: 1
    },
    {
      category: 'withdrawal',
      title: 'Minimum Withdrawal',
      content: 'Minimum withdrawal amount is 100 coins. UPI ID must be valid and verified.',
      order_index: 2
    },
    {
      category: 'penalties',
      title: 'False Result Reporting',
      content: 'Submitting false results will result in immediate account suspension and forfeiture of winnings.',
      order_index: 1
    },
    {
      category: 'penalties',
      title: 'Multiple Account Violations',
      content: 'Creating multiple accounts to exploit bonuses will result in permanent ban of all accounts.',
      order_index: 2
    }
  ];

  try {
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
