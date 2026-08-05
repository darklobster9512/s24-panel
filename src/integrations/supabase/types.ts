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
      activity_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          accent_color: string | null
          application_email_body: string | null
          application_email_enabled: boolean
          application_email_subject: string | null
          company_address: string | null
          company_name: string | null
          confirmation_email_body: string | null
          confirmation_email_enabled: boolean
          confirmation_email_subject: string | null
          created_at: string
          id: string
          interview_available_weekdays: number[]
          interview_email_body: string | null
          interview_email_enabled: boolean
          interview_email_subject: string | null
          interview_slot_end: string
          interview_slot_interval_minutes: number
          interview_slot_start: string
          logo_text: string | null
          resend_api_key: string | null
          resend_from_email: string | null
          resend_from_name: string | null
          singleton: boolean
          updated_at: string
          vat_id: string | null
          welcome_email_body: string | null
          welcome_email_enabled: boolean
          welcome_email_subject: string | null
        }
        Insert: {
          accent_color?: string | null
          application_email_body?: string | null
          application_email_enabled?: boolean
          application_email_subject?: string | null
          company_address?: string | null
          company_name?: string | null
          confirmation_email_body?: string | null
          confirmation_email_enabled?: boolean
          confirmation_email_subject?: string | null
          created_at?: string
          id?: string
          interview_available_weekdays?: number[]
          interview_email_body?: string | null
          interview_email_enabled?: boolean
          interview_email_subject?: string | null
          interview_slot_end?: string
          interview_slot_interval_minutes?: number
          interview_slot_start?: string
          logo_text?: string | null
          resend_api_key?: string | null
          resend_from_email?: string | null
          resend_from_name?: string | null
          singleton?: boolean
          updated_at?: string
          vat_id?: string | null
          welcome_email_body?: string | null
          welcome_email_enabled?: boolean
          welcome_email_subject?: string | null
        }
        Update: {
          accent_color?: string | null
          application_email_body?: string | null
          application_email_enabled?: boolean
          application_email_subject?: string | null
          company_address?: string | null
          company_name?: string | null
          confirmation_email_body?: string | null
          confirmation_email_enabled?: boolean
          confirmation_email_subject?: string | null
          created_at?: string
          id?: string
          interview_available_weekdays?: number[]
          interview_email_body?: string | null
          interview_email_enabled?: boolean
          interview_email_subject?: string | null
          interview_slot_end?: string
          interview_slot_interval_minutes?: number
          interview_slot_start?: string
          logo_text?: string | null
          resend_api_key?: string | null
          resend_from_email?: string | null
          resend_from_name?: string | null
          singleton?: boolean
          updated_at?: string
          vat_id?: string | null
          welcome_email_body?: string | null
          welcome_email_enabled?: boolean
          welcome_email_subject?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          anstellung: string
          booking_token: string | null
          created_at: string
          email: string
          geburtsdatum: string
          handynummer: string
          id: string
          lebenslauf_filename: string | null
          lebenslauf_mime: string | null
          lebenslauf_path: string | null
          nachname: string
          ranking: string | null
          staatsangehoerigkeit: string
          status: string
          stelle: string | null
          updated_at: string
          vorname: string
        }
        Insert: {
          anstellung: string
          booking_token?: string | null
          created_at?: string
          email: string
          geburtsdatum: string
          handynummer: string
          id?: string
          lebenslauf_filename?: string | null
          lebenslauf_mime?: string | null
          lebenslauf_path?: string | null
          nachname: string
          ranking?: string | null
          staatsangehoerigkeit: string
          status?: string
          stelle?: string | null
          updated_at?: string
          vorname: string
        }
        Update: {
          anstellung?: string
          booking_token?: string | null
          created_at?: string
          email?: string
          geburtsdatum?: string
          handynummer?: string
          id?: string
          lebenslauf_filename?: string | null
          lebenslauf_mime?: string | null
          lebenslauf_path?: string | null
          nachname?: string
          ranking?: string | null
          staatsangehoerigkeit?: string
          status?: string
          stelle?: string | null
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
      chat_agent_settings: {
        Row: {
          auto_offline: boolean
          created_at: string
          display_name: string
          id: string
          offline_after: string
          online_from: string
          singleton: boolean
          status: string
          updated_at: string
        }
        Insert: {
          auto_offline?: boolean
          created_at?: string
          display_name?: string
          id?: string
          offline_after?: string
          online_from?: string
          singleton?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          auto_offline?: boolean
          created_at?: string
          display_name?: string
          id?: string
          offline_after?: string
          online_from?: string
          singleton?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          employee_active_at: string | null
          employee_id: string
          id: string
          last_message_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_active_at?: string | null
          employee_id: string
          id?: string
          last_message_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_active_at?: string | null
          employee_id?: string
          id?: string
          last_message_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          read: boolean
          read_at: string | null
          sender_role: string
          sender_user_id: string | null
          sent_as_superadmin: boolean
          updated_at: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          read?: boolean
          read_at?: string | null
          sender_role: string
          sender_user_id?: string | null
          sent_as_superadmin?: boolean
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          read?: boolean
          read_at?: string | null
          sender_role?: string
          sender_user_id?: string | null
          sent_as_superadmin?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
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
          call_script_company_name: string | null
          call_script_content: string | null
          call_script_my_name: string | null
          call_script_path: string | null
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
          is_recruitment: boolean
          logo_url: string | null
          phone: string | null
          postal_code: string | null
          street: string | null
          updated_at: string
          vat_id: string | null
          website: string | null
        }
        Insert: {
          call_script_company_name?: string | null
          call_script_content?: string | null
          call_script_my_name?: string | null
          call_script_path?: string | null
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
          is_recruitment?: boolean
          logo_url?: string | null
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string
          vat_id?: string | null
          website?: string | null
        }
        Update: {
          call_script_company_name?: string | null
          call_script_content?: string | null
          call_script_my_name?: string | null
          call_script_path?: string | null
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
          is_recruitment?: boolean
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
          caller_api_key: string | null
          city: string | null
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
          onboarding_enabled: boolean
          outbound_recruitment: boolean
          password_plain: string | null
          personal_email: string | null
          personal_phone: string | null
          phone_system: string | null
          postal_code: string | null
          salary: number | null
          sipgate_user_id: string | null
          social_security_number: string | null
          softphone_email: string | null
          softphone_password: string | null
          start_date: string | null
          street: string | null
          tax_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bank_name?: string | null
          bic?: string | null
          birth_date?: string | null
          birth_place?: string | null
          caller_api_key?: string | null
          city?: string | null
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
          onboarding_enabled?: boolean
          outbound_recruitment?: boolean
          password_plain?: string | null
          personal_email?: string | null
          personal_phone?: string | null
          phone_system?: string | null
          postal_code?: string | null
          salary?: number | null
          sipgate_user_id?: string | null
          social_security_number?: string | null
          softphone_email?: string | null
          softphone_password?: string | null
          start_date?: string | null
          street?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bank_name?: string | null
          bic?: string | null
          birth_date?: string | null
          birth_place?: string | null
          caller_api_key?: string | null
          city?: string | null
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
          onboarding_enabled?: boolean
          outbound_recruitment?: boolean
          password_plain?: string | null
          personal_email?: string | null
          personal_phone?: string | null
          phone_system?: string | null
          postal_code?: string | null
          salary?: number | null
          sipgate_user_id?: string | null
          social_security_number?: string | null
          softphone_email?: string | null
          softphone_password?: string | null
          start_date?: string | null
          street?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      interview_appointments: {
        Row: {
          application_id: string
          appointment_date: string
          appointment_time: string
          booked_at: string
          created_at: string
          id: string
          notes: string | null
          reminder_sent_at: string | null
          start_asap: boolean
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          appointment_date: string
          appointment_time: string
          booked_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          reminder_sent_at?: string | null
          start_asap?: boolean
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          appointment_date?: string
          appointment_time?: string
          booked_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          reminder_sent_at?: string | null
          start_asap?: boolean
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_appointments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_blocked_slots: {
        Row: {
          blocked_date: string
          blocked_time: string
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          blocked_time: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          blocked_time?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      managers: {
        Row: {
          created_at: string
          created_by: string
          display_name: string | null
          email: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          display_name?: string | null
          email: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
          user_id?: string
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
      telegram_recipients: {
        Row: {
          chat_id: string
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          notify_applications: boolean
          notify_contracts: boolean
          notify_interviews: boolean
          notify_notes: boolean
          updated_at: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          notify_applications?: boolean
          notify_contracts?: boolean
          notify_interviews?: boolean
          notify_notes?: boolean
          updated_at?: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          notify_applications?: boolean
          notify_contracts?: boolean
          notify_interviews?: boolean
          notify_notes?: boolean
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
      book_interview_slot: {
        Args: { _date: string; _time: string; _token: string }
        Returns: string
      }
      get_interview_by_token: {
        Args: { _token: string }
        Returns: {
          application_id: string
          appointment_date: string
          appointment_time: string
          nachname: string
          status: string
          vorname: string
        }[]
      }
      get_interview_slot_config: {
        Args: never
        Returns: {
          accent_color: string
          company_name: string
          interval_minutes: number
          logo_text: string
          slot_end: string
          slot_start: string
          weekdays: number[]
        }[]
      }
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
      is_my_conversation: {
        Args: { _conversation_id: string }
        Returns: boolean
      }
      is_my_employee_row: { Args: { _employee_id: string }; Returns: boolean }
      list_booked_interview_slots: {
        Args: never
        Returns: {
          appointment_date: string
          appointment_time: string
        }[]
      }
    }
    Enums: {
      app_role: "superadmin" | "kunde" | "mitarbeiter" | "manager"
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
      app_role: ["superadmin", "kunde", "mitarbeiter", "manager"],
      employee_contract_status: [
        "pending_employee",
        "pending_admin",
        "completed",
      ],
    },
  },
} as const
