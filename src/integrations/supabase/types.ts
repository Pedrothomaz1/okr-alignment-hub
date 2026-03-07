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
      activity_comments: {
        Row: {
          audit_log_id: string
          author_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          audit_log_id: string
          author_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          audit_log_id?: string
          author_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_comments_audit_log_id_fkey"
            columns: ["audit_log_id"]
            isOneToOne: false
            referencedRelation: "audit_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      change_requests: {
        Row: {
          created_at: string
          cycle_id: string
          decision_at: string | null
          decision_by: string | null
          decision_comment: string | null
          description: string
          expires_at: string | null
          id: string
          objective_id: string | null
          request_type: string
          requested_by: string
          status: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          decision_at?: string | null
          decision_by?: string | null
          decision_comment?: string | null
          description: string
          expires_at?: string | null
          id?: string
          objective_id?: string | null
          request_type: string
          requested_by: string
          status?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_comment?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          objective_id?: string | null
          request_type?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_requests: {
        Row: {
          approver_id: string | null
          comment: string | null
          created_at: string
          cycle_id: string
          decision_at: string | null
          decision_by: string | null
          id: string
          requested_by: string
          status: string
        }
        Insert: {
          approver_id?: string | null
          comment?: string | null
          created_at?: string
          cycle_id: string
          decision_at?: string | null
          decision_by?: string | null
          id?: string
          requested_by: string
          status?: string
        }
        Update: {
          approver_id?: string | null
          comment?: string | null
          created_at?: string
          cycle_id?: string
          decision_at?: string | null
          decision_by?: string | null
          id?: string
          requested_by?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_requests_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_rules_history: {
        Row: {
          changed_by: string
          created_at: string
          cycle_id: string
          id: string
          rule_changes: Json
        }
        Insert: {
          changed_by: string
          created_at?: string
          cycle_id: string
          id?: string
          rule_changes?: Json
        }
        Update: {
          changed_by?: string
          created_at?: string
          cycle_id?: string
          id?: string
          rule_changes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cycle_rules_history_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      cycles: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          locked: boolean
          metadata: Json | null
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          locked?: boolean
          metadata?: Json | null
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          locked?: boolean
          metadata?: Json | null
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_reactions: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          created_at: string
          current_value: number
          description: string | null
          id: string
          kr_type: string
          metadata: Json | null
          objective_id: string
          owner_id: string
          start_value: number
          status: string
          target_value: number
          title: string
          unit: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          current_value?: number
          description?: string | null
          id?: string
          kr_type?: string
          metadata?: Json | null
          objective_id: string
          owner_id: string
          start_value?: number
          status?: string
          target_value?: number
          title: string
          unit?: string | null
          updated_at?: string
          weight?: number
        }
        Update: {
          created_at?: string
          current_value?: number
          description?: string | null
          id?: string
          kr_type?: string
          metadata?: Json | null
          objective_id?: string
          owner_id?: string
          start_value?: number
          status?: string
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kr_checkins: {
        Row: {
          author_id: string
          confidence: string | null
          created_at: string
          difficulties: string | null
          id: string
          key_result_id: string
          note: string | null
          value: number
        }
        Insert: {
          author_id: string
          confidence?: string | null
          created_at?: string
          difficulties?: string | null
          id?: string
          key_result_id: string
          note?: string | null
          value: number
        }
        Update: {
          author_id?: string
          confidence?: string | null
          created_at?: string
          difficulties?: string | null
          id?: string
          key_result_id?: string
          note?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kr_checkins_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kr_checkins_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "key_results"
            referencedColumns: ["id"]
          },
        ]
      }
      kudos: {
        Row: {
          category: string
          created_at: string
          from_user_id: string
          id: string
          message: string
          objective_id: string | null
          to_user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          from_user_id: string
          id?: string
          message: string
          objective_id?: string | null
          to_user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          from_user_id?: string
          id?: string
          message?: string
          objective_id?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kudos_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      objectives: {
        Row: {
          created_at: string
          cycle_id: string
          description: string | null
          id: string
          metadata: Json | null
          objective_type: string
          owner_id: string
          parent_objective_id: string | null
          progress: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          description?: string | null
          id?: string
          metadata?: Json | null
          objective_type?: string
          owner_id: string
          parent_objective_id?: string | null
          progress?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          objective_type?: string
          owner_id?: string
          parent_objective_id?: string | null
          progress?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectives_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objectives_parent_objective_id_fkey"
            columns: ["parent_objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_collaborators: {
        Row: {
          created_at: string
          id: string
          objective_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          objective_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          objective_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "okr_collaborators_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okr_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_links: {
        Row: {
          created_at: string
          created_by: string
          from_id: string
          id: string
          link_type: string
          to_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          from_id: string
          id?: string
          link_type?: string
          to_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          from_id?: string
          id?: string
          link_type?: string
          to_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          archived: boolean
          avatar_url: string | null
          birth_date: string | null
          config_panel_access: boolean | null
          cpf: string | null
          created_at: string
          department: string | null
          eligible_for_bonus: boolean | null
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          language: string | null
          management: string | null
          manager_id: string | null
          metadata: Json | null
          receive_feedback_emails: boolean | null
          status: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean
          avatar_url?: string | null
          birth_date?: string | null
          config_panel_access?: boolean | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          eligible_for_bonus?: boolean | null
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          language?: string | null
          management?: string | null
          manager_id?: string | null
          metadata?: Json | null
          receive_feedback_emails?: boolean | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean
          avatar_url?: string | null
          birth_date?: string | null
          config_panel_access?: boolean | null
          cpf?: string | null
          created_at?: string
          department?: string | null
          eligible_for_bonus?: boolean | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          language?: string | null
          management?: string | null
          manager_id?: string | null
          metadata?: Json | null
          receive_feedback_emails?: boolean | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pulse_surveys: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          score: number
          user_id: string
          week_start: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          score: number
          user_id: string
          week_start: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          score?: number
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "pulse_surveys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
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
      weekly_ppp: {
        Row: {
          created_at: string
          id: string
          plans: string
          problems: string
          progress: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          plans: string
          problems: string
          progress: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          plans?: string
          problems?: string
          progress?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_ppp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decide_change_request: {
        Args: { _comment?: string; _decision: string; _request_id: string }
        Returns: Json
      }
      decide_cycle_request: {
        Args: {
          _approver_id?: string
          _comment?: string
          _decision: string
          _request_id: string
        }
        Returns: Json
      }
      get_objective_ancestors: {
        Args: { _objective_id: string }
        Returns: {
          created_at: string
          cycle_id: string
          description: string | null
          id: string
          metadata: Json | null
          objective_type: string
          owner_id: string
          parent_objective_id: string | null
          progress: number
          status: string
          title: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "objectives"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "okr_master" | "manager" | "member"
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
      app_role: ["admin", "okr_master", "manager", "member"],
    },
  },
} as const
