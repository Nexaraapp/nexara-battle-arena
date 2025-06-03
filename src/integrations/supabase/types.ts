export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string | null
          description: string
          icon: string
          id: string
          name: string
          requirement_value: number
          reward_coins: number | null
          type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          icon: string
          id?: string
          name: string
          requirement_value: number
          reward_coins?: number | null
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_value?: number
          reward_coins?: number | null
          type?: string
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          claimed_at: string | null
          id: string
          reward_coins: number
          streak_count: number | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          id?: string
          reward_coins: number
          streak_count?: number | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          id?: string
          reward_coins?: number
          streak_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      match_entries: {
        Row: {
          created_at: string
          id: string
          ign: string | null
          kills: number | null
          match_id: string
          paid: boolean
          placement: number | null
          result_status: string | null
          screenshot_url: string | null
          slot_number: number
          submitted_at: string | null
          team_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ign?: string | null
          kills?: number | null
          match_id: string
          paid?: boolean
          placement?: number | null
          result_status?: string | null
          screenshot_url?: string | null
          slot_number: number
          submitted_at?: string | null
          team_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ign?: string | null
          kills?: number | null
          match_id?: string
          paid?: boolean
          placement?: number | null
          result_status?: string | null
          screenshot_url?: string | null
          slot_number?: number
          submitted_at?: string | null
          team_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_entries_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          kills: number | null
          match_id: string | null
          placement: number | null
          prize_amount: number | null
          screenshot_url: string | null
          status: string | null
          team_id: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          kills?: number | null
          match_id?: string | null
          placement?: number | null
          prize_amount?: number | null
          screenshot_url?: string | null
          status?: string | null
          team_id?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          kills?: number | null
          match_id?: string | null
          placement?: number | null
          prize_amount?: number | null
          screenshot_url?: string | null
          status?: string | null
          team_id?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          coins_per_kill: number | null
          created_at: string
          created_by: string
          description: string | null
          entry_fee: number
          first_prize: number | null
          id: string
          kills_reward: number | null
          max_teams: number | null
          mode: string | null
          prize: number
          room_id: string | null
          room_password: string | null
          room_type: string | null
          second_prize: number | null
          slots: number
          slots_filled: number
          start_time: string | null
          status: string
          third_prize: number | null
          title: string | null
          type: string
        }
        Insert: {
          coins_per_kill?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          entry_fee: number
          first_prize?: number | null
          id?: string
          kills_reward?: number | null
          max_teams?: number | null
          mode?: string | null
          prize: number
          room_id?: string | null
          room_password?: string | null
          room_type?: string | null
          second_prize?: number | null
          slots: number
          slots_filled?: number
          start_time?: string | null
          status: string
          third_prize?: number | null
          title?: string | null
          type: string
        }
        Update: {
          coins_per_kill?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          entry_fee?: number
          first_prize?: number | null
          id?: string
          kills_reward?: number | null
          max_teams?: number | null
          mode?: string | null
          prize?: number
          room_id?: string | null
          room_password?: string | null
          room_type?: string | null
          second_prize?: number | null
          slots?: number
          slots_filled?: number
          start_time?: string | null
          status?: string
          third_prize?: number | null
          title?: string | null
          type?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_granted: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          referred_id: string
          referred_reward: number | null
          referred_user_purchased: boolean | null
          referrer_id: string
          referrer_reward: number | null
          status: string | null
        }
        Insert: {
          bonus_granted?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referred_id: string
          referred_reward?: number | null
          referred_user_purchased?: boolean | null
          referrer_id: string
          referrer_reward?: number | null
          status?: string | null
        }
        Update: {
          bonus_granted?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referred_id?: string
          referred_reward?: number | null
          referred_user_purchased?: boolean | null
          referrer_id?: string
          referrer_reward?: number | null
          status?: string | null
        }
        Relationships: []
      }
      rules: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: string | null
          id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          match_profit_margin: number
          require_ad_for_withdrawal: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_profit_margin?: number
          require_ad_for_withdrawal?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          match_profit_margin?: number
          require_ad_for_withdrawal?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          id: string
          match_id: string | null
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          match_id?: string | null
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          match_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      top_up_packs: {
        Row: {
          amount: number
          coins: number
          id: number
        }
        Insert: {
          amount: number
          coins: number
          id?: never
        }
        Update: {
          amount?: number
          coins?: number
          id?: never
        }
        Relationships: []
      }
      transactions: {
        Row: {
          admin_id: string | null
          amount: number
          date: string
          id: string
          is_real_coins: boolean | null
          match_id: string | null
          notes: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          amount: number
          date?: string
          id?: string
          is_real_coins?: boolean | null
          match_id?: string | null
          notes?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          amount?: number
          date?: string
          id?: string
          is_real_coins?: boolean | null
          match_id?: string | null
          notes?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          game_id: string | null
          has_completed_onboarding: boolean | null
          id: string
          level: number | null
          referral_code: string | null
          referred_by: string | null
          total_kills: number | null
          total_matches: number | null
          total_wins: number | null
          updated_at: string | null
          user_id: string
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          game_id?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          level?: number | null
          referral_code?: string | null
          referred_by?: string | null
          total_kills?: number | null
          total_matches?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          game_id?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          level?: number | null
          referral_code?: string | null
          referred_by?: string | null
          total_kills?: number | null
          total_matches?: number | null
          total_wins?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          average_kills: number | null
          best_placement: number | null
          created_at: string
          id: string
          total_earnings: number | null
          total_kills: number | null
          total_matches: number | null
          total_wins: number | null
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          average_kills?: number | null
          best_placement?: number | null
          created_at?: string
          id?: string
          total_earnings?: number | null
          total_kills?: number | null
          total_matches?: number | null
          total_wins?: number | null
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          average_kills?: number | null
          best_placement?: number | null
          created_at?: string
          id?: string
          total_earnings?: number | null
          total_kills?: number | null
          total_matches?: number | null
          total_wins?: number | null
          updated_at?: string
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      withdrawal_settings: {
        Row: {
          end_time: string
          estimated_processing_hours: number | null
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          end_time?: string
          estimated_processing_hours?: number | null
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          end_time?: string
          estimated_processing_hours?: number | null
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      withdrawal_tiers: {
        Row: {
          amount: number
          coins: number
          id: number
        }
        Insert: {
          amount: number
          coins: number
          id?: never
        }
        Update: {
          amount?: number
          coins?: number
          id?: never
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_note: string | null
          admin_tags: string[] | null
          amount: number | null
          auto_tags: string[] | null
          created_at: string | null
          id: number
          is_suspicious: boolean | null
          preferred_time_slot: string | null
          private_notes: string | null
          processed_at: string | null
          processed_by: string | null
          public_notes: string | null
          qr_code_url: string | null
          qr_url: string | null
          risk_score: number | null
          status: string | null
          upi_id: string | null
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          admin_tags?: string[] | null
          amount?: number | null
          auto_tags?: string[] | null
          created_at?: string | null
          id?: number
          is_suspicious?: boolean | null
          preferred_time_slot?: string | null
          private_notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          public_notes?: string | null
          qr_code_url?: string | null
          qr_url?: string | null
          risk_score?: number | null
          status?: string | null
          upi_id?: string | null
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          admin_tags?: string[] | null
          amount?: number | null
          auto_tags?: string[] | null
          created_at?: string | null
          id?: number
          is_suspicious?: boolean | null
          preferred_time_slot?: string | null
          private_notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          public_notes?: string | null
          qr_code_url?: string | null
          qr_url?: string | null
          risk_score?: number | null
          status?: string | null
          upi_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_withdrawal: {
        Args: { withdrawal_id: number; admin_id: string; admin_note?: string }
        Returns: boolean
      }
      approve_withdrawal_v2: {
        Args: {
          withdrawal_id: number
          admin_id: string
          public_note?: string
          private_note?: string
        }
        Returns: boolean
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_withdrawal_time_allowed: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      process_referral_bonus: {
        Args: { referred_user_id: string }
        Returns: boolean
      }
      reject_withdrawal: {
        Args: { withdrawal_id: number; admin_id: string; admin_note?: string }
        Returns: boolean
      }
      reject_withdrawal_v2: {
        Args: {
          withdrawal_id: number
          admin_id: string
          public_note?: string
          private_note?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin" | "superadmin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "admin", "superadmin"],
    },
  },
} as const
