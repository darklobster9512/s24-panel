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
      applications: {
        Row: {
          anstellung: string
          created_at: string
          email: string
          geburtsdatum: string
          handynummer: string
          id: string
          lebenslauf_filename: string | null
          lebenslauf_mime: string | null
          lebenslauf_path: string | null
          nachname: string
          staatsangehoerigkeit: string
          status: string
          updated_at: string
          vorname: string
        }
        Insert: {
          anstellung: string
          created_at?: string
          email: string
          geburtsdatum: string
          handynummer: string
          id?: string
          lebenslauf_filename?: string | null
          lebenslauf_mime?: string | null
          lebenslauf_path?: string | null
          nachname: string
          staatsangehoerigkeit: string
          status?: string
          updated_at?: string
          vorname: string
        }
        Update: {
          anstellung?: string
          created_at?: string
          email?: string
          geburtsdatum?: string
          handynummer?: string
          id?: string
          lebenslauf_filename?: string | null
          lebenslauf_mime?: string | null
          lebenslauf_path?: string | null
          nachname?: string
          staatsangehoerigkeit?: string
          status?: string
          updated_at?: string
          vorname?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          employee_id: string
          id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          employee_id: string
          id?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      call_notes: {
        Row: {
          anliegen: string
          anrufer_email: string | null
          anrufer_name: string | null
          anrufer_nummer: string | null
          client_id: string
          created_at: string
          dauer_sekunden: number
          employee_id: string
          id: string
          kategorie: string | null
          prioritaet: string
          rueckruf_gewuenscht: boolean
          rueckruf_zeit: string | null
          sipgate_call_id: string | null
          updated_at: string
          weitergeleitet_an: string | null
        }
        Insert: {
          anliegen: string
          anrufer_email?: string | null
          anrufer_name?: string | null
          anrufer_nummer?: string | null
          client_id: string
          created_at?: string
          dauer_sekunden?: number
          employee_id: string
          id?: string
          kategorie?: string | null
          prioritaet?: string
          rueckruf_gewuenscht?: boolean
          rueckruf_zeit?: string | null
          sipgate_call_id?: string | null
          updated_at?: string
          weitergeleitet_an?: string | null
        }
        Update: {
          anliegen?: string
          anrufer_email?: string | null
          anrufer_name?: string | null
          anrufer_nummer?: string | null
          client_id?: string
          created_at?: string
          dauer_sekunden?: number
          employee_id?: string
          id?: string
          kategorie?: string | null
          prioritaet?: string
          rueckruf_gewuenscht?: boolean
          rueckruf_zeit?: string | null
          sipgate_call_id?: string | null
          updated_at?: string
          weitergeleitet_an?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_notes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_notes_sipgate_call_id_fkey"
            columns: ["sipgate_call_id"]
            isOneToOne: false
            referencedRelation: "sipgate_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      caller_contacts: {
        Row: {
          caller_email: string | null
          caller_name: string | null
          client_id: string
          created_at: string
          id: string
          last_seen_at: string
          phone_number: string
          updated_at: string
        }
        Insert: {
          caller_email?: string | null
          caller_name?: string | null
          client_id: string
          created_at?: string
          id?: string
          last_seen_at?: string
          phone_number: string
          updated_at?: string
        }
        Update: {
          caller_email?: string | null
          caller_name?: string | null
          client_id?: string
          created_at?: string
          id?: string
          last_seen_at?: string
          phone_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caller_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_phone_numbers: {
        Row: {
          client_id: string
          created_at: string
          id: string
          label: string | null
          phone_number: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          label?: string | null
          phone_number: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          label?: string | null
          phone_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_phone_numbers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string | null
          company_description: string | null
          company_name: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          email: string | null
          forwarding_enabled: boolean
          greeting_text: string | null
          id: string
          industry: string | null
          is_draft: boolean
          logo_url: string | null
          phone: string | null
          postal_code: string | null
          street: string | null
          updated_at: string
          vat_id: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          company_description?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          forwarding_enabled?: boolean
          greeting_text?: string | null
          id?: string
          industry?: string | null
          is_draft?: boolean
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
          vat_id?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          company_description?: string | null
          company_name?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          forwarding_enabled?: boolean
          greeting_text?: string | null
          id?: string
          industry?: string | null
          is_draft?: boolean
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
          vat_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_signature: {
        Row: {
          created_at: string
          id: string
          signature_source: string
          signature_style: string | null
          signature_url: string | null
          signer_name: string
          signer_title: string
          singleton: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          signature_source?: string
          signature_style?: string | null
          signature_url?: string | null
          signer_name?: string
          signer_title?: string
          singleton?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          signature_source?: string
          signature_style?: string | null
          signature_url?: string | null
          signer_name?: string
          signer_title?: string
          singleton?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          category: string | null
          content_html: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          monthly_salary: number
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category?: string | null
          content_html?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          monthly_salary?: number
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string | null
          content_html?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          monthly_salary?: number
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      employee_contracts: {
        Row: {
          admin_confirmed_at: string | null
          admin_confirmed_by: string | null
          created_at: string
          employee_id: string
          employee_signature_data_url: string | null
          id: string
          pdf_path: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["employee_contract_status"]
          template_id: string
          updated_at: string
        }
        Insert: {
          admin_confirmed_at?: string | null
          admin_confirmed_by?: string | null
          created_at?: string
          employee_id: string
          employee_signature_data_url?: string | null
          id?: string
          pdf_path?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["employee_contract_status"]
          template_id: string
          updated_at?: string
        }
        Update: {
          admin_confirmed_at?: string | null
          admin_confirmed_by?: string | null
          created_at?: string
          employee_id?: string
          employee_signature_data_url?: string | null
          id?: string
          pdf_path?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["employee_contract_status"]
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          bank_name: string | null
          bic: string | null
          birth_date: string | null
          birth_place: string | null
          contract_type: string | null
          created_at: string
          created_by: string
          first_name: string | null
          health_insurance: string | null
          iban: string | null
          id: string
          is_draft: boolean
          last_name: string | null
          login_email: string | null
          login_local_part: string | null
          marital_status: string | null
          nationality: string | null
          password_plain: string | null
          personal_email: string | null
          personal_phone: string | null
          salary: number | null
          sipgate_user_id: string | null
          social_security_number: string | null
          start_date: string | null
          tax_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bank_name?: string | null
          bic?: string | null
          birth_date?: string | null
          birth_place?: string | null
          contract_type?: string | null
          created_at?: string
          created_by: string
          first_name?: string | null
          health_insurance?: string | null
          iban?: string | null
          id?: string
          is_draft?: boolean
          last_name?: string | null
          login_email?: string | null
          login_local_part?: string | null
          marital_status?: string | null
          nationality?: string | null
          password_plain?: string | null
          personal_email?: string | null
          personal_phone?: string | null
          salary?: number | null
          sipgate_user_id?: string | null
          social_security_number?: string | null
          start_date?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bank_name?: string | null
          bic?: string | null
          birth_date?: string | null
          birth_place?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string
          first_name?: string | null
          health_insurance?: string | null
          iban?: string | null
          id?: string
          is_draft?: boolean
          last_name?: string | null
          login_email?: string | null
          login_local_part?: string | null
          marital_status?: string | null
          nationality?: string | null
          password_plain?: string | null
          personal_email?: string | null
          personal_phone?: string | null
          salary?: number | null
          sipgate_user_id?: string | null
          social_security_number?: string | null
          start_date?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sipgate_calls: {
        Row: {
          answered_at: string | null
          answered_by_employee_id: string | null
          caller_name: string | null
          client_id: string | null
          created_at: string
          direction: string
          ended_at: string | null
          from_number: string | null
          handled_by_employee_id: string | null
          id: string
          raw_payload: Json | null
          sipgate_call_id: string
          started_at: string
          status: string
          to_number: string | null
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          answered_by_employee_id?: string | null
          caller_name?: string | null
          client_id?: string | null
          created_at?: string
          direction: string
          ended_at?: string | null
          from_number?: string | null
          handled_by_employee_id?: string | null
          id?: string
          raw_payload?: Json | null
          sipgate_call_id: string
          started_at?: string
          status?: string
          to_number?: string | null
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          answered_by_employee_id?: string | null
          caller_name?: string | null
          client_id?: string | null
          created_at?: string
          direction?: string
          ended_at?: string | null
          from_number?: string | null
          handled_by_employee_id?: string | null
          id?: string
          raw_payload?: Json | null
          sipgate_call_id?: string
          started_at?: string
          status?: string
          to_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sipgate_calls_answered_by_employee_id_fkey"
            columns: ["answered_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sipgate_calls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sipgate_calls_handled_by_employee_id_fkey"
            columns: ["handled_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
      is_client_assigned_to_me: {
        Args: { _client_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "superadmin" | "kunde" | "mitarbeiter"
      employee_contract_status:
        | "pending_employee"
        | "pending_admin"
        | "completed"
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
      app_role: ["superadmin", "kunde", "mitarbeiter"],
      employee_contract_status: [
        "pending_employee",
        "pending_admin",
        "completed",
      ],
    },
  },
} as const
