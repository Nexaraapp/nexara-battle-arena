
export const defaultRules = [
  {
    category: 'general',
    title: 'Fair Play Policy',
    content: 'All matches must be played fairly without any cheats or hacks. Screenshots of match results are required for verification. Match disputes will be reviewed by admin team.',
    order_index: 1,
    is_active: true
  },
  {
    category: 'general',
    title: 'Account Rules',
    content: 'Multiple accounts per user are not allowed. Players must join matches with sufficient balance. Use of any third-party software is strictly prohibited.',
    order_index: 2,
    is_active: true
  },
  {
    category: 'battle_royale',
    title: 'Battle Royale Rules',
    content: 'Players must achieve the required rank or placement to win. Screenshots must clearly show final rank and kill count. Match fixing or collusion will result in permanent ban.',
    order_index: 1,
    is_active: true
  },
  {
    category: 'clash_squad',
    title: 'Clash Squad Rules',
    content: 'Team matches require all team members to be present. Screenshots must show final score and team composition. Communication with enemy team during match is prohibited.',
    order_index: 1,
    is_active: true
  },
  {
    category: 'penalties',
    title: 'Warning System',
    content: 'Minor rule violations result in warnings. Repeated violations lead to temporary bans. Severe misconduct results in permanent account suspension.',
    order_index: 1,
    is_active: true
  },
  {
    category: 'penalties',
    title: 'Ban Categories',
    content: 'Temporary Ban: Unsportsmanlike conduct (1-7 days). Permanent Ban: Cheating, hacking, or match fixing. Account Freeze: Suspicious activities under investigation.',
    order_index: 2,
    is_active: true
  }
];
