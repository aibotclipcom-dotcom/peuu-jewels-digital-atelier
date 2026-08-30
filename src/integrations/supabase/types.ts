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
      announcements: {
        Row: {
          bg_color: string
          created_at: string
          id: string
          is_active: boolean
          link: string | null
          link_text: string | null
          sort_order: number
          text: string
          text_color: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string | null
          link_text?: string | null
          sort_order?: number
          text?: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string | null
          link_text?: string | null
          sort_order?: number
          text?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          bg_color: string
          border_color: string
          created_at: string
          ends_at: string | null
          id: string
          label: string
          priority: number
          starts_at: string | null
          text_color: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          border_color?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          label: string
          priority?: number
          starts_at?: string | null
          text_color?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          border_color?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          label?: string
          priority?: number
          starts_at?: string | null
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          banner_url: string | null
          created_at: string
          icon_url: string | null
          id: string
          image_url: string | null
          is_visible: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_visible?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          claimed_at: string
          coupon_id: string
          email: string
          id: string
          order_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          claimed_at?: string
          coupon_id: string
          email: string
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          claimed_at?: string
          coupon_id?: string
          email?: string
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          amount_off: number
          code: string
          created_at: string
          discount_type: string
          expires_at: string | null
          first_order_only: boolean
          id: string
          min_order_amount: number
          percent_off: number
          single_use: boolean
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          amount_off?: number
          code: string
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          first_order_only?: boolean
          id?: string
          min_order_amount?: number
          percent_off: number
          single_use?: boolean
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          amount_off?: number
          code?: string
          created_at?: string
          discount_type?: string
          expires_at?: string | null
          first_order_only?: boolean
          id?: string
          min_order_amount?: number
          percent_off?: number
          single_use?: boolean
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      filter_definitions: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          key: string
          name: string
          options: Json
          sort_order: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          name: string
          options?: Json
          sort_order?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          name?: string
          options?: Json
          sort_order?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      for_every_you_cards: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          link: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      global_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          created_at: string
          cta_link: string
          cta_text: string
          description: string
          heading: string
          id: string
          is_active: boolean
          media_type: string
          media_url: string
          mobile_media_url: string | null
          sort_order: number
          subheading: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_link?: string
          cta_text?: string
          description?: string
          heading?: string
          id?: string
          is_active?: boolean
          media_type?: string
          media_url?: string
          mobile_media_url?: string | null
          sort_order?: number
          subheading?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_link?: string
          cta_text?: string
          description?: string
          heading?: string
          id?: string
          is_active?: boolean
          media_type?: string
          media_url?: string
          mobile_media_url?: string | null
          sort_order?: number
          subheading?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_nav_items: {
        Row: {
          badge_label: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          link: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          badge_label?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          badge_label?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
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
          billing_address: Json | null
          cancellation_reason: string | null
          cancelled_at: string | null
          coupon_code: string | null
          created_at: string
          discount_total: number
          id: string
          notes: string | null
          payment_method: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          refund_id: string | null
          refund_status: string | null
          shipping_address: Json | null
          shipping_total: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_total: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_total?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          refund_id?: string | null
          refund_status?: string | null
          shipping_address?: Json | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_total?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          refund_id?: string | null
          refund_status?: string | null
          shipping_address?: Json | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          created_at: string
          filter_key: string
          id: string
          product_id: string
          value: string
        }
        Insert: {
          created_at?: string
          filter_key: string
          id?: string
          product_id: string
          value: string
        }
        Update: {
          created_at?: string
          filter_key?: string
          id?: string
          product_id?: string
          value?: string
        }
        Relationships: []
      }
      product_badges: {
        Row: {
          badge_id: string
          product_id: string
        }
        Insert: {
          badge_id: string
          product_id: string
        }
        Update: {
          badge_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      product_benefits: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          product_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          product_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          product_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_benefits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          product_id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          product_id: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          product_id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          approved: boolean
          body: string | null
          created_at: string
          helpful_count: number
          id: string
          image_urls: string[]
          product_id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          approved?: boolean
          body?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          image_urls?: string[]
          product_id: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          approved?: boolean
          body?: string | null
          created_at?: string
          helpful_count?: number
          id?: string
          image_urls?: string[]
          product_id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      product_types: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          best_seller_sort: number
          care: string | null
          category: string
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          id: string
          image_urls: string[]
          is_best_seller: boolean
          materials: string[]
          name: string
          og_image: string | null
          price: number
          product_type_id: string | null
          sale_ends_at: string | null
          sale_starts_at: string | null
          seo_description: string | null
          seo_title: string | null
          shipping_info: string | null
          sku: string
          slug: string
          spec: Json
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          updated_at: string
          video_urls: string[]
        }
        Insert: {
          best_seller_sort?: number
          care?: string | null
          category: string
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          is_best_seller?: boolean
          materials?: string[]
          name: string
          og_image?: string | null
          price?: number
          product_type_id?: string | null
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shipping_info?: string | null
          sku: string
          slug: string
          spec?: Json
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          updated_at?: string
          video_urls?: string[]
        }
        Update: {
          best_seller_sort?: number
          care?: string | null
          category?: string
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_urls?: string[]
          is_best_seller?: boolean
          materials?: string[]
          name?: string
          og_image?: string | null
          price?: number
          product_type_id?: string | null
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          shipping_info?: string | null
          sku?: string
          slug?: string
          spec?: Json
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          updated_at?: string
          video_urls?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          state: string | null
          street_address: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      review_helpful_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          user_id?: string
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
      site_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
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
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_product_stock: { Args: { _items: Json }; Returns: undefined }
      coupon_is_claimable: { Args: { _coupon_id: string }; Returns: boolean }
      duplicate_product: { Args: { _id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_coupon: {
        Args: { _code: string }
        Returns: {
          active: boolean
          amount_off: number
          code: string
          discount_type: string
          expires_at: string
          first_order_only: boolean
          id: string
          min_order_amount: number
          percent_off: number
          single_use: boolean
          usage_limit: number
          used_count: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "client"
      order_status:
        | "pending"
        | "confirmed"
        | "shipped"
        | "delivered"
        | "cancelled"
      product_status: "draft" | "published"
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
      app_role: ["admin", "client"],
      order_status: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      product_status: ["draft", "published"],
    },
  },
} as const
