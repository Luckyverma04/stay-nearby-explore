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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_keywords: string[] | null
          published_at: string | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          published_at?: string | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          published_at?: string | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_analytics: {
        Row: {
          booking_id: string | null
          created_at: string
          event_type: string
          hotel_id: string
          id: string
          metadata: Json | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          event_type: string
          hotel_id: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          event_type?: string
          hotel_id?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_analytics_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_analytics_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_modifications: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          modification_type: string
          new_data: Json
          old_data: Json
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          modification_type: string
          new_data: Json
          old_data: Json
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          modification_type?: string
          new_data?: Json
          old_data?: Json
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_modifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reminders: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          change_reason: string | null
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          previous_status: string | null
        }
        Insert: {
          booking_id: string
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          previous_status?: string | null
        }
        Update: {
          booking_id?: string
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          previous_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_reference: string
          booking_status: string
          check_in_date: string
          check_out_date: string
          created_at: string
          guest_email: string
          guest_name: string
          guest_phone: string | null
          guests: number
          hotel_id: string
          id: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          rooms: number
          special_requests: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_reference?: string
          booking_status?: string
          check_in_date: string
          check_out_date: string
          created_at?: string
          guest_email: string
          guest_name: string
          guest_phone?: string | null
          guests?: number
          hotel_id: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          rooms?: number
          special_requests?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_reference?: string
          booking_status?: string
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string | null
          guests?: number
          hotel_id?: string
          id?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          rooms?: number
          special_requests?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          order_index: number | null
          question: string
          status: string | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          order_index?: number | null
          question: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          order_index?: number | null
          question?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      group_bookings: {
        Row: {
          admin_notes: string | null
          booking_type: string
          check_in_date: string
          check_out_date: string
          created_at: string
          estimated_budget: number | null
          group_name: string
          group_size: number
          hotel_id: string
          id: string
          organizer_id: string
          rooms_required: number
          special_requirements: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          booking_type: string
          check_in_date: string
          check_out_date: string
          created_at?: string
          estimated_budget?: number | null
          group_name: string
          group_size: number
          hotel_id: string
          id?: string
          organizer_id: string
          rooms_required: number
          special_requirements?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          booking_type?: string
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          estimated_budget?: number | null
          group_name?: string
          group_size?: number
          hotel_id?: string
          id?: string
          organizer_id?: string
          rooms_required?: number
          special_requirements?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotel_amenities: {
        Row: {
          additional_cost: number | null
          amenity_name: string
          amenity_type: string
          created_at: string
          description: string | null
          hotel_id: string
          id: string
          is_free: boolean | null
        }
        Insert: {
          additional_cost?: number | null
          amenity_name: string
          amenity_type: string
          created_at?: string
          description?: string | null
          hotel_id: string
          id?: string
          is_free?: boolean | null
        }
        Update: {
          additional_cost?: number | null
          amenity_name?: string
          amenity_type?: string
          created_at?: string
          description?: string | null
          hotel_id?: string
          id?: string
          is_free?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "hotel_amenities_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotel_availability: {
        Row: {
          available_rooms: number
          base_price: number | null
          created_at: string
          date: string
          hotel_id: string
          id: string
          max_rooms: number
          surge_multiplier: number | null
          updated_at: string
        }
        Insert: {
          available_rooms?: number
          base_price?: number | null
          created_at?: string
          date: string
          hotel_id: string
          id?: string
          max_rooms?: number
          surge_multiplier?: number | null
          updated_at?: string
        }
        Update: {
          available_rooms?: number
          base_price?: number | null
          created_at?: string
          date?: string
          hotel_id?: string
          id?: string
          max_rooms?: number
          surge_multiplier?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_availability_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string
          amenities: string[] | null
          city: string
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          postal_code: string | null
          price_per_night: number | null
          star_rating: number | null
          state: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          city: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          postal_code?: string | null
          price_per_night?: number | null
          star_rating?: number | null
          state: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          city?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          price_per_night?: number | null
          star_rating?: number | null
          state?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          due_date: string
          generated_at: string
          id: string
          invoice_data: Json
          invoice_number: string
          paid_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          due_date: string
          generated_at?: string
          id?: string
          invoice_data: Json
          invoice_number: string
          paid_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          due_date?: string
          generated_at?: string
          id?: string
          invoice_data?: Json
          invoice_number?: string
          paid_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      local_services: {
        Row: {
          contact_info: Json | null
          created_at: string
          description: string | null
          distance_from_hotel: number | null
          hotel_id: string
          id: string
          is_partner: boolean
          pricing_info: Json | null
          rating: number | null
          service_name: string
          service_type: string
          updated_at: string
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string
          description?: string | null
          distance_from_hotel?: number | null
          hotel_id: string
          id?: string
          is_partner?: boolean
          pricing_info?: Json | null
          rating?: number | null
          service_name: string
          service_type: string
          updated_at?: string
        }
        Update: {
          contact_info?: Json | null
          created_at?: string
          description?: string | null
          distance_from_hotel?: number | null
          hotel_id?: string
          id?: string
          is_partner?: boolean
          pricing_info?: Json | null
          rating?: number | null
          service_name?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          booking_id: string | null
          created_at: string
          description: string
          id: string
          points: number
          points_type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          description: string
          id?: string
          points?: number
          points_type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          points?: number
          points_type?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_url: string | null
          booking_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          message_type: string
          sender_id: string
          sender_type: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          booking_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          message_type?: string
          sender_id: string
          sender_type: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          message_type?: string
          sender_id?: string
          sender_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          status: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          status?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          status?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_analytics: {
        Row: {
          created_at: string
          currency: string
          date: string
          failed_payments: number
          id: string
          payment_methods: Json
          refunded_amount: number
          successful_payments: number
          total_revenue: number
          total_transactions: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          date: string
          failed_payments?: number
          id?: string
          payment_methods?: Json
          refunded_amount?: number
          successful_payments?: number
          total_revenue?: number
          total_transactions?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          date?: string
          failed_payments?: number
          id?: string
          payment_methods?: Json
          refunded_amount?: number
          successful_payments?: number
          total_revenue?: number
          total_transactions?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          payment_provider: string
          provider_response: Json | null
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          payment_provider: string
          provider_response?: Json | null
          status: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          payment_provider?: string
          provider_response?: Json | null
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          scheduled_for: string | null
          sent_at: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          payment_log_id: string | null
          processed_at: string | null
          processed_by: string | null
          refund_amount: number
          refund_reason: string
          refund_reference: string | null
          requested_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          payment_log_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          refund_amount: number
          refund_reason: string
          refund_reference?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          payment_log_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          refund_amount?: number
          refund_reason?: string
          refund_reference?: string | null
          requested_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          helpful_count: number | null
          hotel_id: string
          id: string
          rating: number
          room_type: string | null
          status: string
          stay_date: string | null
          title: string | null
          updated_at: string
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          hotel_id: string
          id?: string
          rating: number
          room_type?: string | null
          status?: string
          stay_date?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          hotel_id?: string
          id?: string
          rating?: number
          room_type?: string | null
          status?: string
          stay_date?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          would_recommend?: boolean | null
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
            foreignKeyName: "reviews_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          company: string | null
          content: string
          created_at: string
          featured: boolean | null
          id: string
          name: string
          position: string | null
          rating: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          content: string
          created_at?: string
          featured?: boolean | null
          id?: string
          name: string
          position?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          content?: string
          created_at?: string
          featured?: boolean | null
          id?: string
          name?: string
          position?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_loyalty_summary: {
        Row: {
          created_at: string
          id: string
          tier_level: string
          total_bookings: number
          total_points: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tier_level?: string
          total_bookings?: number
          total_points?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tier_level?: string
          total_bookings?: number
          total_points?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_payment_methods: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          masked_details: Json
          payment_type: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          masked_details: Json
          payment_type: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          masked_details?: Json
          payment_type?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accessibility_needs: string[] | null
          created_at: string
          dietary_restrictions: string[] | null
          id: string
          notification_preferences: Json | null
          preferred_currency: string | null
          preferred_language: string | null
          travel_preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessibility_needs?: string[] | null
          created_at?: string
          dietary_restrictions?: string[] | null
          id?: string
          notification_preferences?: Json | null
          preferred_currency?: string | null
          preferred_language?: string | null
          travel_preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accessibility_needs?: string[] | null
          created_at?: string
          dietary_restrictions?: string[] | null
          id?: string
          notification_preferences?: Json | null
          preferred_currency?: string | null
          preferred_language?: string | null
          travel_preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_booking_total: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_hotel_id: string
          p_rooms?: number
        }
        Returns: number
      }
      calculate_dynamic_price: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_hotel_id: string
          p_rooms?: number
        }
        Returns: number
      }
      check_hotel_availability: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_hotel_id: string
          p_rooms?: number
        }
        Returns: boolean
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      track_booking_event: {
        Args: {
          p_booking_id?: string
          p_event_type: string
          p_hotel_id: string
          p_metadata?: Json
          p_session_id?: string
          p_user_id?: string
        }
        Returns: string
      }
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
    Enums: {},
  },
} as const
