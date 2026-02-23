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
          button_link: string | null
          button_text: string | null
          button_variant: string | null
          created_at: string
          display_order: number | null
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
          button_link?: string | null
          button_text?: string | null
          button_variant?: string | null
          created_at?: string
          display_order?: number | null
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
          button_link?: string | null
          button_text?: string | null
          button_variant?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          subtitle?: string | null
          tagline?: string | null
          tagline_icon?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          created_at: string
          dashboard_settings: Json | null
          district: string | null
          division: string | null
          email: string | null
          full_name: string | null
          id: string
          mobile: string | null
          upazila: string | null
          updated_at: string
          user_id: string
          village: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dashboard_settings?: Json | null
          district?: string | null
          division?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          mobile?: string | null
          upazila?: string | null
          updated_at?: string
          user_id: string
          village?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dashboard_settings?: Json | null
          district?: string | null
          division?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
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
      generate_order_number: { Args: never; Returns: string }
      generate_purchase_order_number: { Args: never; Returns: string }
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
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "farmer"
        | "customer"
        | "manager"
        | "cashier"
        | "delivery_staff"
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
      app_role: [
        "admin",
        "user",
        "farmer",
        "customer",
        "manager",
        "cashier",
        "delivery_staff",
      ],
    },
  },
} as const
