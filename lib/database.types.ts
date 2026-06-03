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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      children: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: number
          level: number
          name: string
          owner_id: string
          share_token: string
          slug: string
          theme_color: string
          theme_key: string
          total_points: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: number
          level?: number
          name: string
          owner_id: string
          share_token?: string
          slug: string
          theme_color: string
          theme_key?: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: number
          level?: number
          name?: string
          owner_id?: string
          share_token?: string
          slug?: string
          theme_color?: string
          theme_key?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      points_records: {
        Row: {
          child_id: number
          create_time: string
          id: number
          owner_id: string
          points: number
          record_type: string
          related_id: number | null
          remark: string | null
        }
        Insert: {
          child_id: number
          create_time?: string
          id?: number
          owner_id: string
          points: number
          record_type: string
          related_id?: number | null
          remark?: string | null
        }
        Update: {
          child_id?: number
          create_time?: string
          id?: number
          owner_id?: string
          points?: number
          record_type?: string
          related_id?: number | null
          remark?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_records_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_records_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_child_summary"
            referencedColumns: ["child_id"]
          },
        ]
      }
      settings: {
        Row: {
          admin_pwd: string
          compact_mode: boolean
          created_at: string
          global_theme: string
          owner_id: string
          security_answer: string | null
          security_question: string | null
          sound_open: boolean
          updated_at: string
        }
        Insert: {
          admin_pwd: string
          compact_mode?: boolean
          created_at?: string
          global_theme?: string
          owner_id: string
          security_answer?: string | null
          security_question?: string | null
          sound_open?: boolean
          updated_at?: string
        }
        Update: {
          admin_pwd?: string
          compact_mode?: boolean
          created_at?: string
          global_theme?: string
          owner_id?: string
          security_answer?: string | null
          security_question?: string | null
          sound_open?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          child_id: number
          created_at: string
          owner_id: string
          task_id: number
        }
        Insert: {
          child_id: number
          created_at?: string
          owner_id: string
          task_id: number
        }
        Update: {
          child_id?: number
          created_at?: string
          owner_id?: string
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_child_summary"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_audit: {
        Row: {
          audit_status: string
          audit_time: string | null
          child_id: number
          id: number
          owner_id: string
          refuse_reason: string | null
          submit_time: string
          task_id: number
        }
        Insert: {
          audit_status?: string
          audit_time?: string | null
          child_id: number
          id?: number
          owner_id: string
          refuse_reason?: string | null
          submit_time?: string
          task_id: number
        }
        Update: {
          audit_status?: string
          audit_time?: string | null
          child_id?: number
          id?: number
          owner_id?: string
          refuse_reason?: string | null
          submit_time?: string
          task_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_audit_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_audit_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_child_summary"
            referencedColumns: ["child_id"]
          },
          {
            foreignKeyName: "task_audit_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          auto_check: boolean
          closed_reason: string | null
          created_at: string
          cycle: string
          icon: string
          id: number
          name: string
          owner_id: string
          points: number
          status: boolean
          type: string | null
          updated_at: string
        }
        Insert: {
          auto_check?: boolean
          closed_reason?: string | null
          created_at?: string
          cycle: string
          icon: string
          id?: number
          name: string
          owner_id: string
          points: number
          status?: boolean
          type?: string | null
          updated_at?: string
        }
        Update: {
          auto_check?: boolean
          closed_reason?: string | null
          created_at?: string
          cycle?: string
          icon?: string
          id?: number
          name?: string
          owner_id?: string
          points?: number
          status?: boolean
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wishes: {
        Row: {
          child_id: number | null
          created_at: string
          emoji: string | null
          id: number
          image_url: string | null
          is_family: boolean
          is_finish: boolean
          is_lock: boolean
          is_target: boolean
          name: string
          owner_id: string
          target_points: number
          updated_at: string
        }
        Insert: {
          child_id?: number | null
          created_at?: string
          emoji?: string | null
          id?: number
          image_url?: string | null
          is_family?: boolean
          is_finish?: boolean
          is_lock?: boolean
          is_target?: boolean
          name: string
          owner_id: string
          target_points: number
          updated_at?: string
        }
        Update: {
          child_id?: number | null
          created_at?: string
          emoji?: string | null
          id?: number
          image_url?: string | null
          is_family?: boolean
          is_finish?: boolean
          is_lock?: boolean
          is_target?: boolean
          name?: string
          owner_id?: string
          target_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_child_summary"
            referencedColumns: ["child_id"]
          },
        ]
      }
    }
    Views: {
      v_child_summary: {
        Row: {
          active_task_count: number | null
          child_id: number | null
          completed_today_count: number | null
          level: number | null
          name: string | null
          pending_audit_count: number | null
          slug: string | null
          theme_color: string | null
          theme_key: string | null
          total_points: number | null
        }
        Insert: {
          active_task_count?: never
          child_id?: number | null
          completed_today_count?: never
          level?: number | null
          name?: string | null
          pending_audit_count?: number | null
          slug?: string | null
          theme_color?: string | null
          theme_key?: string | null
          total_points?: number | null
        }
        Update: {
          active_task_count?: never
          child_id?: number | null
          completed_today_count?: never
          level?: number | null
          name?: string | null
          pending_audit_count?: never
          slug?: string | null
          theme_color?: string | null
          theme_key?: string | null
          total_points?: number | null
        }
        Relationships: []
      }
      v_dashboard_stats: {
        Row: {
          completed_today: number | null
          pending_review: number | null
          pending_wishes: number | null
          total_points: number | null
        }
        Relationships: []
      }
      v_wish_progress: {
        Row: {
          child_id: number | null
          child_name: string | null
          is_finish: boolean | null
          is_lock: boolean | null
          name: string | null
          progress_percent: number | null
          target_points: number | null
          total_points: number | null
          wish_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wishes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "v_child_summary"
            referencedColumns: ["child_id"]
          },
        ]
      }
    }
    Functions: {
      adjust_points: {
        Args: {
          p_child_id: number
          p_delta: number
          p_reason: string
          p_type: string
        }
        Returns: Json
      }
      approve_task: { Args: { p_audit_id: number }; Returns: Json }
      redeem_wish: { Args: { p_share_token: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
  CompositeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] extends {
        CompositeTypeName: infer C
      }
      ? C
      : never
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
