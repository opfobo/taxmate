export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string | null
          id: string
          street: string
          type: string
          updated_at: string | null
          user_id: string | null
          zip: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string | null
          id?: string
          street: string
          type: string
          updated_at?: string | null
          user_id?: string | null
          zip: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          street?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_dashboard: {
        Row: {
          admin_id: string | null
          category: string
          content: string
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          category: string
          content: string
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_dashboard_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback: {
        Row: {
          cashback_amount: number
          cashback_rate: number
          created_at: string | null
          credit_card: string | null
          id: string
          payback_points: number | null
          shopper_id: string | null
          transaction_id: string | null
        }
        Insert: {
          cashback_amount: number
          cashback_rate: number
          created_at?: string | null
          credit_card?: string | null
          id?: string
          payback_points?: number | null
          shopper_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          cashback_amount?: number
          cashback_rate?: number
          created_at?: string | null
          credit_card?: string | null
          id?: string
          payback_points?: number | null
          shopper_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashback_shopper_id_fkey"
            columns: ["shopper_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashback_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          billing_address_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          order_number: string
          payment_status: string | null
          shipping_address_id: string | null
          shopper_id: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          billing_address_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          order_number: string
          payment_status?: string | null
          shipping_address_id?: string | null
          shopper_id?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          billing_address_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          order_number?: string
          payment_status?: string | null
          shipping_address_id?: string | null
          shopper_id?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shopper_id_fkey"
            columns: ["shopper_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_reports: {
        Row: {
          created_at: string | null
          expected_tax: number
          id: string
          period: string
          shopper_id: string | null
          taxable_income: number
          updated_at: string | null
          vat_paid: number | null
          vat_refunded: number | null
        }
        Insert: {
          created_at?: string | null
          expected_tax: number
          id?: string
          period: string
          shopper_id?: string | null
          taxable_income: number
          updated_at?: string | null
          vat_paid?: number | null
          vat_refunded?: number | null
        }
        Update: {
          created_at?: string | null
          expected_tax?: number
          id?: string
          period?: string
          shopper_id?: string | null
          taxable_income?: number
          updated_at?: string | null
          vat_paid?: number | null
          vat_refunded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_reports_shopper_id_fkey"
            columns: ["shopper_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          order_id: string | null
          payment_method: string | null
          shopper_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          shopper_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          shopper_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_shopper_id_fkey"
            columns: ["shopper_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          de: string | null
          en: string
          id: number
          key: string
          ru: string | null
        }
        Insert: {
          de?: string | null
          en: string
          id?: number
          key: string
          ru?: string | null
        }
        Update: {
          de?: string | null
          en?: string
          id?: number
          key?: string
          ru?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          business_type: string | null
          created_at: string | null
          email: string
          eori_number: string | null
          eu_vat_id: string | null
          id: string
          language: string | null
          name: string | null
          phone: string | null
          role: string
          tax_number: string | null
          updated_at: string | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string | null
          email: string
          eori_number?: string | null
          eu_vat_id?: string | null
          id?: string
          language?: string | null
          name?: string | null
          phone?: string | null
          role: string
          tax_number?: string | null
          updated_at?: string | null
        }
        Update: {
          business_type?: string | null
          created_at?: string | null
          email?: string
          eori_number?: string | null
          eu_vat_id?: string | null
          id?: string
          language?: string | null
          name?: string | null
          phone?: string | null
          role?: string
          tax_number?: string | null
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
