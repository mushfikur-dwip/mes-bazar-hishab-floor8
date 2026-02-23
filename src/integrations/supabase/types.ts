export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      balance_ledger: {
        Row: {
          closing_balance: number
          computed_at: string
          id: string
          month_key: string
          opening_balance: number
          user_id: string
        }
        Insert: {
          closing_balance?: number
          computed_at?: string
          id?: string
          month_key: string
          opening_balance?: number
          user_id: string
        }
        Update: {
          closing_balance?: number
          computed_at?: string
          id?: string
          month_key?: string
          opening_balance?: number
          user_id?: string
        }
        Relationships: []
      }
      bazar_entries: {
        Row: {
          amount: number
          bazar_by: string | null
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          id: string
          month_key: string
          updated_at: string
        }
        Insert: {
          amount?: number
          bazar_by?: string | null
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          month_key: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bazar_by?: string | null
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          month_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      bazar_rotation: {
        Row: {
          created_at: string
          id: string
          month_key: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month_key: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month_key?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      extra_costs: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          month_key: string
          note: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          month_key: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          month_key?: string
          note?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      meal_cutoff_settings: {
        Row: {
          breakfast_cutoff_hour: number
          breakfast_cutoff_prev_day: boolean
          created_at: string
          dinner_cutoff_hour: number
          dinner_cutoff_prev_day: boolean
          id: string
          lunch_cutoff_hour: number
          lunch_cutoff_prev_day: boolean
          month_key: string
          updated_at: string
        }
        Insert: {
          breakfast_cutoff_hour?: number
          breakfast_cutoff_prev_day?: boolean
          created_at?: string
          dinner_cutoff_hour?: number
          dinner_cutoff_prev_day?: boolean
          id?: string
          lunch_cutoff_hour?: number
          lunch_cutoff_prev_day?: boolean
          month_key: string
          updated_at?: string
        }
        Update: {
          breakfast_cutoff_hour?: number
          breakfast_cutoff_prev_day?: boolean
          created_at?: string
          dinner_cutoff_hour?: number
          dinner_cutoff_prev_day?: boolean
          id?: string
          lunch_cutoff_hour?: number
          lunch_cutoff_prev_day?: boolean
          month_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          breakfast: boolean
          breakfast_guest_count: number
          created_at: string
          date: string
          dinner: boolean
          dinner_guest_count: number
          id: string
          lunch: boolean
          lunch_guest_count: number
          month_key: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          breakfast?: boolean
          breakfast_guest_count?: number
          created_at?: string
          date: string
          dinner?: boolean
          dinner_guest_count?: number
          id?: string
          lunch?: boolean
          lunch_guest_count?: number
          month_key: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          breakfast?: boolean
          breakfast_guest_count?: number
          created_at?: string
          date?: string
          dinner?: boolean
          dinner_guest_count?: number
          id?: string
          lunch?: boolean
          lunch_guest_count?: number
          month_key?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_weight_settings: {
        Row: {
          breakfast_weight: number
          created_at: string
          dinner_weight: number
          id: string
          lunch_weight: number
          month_key: string
          updated_at: string
        }
        Insert: {
          breakfast_weight?: number
          created_at?: string
          dinner_weight?: number
          id?: string
          lunch_weight?: number
          month_key: string
          updated_at?: string
        }
        Update: {
          breakfast_weight?: number
          created_at?: string
          dinner_weight?: number
          id?: string
          lunch_weight?: number
          month_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_month_status: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          month_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          month_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          month_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          month_key: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          month_key?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          month_key?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          method: string | null
          month_key: string
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          date: string
          id?: string
          method?: string | null
          month_key: string
          note?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          method?: string | null
          month_key?: string
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          fcm_token: string | null
          full_name: string
          id: string
          phone: string | null
          telegram_chat_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fcm_token?: string | null
          full_name?: string
          id: string
          phone?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fcm_token?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reminder_settings: {
        Row: {
          created_at: string
          description: string
          hour_utc6: number
          id: string
          is_enabled: boolean
          minute_utc6: number
          reminder_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          hour_utc6?: number
          id?: string
          is_enabled?: boolean
          minute_utc6?: number
          reminder_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          hour_utc6?: number
          id?: string
          is_enabled?: boolean
          minute_utc6?: number
          reminder_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const
