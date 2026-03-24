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
      abandoned_carts: {
        Row: {
          cart_items: Json
          cart_total: number
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          district: string | null
          division: string | null
          id: string
          ip_address: string | null
          notes: string | null
          recovered_at: string | null
          recovered_order_id: string | null
          recovery_sent: boolean
          recovery_sent_at: string | null
          referrer_url: string | null
          session_id: string | null
          shipping_address: string | null
          source: string | null
          status: string
          upazila: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          cart_items?: Json
          cart_total?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          district?: string | null
          division?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          recovered_at?: string | null
          recovered_order_id?: string | null
          recovery_sent?: boolean
          recovery_sent_at?: string | null
          referrer_url?: string | null
          session_id?: string | null
          shipping_address?: string | null
          source?: string | null
          status?: string
          upazila?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          cart_items?: Json
          cart_total?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          district?: string | null
          division?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          recovered_at?: string | null
          recovered_order_id?: string | null
          recovery_sent?: boolean
          recovery_sent_at?: string | null
          referrer_url?: string | null
          session_id?: string | null
          shipping_address?: string | null
          source?: string | null
          status?: string
          upazila?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      ad_settings: {
        Row: {
          ad_client_id: string | null
          between_modules_ad_enabled: boolean | null
          between_modules_ad_slot: string | null
          created_at: string
          footer_ad_enabled: boolean | null
          footer_ad_slot: string | null
          header_ad_enabled: boolean | null
          header_ad_slot: string | null
          id: string
          in_article_ad_enabled: boolean | null
          in_article_ad_slot: string | null
          sidebar_ad_enabled: boolean | null
          sidebar_ad_slot: string | null
          updated_at: string
        }
        Insert: {
          ad_client_id?: string | null
          between_modules_ad_enabled?: boolean | null
          between_modules_ad_slot?: string | null
          created_at?: string
          footer_ad_enabled?: boolean | null
          footer_ad_slot?: string | null
          header_ad_enabled?: boolean | null
          header_ad_slot?: string | null
          id?: string
          in_article_ad_enabled?: boolean | null
          in_article_ad_slot?: string | null
          sidebar_ad_enabled?: boolean | null
          sidebar_ad_slot?: string | null
          updated_at?: string
        }
        Update: {
          ad_client_id?: string | null
          between_modules_ad_enabled?: boolean | null
          between_modules_ad_slot?: string | null
          created_at?: string
          footer_ad_enabled?: boolean | null
          footer_ad_slot?: string | null
          header_ad_enabled?: boolean | null
          header_ad_slot?: string | null
          id?: string
          in_article_ad_enabled?: boolean | null
          in_article_ad_slot?: string | null
          sidebar_ad_enabled?: boolean | null
          sidebar_ad_slot?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      alert_logs: {
        Row: {
          alert_id: string
          created_at: string
          error_message: string | null
          id: string
          sent_at: string
          sent_channel: string
          status: string
          user_id: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          sent_channel?: string
          status?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          sent_channel?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_logs_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "farming_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_settings: {
        Row: {
          channels: string[] | null
          created_at: string
          feed_reminder_enabled: boolean | null
          feed_reminder_times: string[] | null
          harvest_reminder_days_before: number | null
          id: string
          medicine_reminder_enabled: boolean | null
          sampling_interval_days: number | null
          sampling_reminder_enabled: boolean | null
          updated_at: string
          user_id: string
          water_check_enabled: boolean | null
          water_check_interval_days: number | null
        }
        Insert: {
          channels?: string[] | null
          created_at?: string
          feed_reminder_enabled?: boolean | null
          feed_reminder_times?: string[] | null
          harvest_reminder_days_before?: number | null
          id?: string
          medicine_reminder_enabled?: boolean | null
          sampling_interval_days?: number | null
          sampling_reminder_enabled?: boolean | null
          updated_at?: string
          user_id: string
          water_check_enabled?: boolean | null
          water_check_interval_days?: number | null
        }
        Update: {
          channels?: string[] | null
          created_at?: string
          feed_reminder_enabled?: boolean | null
          feed_reminder_times?: string[] | null
          harvest_reminder_days_before?: number | null
          id?: string
          medicine_reminder_enabled?: boolean | null
          sampling_interval_days?: number | null
          sampling_reminder_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          water_check_enabled?: boolean | null
          water_check_interval_days?: number | null
        }
        Relationships: []
      }
      backup_logs: {
        Row: {
          backup_scope: string
          backup_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          file_name: string | null
          file_size: number | null
          google_drive_file_id: string | null
          google_drive_url: string | null
          id: string
          restore_status: string | null
          restored_at: string | null
          started_at: string
          status: string
          tables_included: string[] | null
          user_id: string | null
        }
        Insert: {
          backup_scope?: string
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          google_drive_file_id?: string | null
          google_drive_url?: string | null
          id?: string
          restore_status?: string | null
          restored_at?: string | null
          started_at?: string
          status?: string
          tables_included?: string[] | null
          user_id?: string | null
        }
        Update: {
          backup_scope?: string
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_name?: string | null
          file_size?: number | null
          google_drive_file_id?: string | null
          google_drive_url?: string | null
          id?: string
          restore_status?: string | null
          restored_at?: string | null
          started_at?: string
          status?: string
          tables_included?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_comment_votes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_comments: {
        Row: {
          author_name: string
          author_role: string | null
          comment_text: string
          created_at: string
          helpful_count: number | null
          id: string
          image_url: string | null
          parent_id: string | null
          post_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_name: string
          author_role?: string | null
          comment_text: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          image_url?: string | null
          parent_id?: string | null
          post_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_name?: string
          author_role?: string | null
          comment_text?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          image_url?: string | null
          parent_id?: string | null
          post_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          post_id: string
          thumbnail_url: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          post_id: string
          thumbnail_url?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          post_id?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string | null
          author_role: string | null
          category: string
          comment_count: number | null
          content: string | null
          created_at: string
          id: string
          is_comments_locked: boolean | null
          is_pinned: boolean | null
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
          view_count: number | null
        }
        Insert: {
          author_name?: string | null
          author_role?: string | null
          category?: string
          comment_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_comments_locked?: boolean | null
          is_pinned?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
        }
        Update: {
          author_name?: string | null
          author_role?: string | null
          category?: string
          comment_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_comments_locked?: boolean | null
          is_pinned?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          name_bn: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          name_bn?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          name_bn?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calculator_parameters: {
        Row: {
          created_at: string
          display_order: number
          id: string
          module_id: string
          param_group: string
          param_key: string
          param_label: string
          param_label_bn: string
          param_unit: string | null
          param_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          module_id: string
          param_group?: string
          param_key: string
          param_label: string
          param_label_bn: string
          param_unit?: string | null
          param_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          module_id?: string
          param_group?: string
          param_key?: string
          param_label?: string
          param_label_bn?: string
          param_unit?: string | null
          param_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          applicable_category_ids: string[] | null
          applicable_product_ids: string[] | null
          banner_image_url: string | null
          banner_link: string | null
          banner_position: string | null
          campaign_type: string
          coupon_code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          discount_type: string | null
          discount_value: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          notification_channels: string[] | null
          notification_message: string | null
          notification_message_bn: string | null
          popup_delay_seconds: number | null
          show_popup: boolean | null
          start_date: string | null
          status: string
          target_audience: string | null
          title: string
          title_bn: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number | null
        }
        Insert: {
          applicable_category_ids?: string[] | null
          applicable_product_ids?: string[] | null
          banner_image_url?: string | null
          banner_link?: string | null
          banner_position?: string | null
          campaign_type?: string
          coupon_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          discount_type?: string | null
          discount_value?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          notification_channels?: string[] | null
          notification_message?: string | null
          notification_message_bn?: string | null
          popup_delay_seconds?: number | null
          show_popup?: boolean | null
          start_date?: string | null
          status?: string
          target_audience?: string | null
          title: string
          title_bn?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Update: {
          applicable_category_ids?: string[] | null
          applicable_product_ids?: string[] | null
          banner_image_url?: string | null
          banner_link?: string | null
          banner_position?: string | null
          campaign_type?: string
          coupon_code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          discount_type?: string | null
          discount_value?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          notification_channels?: string[] | null
          notification_message?: string | null
          notification_message_bn?: string | null
          popup_delay_seconds?: number | null
          show_popup?: boolean | null
          start_date?: string | null
          status?: string
          target_audience?: string | null
          title?: string
          title_bn?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_bn: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_bn: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_bn?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          company_type: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          name_bn: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_type?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_bn?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_type?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_bn?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      courier_settings: {
        Row: {
          api_key: string | null
          auto_create_on_status: string | null
          auto_create_order: boolean | null
          base_url: string | null
          courier_name: string
          created_at: string
          id: string
          is_enabled: boolean | null
          secret_key: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_key?: string | null
          auto_create_on_status?: string | null
          auto_create_order?: boolean | null
          base_url?: string | null
          courier_name: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret_key?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_key?: string | null
          auto_create_on_status?: string | null
          auto_create_order?: boolean | null
          base_url?: string | null
          courier_name?: string
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          secret_key?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      custom_pages: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          created_by: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          slug: string
          status: string
          title: string
          title_bn: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          status?: string
          title: string
          title_bn?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          status?: string
          title?: string
          title_bn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          district: string | null
          division: string | null
          id: string
          notes: string | null
          shipping_address: string | null
          upazila: string | null
          updated_at: string
          village: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          district?: string | null
          division?: string | null
          id?: string
          notes?: string | null
          shipping_address?: string | null
          upazila?: string | null
          updated_at?: string
          village?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          district?: string | null
          division?: string | null
          id?: string
          notes?: string | null
          shipping_address?: string | null
          upazila?: string | null
          updated_at?: string
          village?: string | null
        }
        Relationships: []
      }
      delivery_charge_rules: {
        Row: {
          charge_amount: number
          created_at: string
          district_name: string | null
          id: string
          is_active: boolean
          max_value: number | null
          min_value: number | null
          priority: number
          rule_type: string
          updated_at: string
        }
        Insert: {
          charge_amount?: number
          created_at?: string
          district_name?: string | null
          id?: string
          is_active?: boolean
          max_value?: number | null
          min_value?: number | null
          priority?: number
          rule_type?: string
          updated_at?: string
        }
        Update: {
          charge_amount?: number
          created_at?: string
          district_name?: string | null
          id?: string
          is_active?: boolean
          max_value?: number | null
          min_value?: number | null
          priority?: number
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      disease_recommended_products: {
        Row: {
          created_at: string
          disease_id: string
          display_order: number
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          disease_id: string
          display_order?: number
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          disease_id?: string
          display_order?: number
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disease_recommended_products_disease_id_fkey"
            columns: ["disease_id"]
            isOneToOne: false
            referencedRelation: "fish_diseases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disease_recommended_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          order_number: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
          template_type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_number?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject: string
          template_type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_number?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_type?: string
        }
        Relationships: []
      }
      farm_predictions: {
        Row: {
          avg_harvest_weight: number
          created_at: string
          culture_duration: number
          electricity_cost: number
          fcr: number
          feed_cost_per_kg: number
          feed_type: string | null
          fingerling_price: number
          fish_species: string
          id: string
          labor_cost: number
          market_price_per_kg: number
          medicine_cost: number
          other_cost: number
          pond_name: string
          pond_size: number
          pond_size_unit: string
          predicted_profit: number
          predicted_revenue: number
          roi: number
          stocking_density: number
          survival_rate: number
          total_farming_cost: number
          total_feed_cost: number
          total_fingerling_cost: number
          total_fish_stocked: number
          total_harvest_biomass: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_harvest_weight?: number
          created_at?: string
          culture_duration?: number
          electricity_cost?: number
          fcr?: number
          feed_cost_per_kg?: number
          feed_type?: string | null
          fingerling_price?: number
          fish_species?: string
          id?: string
          labor_cost?: number
          market_price_per_kg?: number
          medicine_cost?: number
          other_cost?: number
          pond_name?: string
          pond_size?: number
          pond_size_unit?: string
          predicted_profit?: number
          predicted_revenue?: number
          roi?: number
          stocking_density?: number
          survival_rate?: number
          total_farming_cost?: number
          total_feed_cost?: number
          total_fingerling_cost?: number
          total_fish_stocked?: number
          total_harvest_biomass?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_harvest_weight?: number
          created_at?: string
          culture_duration?: number
          electricity_cost?: number
          fcr?: number
          feed_cost_per_kg?: number
          feed_type?: string | null
          fingerling_price?: number
          fish_species?: string
          id?: string
          labor_cost?: number
          market_price_per_kg?: number
          medicine_cost?: number
          other_cost?: number
          pond_name?: string
          pond_size?: number
          pond_size_unit?: string
          predicted_profit?: number
          predicted_revenue?: number
          roi?: number
          stocking_density?: number
          survival_rate?: number
          total_farming_cost?: number
          total_feed_cost?: number
          total_fingerling_cost?: number
          total_fish_stocked?: number
          total_harvest_biomass?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      farmer_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          id: string
          pond_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          pond_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          pond_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      farmer_incomes: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          fish_price: number | null
          fish_type: string | null
          fish_weight: number | null
          id: string
          pond_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          fish_price?: number | null
          fish_type?: string | null
          fish_weight?: number | null
          id?: string
          pond_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          fish_price?: number | null
          fish_type?: string | null
          fish_weight?: number | null
          id?: string
          pond_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      farmer_ponds: {
        Row: {
          area: number
          area_unit: string
          created_at: string
          depth: number
          depth_unit: string
          fish_count: number | null
          fish_stock_entries: Json | null
          fish_types: string[] | null
          id: string
          name: string
          notes: string | null
          status: string
          stocking_date: string | null
          total_stocking_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: number
          area_unit?: string
          created_at?: string
          depth?: number
          depth_unit?: string
          fish_count?: number | null
          fish_stock_entries?: Json | null
          fish_types?: string[] | null
          id?: string
          name: string
          notes?: string | null
          status?: string
          stocking_date?: string | null
          total_stocking_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: number
          area_unit?: string
          created_at?: string
          depth?: number
          depth_unit?: string
          fish_count?: number | null
          fish_stock_entries?: Json | null
          fish_types?: string[] | null
          id?: string
          name?: string
          notes?: string | null
          status?: string
          stocking_date?: string | null
          total_stocking_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      farmer_samplings: {
        Row: {
          avg_weight: number | null
          created_at: string
          date: string
          fish_entries: Json | null
          id: string
          notes: string | null
          pond_id: string | null
          pond_name: string
          total_fish: number | null
          total_weight: number | null
          user_id: string
        }
        Insert: {
          avg_weight?: number | null
          created_at?: string
          date?: string
          fish_entries?: Json | null
          id?: string
          notes?: string | null
          pond_id?: string | null
          pond_name: string
          total_fish?: number | null
          total_weight?: number | null
          user_id: string
        }
        Update: {
          avg_weight?: number | null
          created_at?: string
          date?: string
          fish_entries?: Json | null
          id?: string
          notes?: string | null
          pond_id?: string | null
          pond_name?: string
          total_fish?: number | null
          total_weight?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmer_samplings_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "farmer_ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      farming_alerts: {
        Row: {
          alert_date: string
          alert_time: string | null
          alert_type: Database["public"]["Enums"]["alert_type"]
          channels: string[] | null
          created_at: string
          created_by: string | null
          fish_species: string | null
          id: string
          is_global: boolean | null
          is_recurring: boolean | null
          message: string
          message_bn: string | null
          pond_id: string | null
          pond_name: string | null
          priority: string | null
          recurrence_interval: string | null
          status: Database["public"]["Enums"]["alert_status"] | null
          title: string
          title_bn: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alert_date?: string
          alert_time?: string | null
          alert_type?: Database["public"]["Enums"]["alert_type"]
          channels?: string[] | null
          created_at?: string
          created_by?: string | null
          fish_species?: string | null
          id?: string
          is_global?: boolean | null
          is_recurring?: boolean | null
          message: string
          message_bn?: string | null
          pond_id?: string | null
          pond_name?: string | null
          priority?: string | null
          recurrence_interval?: string | null
          status?: Database["public"]["Enums"]["alert_status"] | null
          title: string
          title_bn?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alert_date?: string
          alert_time?: string | null
          alert_type?: Database["public"]["Enums"]["alert_type"]
          channels?: string[] | null
          created_at?: string
          created_by?: string | null
          fish_species?: string | null
          id?: string
          is_global?: boolean | null
          is_recurring?: boolean | null
          message?: string
          message_bn?: string | null
          pond_id?: string | null
          pond_name?: string | null
          priority?: string | null
          recurrence_interval?: string | null
          status?: Database["public"]["Enums"]["alert_status"] | null
          title?: string
          title_bn?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farming_alerts_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "farmer_ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      fish_diseases: {
        Row: {
          affected_fish: string[]
          category: string
          causes: string[]
          created_at: string
          display_order: number
          id: string
          image_description: string | null
          image_url: string | null
          is_active: boolean
          name: string
          name_en: string
          prevention: string[]
          season: string[]
          severity: string
          symptoms: string[]
          treatment: Json
          updated_at: string
        }
        Insert: {
          affected_fish?: string[]
          category?: string
          causes?: string[]
          created_at?: string
          display_order?: number
          id?: string
          image_description?: string | null
          image_url?: string | null
          is_active?: boolean
          name: string
          name_en: string
          prevention?: string[]
          season?: string[]
          severity?: string
          symptoms?: string[]
          treatment?: Json
          updated_at?: string
        }
        Update: {
          affected_fish?: string[]
          category?: string
          causes?: string[]
          created_at?: string
          display_order?: number
          id?: string
          image_description?: string | null
          image_url?: string | null
          is_active?: boolean
          name?: string
          name_en?: string
          prevention?: string[]
          season?: string[]
          severity?: string
          symptoms?: string[]
          treatment?: Json
          updated_at?: string
        }
        Relationships: []
      }
      flash_sale_items: {
        Row: {
          created_at: string
          flash_sale_id: string
          id: string
          override_discount_type: string | null
          override_discount_value: number | null
          product_id: string
          sold_count: number
          stock_limit: number | null
        }
        Insert: {
          created_at?: string
          flash_sale_id: string
          id?: string
          override_discount_type?: string | null
          override_discount_value?: number | null
          product_id: string
          sold_count?: number
          stock_limit?: number | null
        }
        Update: {
          created_at?: string
          flash_sale_id?: string
          id?: string
          override_discount_type?: string | null
          override_discount_value?: number | null
          product_id?: string
          sold_count?: number
          stock_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "flash_sale_items_flash_sale_id_fkey"
            columns: ["flash_sale_id"]
            isOneToOne: false
            referencedRelation: "flash_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      flash_sales: {
        Row: {
          banner_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_bn: string | null
          discount_type: string
          discount_value: number
          end_time: string
          id: string
          is_active: boolean
          max_quantity_per_user: number | null
          start_time: string
          title: string
          title_bn: string | null
          updated_at: string
        }
        Insert: {
          banner_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          discount_type?: string
          discount_value?: number
          end_time: string
          id?: string
          is_active?: boolean
          max_quantity_per_user?: number | null
          start_time: string
          title: string
          title_bn?: string | null
          updated_at?: string
        }
        Update: {
          banner_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_bn?: string | null
          discount_type?: string
          discount_value?: number
          end_time?: string
          id?: string
          is_active?: boolean
          max_quantity_per_user?: number | null
          start_time?: string
          title?: string
          title_bn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      google_drive_tokens: {
        Row: {
          access_token: string | null
          connected_at: string
          drive_email: string | null
          id: string
          refresh_token: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          drive_email?: string | null
          id?: string
          refresh_token: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          drive_email?: string | null
          id?: string
          refresh_token?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          background_type: string | null
          background_value: string | null
          bg_opacity: number | null
          bg_position: string | null
          bg_size: string | null
          button_link: string | null
          button_text: string | null
          button_variant: string | null
          created_at: string
          display_order: number | null
          featured_product_id: string | null
          id: string
          is_active: boolean | null
          subtitle: string | null
          tagline: string | null
          tagline_icon: string | null
          title: string
          updated_at: string
        }
        Insert: {
          background_type?: string | null
          background_value?: string | null
          bg_opacity?: number | null
          bg_position?: string | null
          bg_size?: string | null
          button_link?: string | null
          button_text?: string | null
          button_variant?: string | null
          created_at?: string
          display_order?: number | null
          featured_product_id?: string | null
          id?: string
          is_active?: boolean | null
          subtitle?: string | null
          tagline?: string | null
          tagline_icon?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          background_type?: string | null
          background_value?: string | null
          bg_opacity?: number | null
          bg_position?: string | null
          bg_size?: string | null
          button_link?: string | null
          button_text?: string | null
          button_variant?: string | null
          created_at?: string
          display_order?: number | null
          featured_product_id?: string | null
          id?: string
          is_active?: boolean | null
          subtitle?: string | null
          tagline?: string | null
          tagline_icon?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hero_slides_featured_product_id_fkey"
            columns: ["featured_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          created_at: string
          district: string
          division: string
          fish_name: string
          fish_name_bn: string
          id: string
          market_name: string | null
          max_price: number | null
          min_price: number | null
          price_date: string
          price_per_kg: number
          upazila: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          district: string
          division: string
          fish_name: string
          fish_name_bn: string
          id?: string
          market_name?: string | null
          max_price?: number | null
          min_price?: number | null
          price_date?: string
          price_per_kg: number
          upazila: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          district?: string
          division?: string
          fish_name?: string
          fish_name_bn?: string
          id?: string
          market_name?: string | null
          max_price?: number | null
          min_price?: number | null
          price_date?: string
          price_per_kg?: number
          upazila?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_logs: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          sent_at: string
          status: string
          subject: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          sent_at?: string
          status?: string
          subject?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          sent_at?: string
          status?: string
          subject?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          channels: string[]
          created_at: string
          created_by: string | null
          dynamic_variables: string[] | null
          id: string
          is_default: boolean | null
          message: string
          message_bn: string | null
          name: string
          name_bn: string | null
          status: string
          subject: string | null
          subject_bn: string | null
          template_type: string
          updated_at: string
        }
        Insert: {
          channels?: string[]
          created_at?: string
          created_by?: string | null
          dynamic_variables?: string[] | null
          id?: string
          is_default?: boolean | null
          message: string
          message_bn?: string | null
          name: string
          name_bn?: string | null
          status?: string
          subject?: string | null
          subject_bn?: string | null
          template_type?: string
          updated_at?: string
        }
        Update: {
          channels?: string[]
          created_at?: string
          created_by?: string | null
          dynamic_variables?: string[] | null
          id?: string
          is_default?: boolean | null
          message?: string
          message_bn?: string | null
          name?: string
          name_bn?: string | null
          status?: string
          subject?: string | null
          subject_bn?: string | null
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          message_bn: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          title_bn: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          message_bn?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          title_bn?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          message_bn?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          title_bn?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          discount_percentage: number | null
          id: string
          order_id: string
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          order_id: string
          product_id: string
          product_image?: string | null
          product_name: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          order_id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          discount_amount: number
          district: string | null
          division: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          sender_number: string | null
          shipping_address: string
          shipping_cost: number
          status: string
          subtotal: number
          total_amount: number
          transaction_id: string | null
          upazila: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          discount_amount?: number
          district?: string | null
          division?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string
          payment_status?: string
          sender_number?: string | null
          shipping_address: string
          shipping_cost?: number
          status?: string
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
          upazila?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          discount_amount?: number
          district?: string | null
          division?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          sender_number?: string | null
          shipping_address?: string
          shipping_cost?: number
          status?: string
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
          upazila?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: Json
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          section_key: string
          section_name: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          section_key: string
          section_name: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          section_key?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pos_due_payments: {
        Row: {
          amount: number
          collected_by: string | null
          created_at: string
          id: string
          mobile_banking_provider: string | null
          notes: string | null
          payment_method: string
          sale_id: string
          transaction_id: string | null
        }
        Insert: {
          amount?: number
          collected_by?: string | null
          created_at?: string
          id?: string
          mobile_banking_provider?: string | null
          notes?: string | null
          payment_method?: string
          sale_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          collected_by?: string | null
          created_at?: string
          id?: string
          mobile_banking_provider?: string | null
          notes?: string | null
          payment_method?: string
          sale_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_due_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          name_bn: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_bn: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_bn?: string
          updated_at?: string
        }
        Relationships: []
      }
      pos_expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          expense_date: string
          id: string
          payment_method: string
          reference_no: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          payment_method?: string
          reference_no?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          payment_method?: string
          reference_no?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pos_expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sale_items: {
        Row: {
          created_at: string
          discount_percentage: number | null
          id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          product_id: string
          product_name: string
          quantity?: number
          sale_id: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          change_amount: number
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          due_amount: number
          id: string
          mobile_banking_number: string | null
          mobile_banking_provider: string | null
          notes: string | null
          paid_amount: number
          payment_method: string
          payment_type: string
          sale_number: string
          shift_id: string | null
          status: string
          subtotal: number
          total_amount: number
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          change_amount?: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          due_amount?: number
          id?: string
          mobile_banking_number?: string | null
          mobile_banking_provider?: string | null
          notes?: string | null
          paid_amount?: number
          payment_method?: string
          payment_type?: string
          sale_number: string
          shift_id?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          change_amount?: number
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          due_amount?: number
          id?: string
          mobile_banking_number?: string | null
          mobile_banking_provider?: string | null
          notes?: string | null
          paid_amount?: number
          payment_method?: string
          payment_type?: string
          sale_number?: string
          shift_id?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "pos_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_shifts: {
        Row: {
          cash_sales: number
          closed_at: string | null
          closing_amount: number | null
          created_at: string
          expected_amount: number | null
          id: string
          mobile_banking_sales: number
          notes: string | null
          opened_at: string
          opening_amount: number
          shift_number: string
          status: string
          total_sales: number
          total_transactions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cash_sales?: number
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string
          expected_amount?: number | null
          id?: string
          mobile_banking_sales?: number
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          shift_number: string
          status?: string
          total_sales?: number
          total_transactions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cash_sales?: number
          closed_at?: string | null
          closing_amount?: number | null
          created_at?: string
          expected_amount?: number | null
          id?: string
          mobile_banking_sales?: number
          notes?: string | null
          opened_at?: string
          opening_amount?: number
          shift_number?: string
          status?: string
          total_sales?: number
          total_transactions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          helpful_count: number | null
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category: string
          company_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          external_link: string | null
          focus_keyword: string | null
          id: string
          image_alt_text: string | null
          image_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          price: number
          recommendation_tags: string[] | null
          reorder_level: number | null
          seo_url: string | null
          sku: string | null
          stock_quantity: number
          unit: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          brand_id?: string | null
          category?: string
          company_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          external_link?: string | null
          focus_keyword?: string | null
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          price?: number
          recommendation_tags?: string[] | null
          reorder_level?: number | null
          seo_url?: string | null
          sku?: string | null
          stock_quantity?: number
          unit?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          brand_id?: string | null
          category?: string
          company_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          external_link?: string | null
          focus_keyword?: string | null
          id?: string
          image_alt_text?: string | null
          image_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          price?: number
          recommendation_tags?: string[] | null
          reorder_level?: number | null
          seo_url?: string | null
          sku?: string | null
          stock_quantity?: number
          unit?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          block_reason: string | null
          blocked_by: string | null
          blocked_until: string | null
          created_at: string
          dashboard_settings: Json | null
          deletion_warning_sent_at: string | null
          district: string | null
          division: string | null
          email: string | null
          full_name: string | null
          id: string
          is_blocked: boolean
          last_sign_in_at: string | null
          mobile: string | null
          upazila: string | null
          updated_at: string
          user_id: string
          village: string | null
        }
        Insert: {
          avatar_url?: string | null
          block_reason?: string | null
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string
          dashboard_settings?: Json | null
          deletion_warning_sent_at?: string | null
          district?: string | null
          division?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          last_sign_in_at?: string | null
          mobile?: string | null
          upazila?: string | null
          updated_at?: string
          user_id: string
          village?: string | null
        }
        Update: {
          avatar_url?: string | null
          block_reason?: string | null
          blocked_by?: string | null
          blocked_until?: string | null
          created_at?: string
          dashboard_settings?: Json | null
          deletion_warning_sent_at?: string | null
          district?: string | null
          division?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          last_sign_in_at?: string | null
          mobile?: string | null
          upazila?: string | null
          updated_at?: string
          user_id?: string
          village?: string | null
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          received_quantity: number | null
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          purchase_order_id: string
          quantity?: number
          received_quantity?: number | null
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number | null
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          received_date: string | null
          shipping_cost: number | null
          status: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          received_date?: string | null
          shipping_cost?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          received_date?: string | null
          shipping_cost?: number | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_attempts: {
        Row: {
          attempted_at: string
          email: string | null
          id: string
          ip_address: string
        }
        Insert: {
          attempted_at?: string
          email?: string | null
          id?: string
          ip_address: string
        }
        Update: {
          attempted_at?: string
          email?: string | null
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      review_helpful_votes: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          review_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          review_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          review_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "product_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          is_allowed: boolean
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_allowed?: boolean
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          api_response: string | null
          created_at: string
          error_message: string | null
          id: string
          message: string
          message_type: string
          order_number: string | null
          provider: string | null
          recipient_phone: string
          sent_at: string | null
          status: string
        }
        Insert: {
          api_response?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          message_type?: string
          order_number?: string | null
          provider?: string | null
          recipient_phone: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          api_response?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          message_type?: string
          order_number?: string | null
          provider?: string | null
          recipient_phone?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      sms_settings: {
        Row: {
          api_key: string | null
          api_url: string | null
          created_at: string
          due_reminder_enabled: boolean | null
          id: string
          is_enabled: boolean
          order_confirmation_enabled: boolean | null
          order_status_update_enabled: boolean | null
          provider: string
          sender_id: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_url?: string | null
          created_at?: string
          due_reminder_enabled?: boolean | null
          id?: string
          is_enabled?: boolean
          order_confirmation_enabled?: boolean | null
          order_status_update_enabled?: boolean | null
          provider?: string
          sender_id?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_url?: string | null
          created_at?: string
          due_reminder_enabled?: boolean | null
          id?: string
          is_enabled?: boolean
          order_confirmation_enabled?: boolean | null
          order_status_update_enabled?: boolean | null
          provider?: string
          sender_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      smtp_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          smtp_from_email: string
          smtp_from_name: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_secure: boolean
          smtp_user: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          smtp_from_email?: string
          smtp_from_name?: string
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          smtp_secure?: boolean
          smtp_user?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          smtp_from_email?: string
          smtp_from_name?: string
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          smtp_secure?: boolean
          smtp_user?: string
          updated_at?: string
        }
        Relationships: []
      }
      steadfast_consignments: {
        Row: {
          api_response: Json | null
          charge: number | null
          cod_amount: number | null
          consignment_id: string | null
          created_at: string
          delivery_status: string | null
          id: string
          invoice: string
          note: string | null
          order_id: string
          recipient_address: string | null
          recipient_name: string | null
          recipient_phone: string | null
          status: string | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          api_response?: Json | null
          charge?: number | null
          cod_amount?: number | null
          consignment_id?: string | null
          created_at?: string
          delivery_status?: string | null
          id?: string
          invoice: string
          note?: string | null
          order_id: string
          recipient_address?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          api_response?: Json | null
          charge?: number | null
          cod_amount?: number | null
          consignment_id?: string | null
          created_at?: string
          delivery_status?: string | null
          id?: string
          invoice?: string
          note?: string | null
          order_id?: string
          recipient_address?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          status?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "steadfast_consignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjustment_type: string
          created_at: string
          created_by: string | null
          id: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          product_id: string
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          adjustment_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          product_id: string
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          adjustment_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          product_id?: string
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          page_path: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          page_path?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          page_path?: string | null
          user_agent?: string | null
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      whatsapp_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_type: string
          order_number: string | null
          recipient_phone: string
          sent_at: string | null
          status: string
          template_name: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_type: string
          order_number?: string | null
          recipient_phone: string
          sent_at?: string | null
          status?: string
          template_name?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_type?: string
          order_number?: string | null
          recipient_phone?: string
          sent_at?: string | null
          status?: string
          template_name?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: []
      }
      whatsapp_settings: {
        Row: {
          access_token: string | null
          api_version: string | null
          business_account_id: string | null
          created_at: string
          delivery_template: string | null
          delivery_update_enabled: boolean | null
          id: string
          is_enabled: boolean
          order_confirmation_enabled: boolean | null
          order_confirmation_template: string | null
          phone_number_id: string | null
          shipping_notification_enabled: boolean | null
          shipping_template: string | null
          template_language: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          api_version?: string | null
          business_account_id?: string | null
          created_at?: string
          delivery_template?: string | null
          delivery_update_enabled?: boolean | null
          id?: string
          is_enabled?: boolean
          order_confirmation_enabled?: boolean | null
          order_confirmation_template?: string | null
          phone_number_id?: string | null
          shipping_notification_enabled?: boolean | null
          shipping_template?: string | null
          template_language?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          api_version?: string | null
          business_account_id?: string | null
          created_at?: string
          delivery_template?: string | null
          delivery_update_enabled?: boolean | null
          id?: string
          is_enabled?: boolean
          order_confirmation_enabled?: boolean | null
          order_confirmation_template?: string | null
          phone_number_id?: string | null
          shipping_notification_enabled?: boolean | null
          shipping_template?: string | null
          template_language?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_registration_rate_limit: {
        Args: { client_ip: string }
        Returns: boolean
      }
      generate_order_number: { Args: never; Returns: string }
      generate_pos_sale_number: { Args: never; Returns: string }
      generate_purchase_order_number: { Args: never; Returns: string }
      generate_shift_number: { Args: never; Returns: string }
      get_email_by_mobile: { Args: { mobile_number: string }; Returns: string }
      get_public_tables: {
        Args: never
        Returns: {
          label: string
          label_bn: string
          name: string
        }[]
      }
      has_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_mobile_available: { Args: { mobile_number: string }; Returns: boolean }
      is_user_blocked: { Args: { check_user_id: string }; Returns: boolean }
      manage_backup_cron: {
        Args: { _action: string; _backup_scope?: string; _schedule?: string }
        Returns: Json
      }
    }
    Enums: {
      alert_status: "pending" | "sent" | "completed" | "dismissed" | "overdue"
      alert_type:
        | "feed_reminder"
        | "medicine_reminder"
        | "water_check"
        | "pond_cleaning"
        | "fish_sampling"
        | "harvest_reminder"
        | "weather_risk"
        | "disease_outbreak"
        | "government_advisory"
        | "custom"
      app_role:
        | "admin"
        | "user"
        | "farmer"
        | "customer"
        | "manager"
        | "cashier"
        | "delivery_staff"
        | "blogger"
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
      alert_status: ["pending", "sent", "completed", "dismissed", "overdue"],
      alert_type: [
        "feed_reminder",
        "medicine_reminder",
        "water_check",
        "pond_cleaning",
        "fish_sampling",
        "harvest_reminder",
        "weather_risk",
        "disease_outbreak",
        "government_advisory",
        "custom",
      ],
      app_role: [
        "admin",
        "user",
        "farmer",
        "customer",
        "manager",
        "cashier",
        "delivery_staff",
        "blogger",
      ],
    },
  },
} as const
