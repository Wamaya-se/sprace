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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      booking_deliveries: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          revision_comment: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          submitted_by: string
          version: number
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_comment?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          submitted_by: string
          version?: number
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_comment?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          submitted_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_deliveries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_deliveries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_deliveries_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          budget: number | null
          business_id: string
          created_at: string
          creator_id: string
          deadline: string | null
          description: string
          id: string
          max_revisions: number
          revision_count: number
          service_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          business_id: string
          created_at?: string
          creator_id: string
          deadline?: string | null
          description: string
          id?: string
          max_revisions?: number
          revision_count?: number
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          business_id?: string
          created_at?: string
          creator_id?: string
          deadline?: string | null
          description?: string
          id?: string
          max_revisions?: number
          revision_count?: number
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string
          contact_email: string | null
          country_code: string | null
          created_at: string
          id: string
          industry: string | null
          org_number: string | null
          org_number_verification: Database["public"]["Enums"]["org_number_verification_status"]
          org_number_verification_note: string | null
          org_number_verified_at: string | null
          org_number_verified_by: string | null
          postal_code: string | null
          profile_id: string
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name: string
          contact_email?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          org_number?: string | null
          org_number_verification?: Database["public"]["Enums"]["org_number_verification_status"]
          org_number_verification_note?: string | null
          org_number_verified_at?: string | null
          org_number_verified_by?: string | null
          postal_code?: string | null
          profile_id: string
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          org_number?: string | null
          org_number_verification?: Database["public"]["Enums"]["org_number_verification_status"]
          org_number_verification_note?: string | null
          org_number_verified_at?: string | null
          org_number_verified_by?: string | null
          postal_code?: string | null
          profile_id?: string
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          last_message_at: string
          participant_one: string
          participant_two: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          participant_one: string
          participant_two: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          participant_one?: string
          participant_two?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_one_fkey"
            columns: ["participant_one"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_participant_two_fkey"
            columns: ["participant_two"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_dac7: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          birth_date: string | null
          city: string | null
          country_code: string | null
          created_at: string
          creator_id: string
          personal_number_encrypted: string | null
          personal_number_last4: string | null
          postal_code: string | null
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          birth_date?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          creator_id: string
          personal_number_encrypted?: string | null
          personal_number_last4?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          birth_date?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          creator_id?: string
          personal_number_encrypted?: string | null
          personal_number_last4?: string | null
          postal_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_dac7_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_markets: {
        Row: {
          creator_id: string
          market_id: string
        }
        Insert: {
          creator_id: string
          market_id: string
        }
        Update: {
          creator_id?: string
          market_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_markets_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_markets_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_specialties: {
        Row: {
          creator_id: string
          specialty_id: string
        }
        Insert: {
          creator_id: string
          specialty_id: string
        }
        Update: {
          creator_id?: string
          specialty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_specialties_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_specialties_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          bio: string | null
          created_at: string
          display_name: string
          followers_count: number | null
          hourly_rate: number | null
          id: string
          instagram_handle: string | null
          portfolio_url: string | null
          profile_id: string
          slug: string | null
          status: Database["public"]["Enums"]["creator_status"]
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          tiktok_handle: string | null
          updated_at: string
          youtube_handle: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          display_name: string
          followers_count?: number | null
          hourly_rate?: number | null
          id?: string
          instagram_handle?: string | null
          portfolio_url?: string | null
          profile_id: string
          slug?: string | null
          status?: Database["public"]["Enums"]["creator_status"]
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          tiktok_handle?: string | null
          updated_at?: string
          youtube_handle?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          display_name?: string
          followers_count?: number | null
          hourly_rate?: number | null
          id?: string
          instagram_handle?: string | null
          portfolio_url?: string | null
          profile_id?: string
          slug?: string | null
          status?: Database["public"]["Enums"]["creator_status"]
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          tiktok_handle?: string | null
          updated_at?: string
          youtube_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_files: {
        Row: {
          created_at: string
          delivery_id: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          delivery_id: string
          file_name: string
          file_size: number
          file_url: string
          id?: string
          mime_type: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          delivery_id?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          mime_type?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_files_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "booking_deliveries"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_note: string | null
          booking_id: string
          created_at: string
          id: string
          opened_by: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          booking_id: string
          created_at?: string
          id?: string
          opened_by: string
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          opened_by?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          code: string
          created_at: string
          flag_emoji: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_system: boolean
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_system?: boolean
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_system?: boolean
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
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
      payments: {
        Row: {
          amount_total: number
          booking_id: string
          captured_at: string | null
          created_at: string
          creator_payout: number
          currency: string
          id: string
          payout_statement_issued_at: string | null
          payout_statement_number: string | null
          platform_fee: number
          receipt_issued_at: string | null
          receipt_number: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          transferred_at: string | null
          updated_at: string
        }
        Insert: {
          amount_total: number
          booking_id: string
          captured_at?: string | null
          created_at?: string
          creator_payout: number
          currency?: string
          id?: string
          payout_statement_issued_at?: string | null
          payout_statement_number?: string | null
          platform_fee: number
          receipt_issued_at?: string | null
          receipt_number?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          transferred_at?: string | null
          updated_at?: string
        }
        Update: {
          amount_total?: number
          booking_id?: string
          captured_at?: string | null
          created_at?: string
          creator_payout?: number
          currency?: string
          id?: string
          payout_statement_issued_at?: string | null
          payout_statement_number?: string | null
          platform_fee?: number
          receipt_issued_at?: string | null
          receipt_number?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          transferred_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      pii_access_log: {
        Row: {
          actor_id: string
          created_at: string
          field: string
          id: string
          reason: string | null
          subject_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          field: string
          id?: string
          reason?: string | null
          subject_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          field?: string
          id?: string
          reason?: string | null
          subject_id?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          email_notifications: boolean
          full_name: string | null
          id: string
          is_suspended: boolean
          preferred_locale: string
          role: Database["public"]["Enums"]["user_role"]
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          tos_accepted_at: string | null
          tos_version: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          email_notifications?: boolean
          full_name?: string | null
          id: string
          is_suspended?: boolean
          preferred_locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          tos_accepted_at?: string | null
          tos_version?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          email_notifications?: boolean
          full_name?: string | null
          id?: string
          is_suspended?: boolean
          preferred_locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          tos_accepted_at?: string | null
          tos_version?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          admin_note: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at: string
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          category: Database["public"]["Enums"]["report_category"]
          created_at?: string
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target_type"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          category?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_creators: {
        Row: {
          business_profile_id: string
          created_at: string
          creator_id: string
          id: string
        }
        Insert: {
          business_profile_id: string
          created_at?: string
          creator_id: string
          id?: string
        }
        Update: {
          business_profile_id?: string
          created_at?: string
          creator_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_creators_business_profile_id_fkey"
            columns: ["business_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_creators_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      service_media: {
        Row: {
          created_at: string
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          media_url: string
          service_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url: string
          service_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url?: string
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_media_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          creator_id: string
          delivery_days: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          delivery_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          delivery_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
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
      _analytics_validate_bucket: {
        Args: { p_bucket: string }
        Returns: string
      }
      assign_payout_statement_number: {
        Args: { p_payment_id: string }
        Returns: string
      }
      assign_receipt_number: { Args: { p_payment_id: string }; Returns: string }
      get_admin_analytics_summary: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          completed_bookings_count: number
          gross_volume_minor: number
          new_businesses_count: number
          new_creators_count: number
          new_users_count: number
          payments_count: number
          payout_volume_minor: number
          platform_fee_minor: number
          prev_completed_bookings_count: number
          prev_gross_volume_minor: number
          prev_new_users_count: number
          prev_platform_fee_minor: number
          refund_volume_minor: number
        }[]
      }
      get_admin_revenue_timeseries: {
        Args: { p_bucket?: string; p_end_date: string; p_start_date: string }
        Returns: {
          bucket_start: string
          gross_volume_minor: number
          payments_count: number
          payout_volume_minor: number
          platform_fee_minor: number
        }[]
      }
      get_admin_top_categories: {
        Args: { p_end_date: string; p_limit?: number; p_start_date: string }
        Returns: {
          bookings_count: number
          completed_bookings_count: number
          gross_volume_minor: number
          name: string
          slug: string
          specialty_id: string
        }[]
      }
      get_admin_user_growth_timeseries: {
        Args: { p_bucket?: string; p_end_date: string; p_start_date: string }
        Returns: {
          bucket_start: string
          business_count: number
          creator_count: number
          total_count: number
        }[]
      }
      get_business_analytics_summary: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          active_bookings_count: number
          bookings_count: number
          completed_count: number
          payments_count: number
          prev_bookings_count: number
          prev_completed_count: number
          prev_payments_count: number
          prev_spending_minor: number
          spending_minor: number
        }[]
      }
      get_business_spending_timeseries: {
        Args: { p_bucket?: string; p_end_date: string; p_start_date: string }
        Returns: {
          bucket_start: string
          payments_count: number
          spending_minor: number
        }[]
      }
      get_business_top_creators: {
        Args: { p_end_date: string; p_limit?: number; p_start_date: string }
        Returns: {
          avatar_url: string
          bookings_count: number
          creator_id: string
          display_name: string
          slug: string
          spending_minor: number
        }[]
      }
      get_creator_analytics_summary: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          avg_rating: number
          bookings_count: number
          completed_count: number
          payouts_count: number
          prev_bookings_count: number
          prev_completed_count: number
          prev_payouts_count: number
          prev_revenue_minor: number
          revenue_minor: number
          review_count: number
        }[]
      }
      get_creator_bookings_by_status: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          count: number
          status: Database["public"]["Enums"]["booking_status"]
        }[]
      }
      get_creator_revenue_timeseries: {
        Args: { p_bucket?: string; p_end_date: string; p_start_date: string }
        Returns: {
          bucket_start: string
          payouts_count: number
          revenue_minor: number
        }[]
      }
      get_user_conversations_with_last_message: {
        Args: never
        Returns: {
          booking_id: string
          id: string
          last_message_at: string
          last_message_content: string
          last_message_created_at: string
          last_message_is_system: boolean
          last_message_sender_id: string
          other_participant_avatar_url: string
          other_participant_full_name: string
          other_participant_id: string
          unread_count: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      mark_messages_read: {
        Args: { p_conversation_id: string }
        Returns: undefined
      }
      public_landing_stats: {
        Args: never
        Returns: {
          active_creators: number
          completed_bookings: number
        }[]
      }
      search_creators: {
        Args: {
          p_blocked_profile_ids?: string[]
          p_limit?: number
          p_market_slugs?: string[]
          p_max_rate?: number
          p_min_rate?: number
          p_offset?: number
          p_q?: string
          p_specialty_slugs?: string[]
        }
        Returns: {
          avatar_url: string
          average_rating: number
          bio: string
          display_name: string
          followers_count: number
          hourly_rate: number
          id: string
          markets: Json
          profile_id: string
          slug: string
          specialties: Json
          total_reviews: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      booking_status:
        | "pending"
        | "awaiting_payment"
        | "accepted"
        | "in_progress"
        | "delivered"
        | "completed"
        | "declined"
        | "cancelled"
        | "disputed"
      creator_status: "draft" | "pending_review" | "active" | "suspended"
      delivery_status: "submitted" | "approved" | "revision_requested"
      dispute_status:
        | "open"
        | "under_review"
        | "resolved_refund"
        | "resolved_release"
        | "resolved_partial"
        | "dismissed"
      media_type: "image" | "video"
      notification_type:
        | "booking_created"
        | "booking_accepted"
        | "booking_declined"
        | "awaiting_payment"
        | "payment_received"
        | "work_started"
        | "deliverables_submitted"
        | "revision_requested"
        | "booking_completed"
        | "booking_cancelled"
        | "review_received"
        | "new_message"
        | "payout_sent"
        | "stripe_onboarding_required"
        | "delivery_submitted"
        | "delivery_approved"
        | "dispute_opened"
        | "dispute_resolved"
        | "report_resolved"
        | "account_suspended"
      org_number_verification_status:
        | "unverified"
        | "pending"
        | "verified"
        | "rejected"
      payment_status:
        | "pending"
        | "captured"
        | "transferred"
        | "refunded"
        | "failed"
      report_category:
        | "spam"
        | "fraud"
        | "harassment"
        | "inappropriate"
        | "other"
      report_status: "pending" | "reviewing" | "resolved" | "dismissed"
      report_target_type: "profile" | "booking"
      user_role: "creator" | "business" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: [
        "pending",
        "awaiting_payment",
        "accepted",
        "in_progress",
        "delivered",
        "completed",
        "declined",
        "cancelled",
        "disputed",
      ],
      creator_status: ["draft", "pending_review", "active", "suspended"],
      delivery_status: ["submitted", "approved", "revision_requested"],
      dispute_status: [
        "open",
        "under_review",
        "resolved_refund",
        "resolved_release",
        "resolved_partial",
        "dismissed",
      ],
      media_type: ["image", "video"],
      notification_type: [
        "booking_created",
        "booking_accepted",
        "booking_declined",
        "awaiting_payment",
        "payment_received",
        "work_started",
        "deliverables_submitted",
        "revision_requested",
        "booking_completed",
        "booking_cancelled",
        "review_received",
        "new_message",
        "payout_sent",
        "stripe_onboarding_required",
        "delivery_submitted",
        "delivery_approved",
        "dispute_opened",
        "dispute_resolved",
        "report_resolved",
        "account_suspended",
      ],
      org_number_verification_status: [
        "unverified",
        "pending",
        "verified",
        "rejected",
      ],
      payment_status: [
        "pending",
        "captured",
        "transferred",
        "refunded",
        "failed",
      ],
      report_category: [
        "spam",
        "fraud",
        "harassment",
        "inappropriate",
        "other",
      ],
      report_status: ["pending", "reviewing", "resolved", "dismissed"],
      report_target_type: ["profile", "booking"],
      user_role: ["creator", "business", "admin"],
    },
  },
} as const
