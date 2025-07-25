export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      campaign_custom_fields: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          name: string
          placeholder: string | null
          required: boolean | null
          type: Database["public"]["Enums"]["field_type"]
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          name: string
          placeholder?: string | null
          required?: boolean | null
          type: Database["public"]["Enums"]["field_type"]
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          name?: string
          placeholder?: string | null
          required?: boolean | null
          type?: Database["public"]["Enums"]["field_type"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_custom_fields_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_prizes: {
        Row: {
          campaign_id: string
          coupon_code: string | null
          created_at: string | null
          id: string
          name: string
          percentage: number
        }
        Insert: {
          campaign_id: string
          coupon_code?: string | null
          created_at?: string | null
          id?: string
          name: string
          percentage: number
        }
        Update: {
          campaign_id?: string
          coupon_code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_prizes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          collect_data_before: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          prize_description: string | null
          rules: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          thank_you_message: string | null
          updated_at: string | null
          user_id: string
          wheel_color: string | null
        }
        Insert: {
          collect_data_before?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          prize_description?: string | null
          rules?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          thank_you_message?: string | null
          updated_at?: string | null
          user_id: string
          wheel_color?: string | null
        }
        Update: {
          collect_data_before?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          prize_description?: string | null
          rules?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          thank_you_message?: string | null
          updated_at?: string | null
          user_id?: string
          wheel_color?: string | null
        }
        Relationships: []
      }
      participations: {
        Row: {
          campaign_id: string
          coupon_code: string | null
          coupon_used: boolean | null
          created_at: string | null
          has_spun: boolean | null
          id: string
          participant_data: Json
          prize_won: string | null
        }
        Insert: {
          campaign_id: string
          coupon_code?: string | null
          coupon_used?: boolean | null
          created_at?: string | null
          has_spun?: boolean | null
          id?: string
          participant_data: Json
          prize_won?: string | null
        }
        Update: {
          campaign_id?: string
          coupon_code?: string | null
          coupon_used?: boolean | null
          created_at?: string | null
          has_spun?: boolean | null
          id?: string
          participant_data?: Json
          prize_won?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          city: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          segment: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          phone?: string | null
          segment?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          segment?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      campaign_status: "active" | "draft"
      field_type: "text" | "email" | "phone" | "number" | "date"
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
      campaign_status: ["active", "draft"],
      field_type: ["text", "email", "phone", "number", "date"],
    },
  },
} as const
