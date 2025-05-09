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
          additional_info: string | null
          birthday: string | null
          block: string | null
          city: string
          consumer_id: string | null
          country: string
          county: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          house_number: string | null
          id: string
          kv: string | null
          other: string | null
          phone: string | null
          street: string
          type: string
          updated_at: string | null
          user_id: string | null
          zip: string
        }
        Insert: {
          additional_info?: string | null
          birthday?: string | null
          block?: string | null
          city: string
          consumer_id?: string | null
          country: string
          county?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          house_number?: string | null
          id?: string
          kv?: string | null
          other?: string | null
          phone?: string | null
          street: string
          type: string
          updated_at?: string | null
          user_id?: string | null
          zip: string
        }
        Update: {
          additional_info?: string | null
          birthday?: string | null
          block?: string | null
          city?: string
          consumer_id?: string | null
          country?: string
          county?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          house_number?: string | null
          id?: string
          kv?: string | null
          other?: string | null
          phone?: string | null
          street?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_consumer_id_fkey"
            columns: ["consumer_id"]
            isOneToOne: false
            referencedRelation: "consumers"
            referencedColumns: ["id"]
          },
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
      api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
          max_usage: number | null
          priority: number | null
          service: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          max_usage?: number | null
          priority?: number | null
          service: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          max_usage?: number | null
          priority?: number | null
          service?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      cashback: {
        Row: {
          cashback_amount: number
          cashback_rate: number
          created_at: string | null
          credit_card: string | null
          id: string
          payback_points: number | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          cashback_amount: number
          cashback_rate: number
          created_at?: string | null
          credit_card?: string | null
          id?: string
          payback_points?: number | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          cashback_amount?: number
          cashback_rate?: number
          created_at?: string | null
          credit_card?: string | null
          id?: string
          payback_points?: number | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashback_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      consumers: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          raw_input: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          raw_input?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          raw_input?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          comment: string | null
          created_at: string | null
          description: string | null
          id: string
          invoice_date: string | null
          item_index: number | null
          ocr_item_id: string | null
          ocr_mapping_id: string | null
          quantity: number | null
          source_file: string | null
          status: string | null
          supplier_name: string | null
          supplier_vat: string | null
          tax_rate: number | null
          total_price: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_date?: string | null
          item_index?: number | null
          ocr_item_id?: string | null
          ocr_mapping_id?: string | null
          quantity?: number | null
          source_file?: string | null
          status?: string | null
          supplier_name?: string | null
          supplier_vat?: string | null
          tax_rate?: number | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_date?: string | null
          item_index?: number | null
          ocr_item_id?: string | null
          ocr_mapping_id?: string | null
          quantity?: number | null
          source_file?: string | null
          status?: string | null
          supplier_name?: string | null
          supplier_vat?: string | null
          tax_rate?: number | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_ocr_item_id_fkey"
            columns: ["ocr_item_id"]
            isOneToOne: false
            referencedRelation: "ocr_invoice_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_ocr_mapping_id_fkey"
            columns: ["ocr_mapping_id"]
            isOneToOne: false
            referencedRelation: "ocr_invoice_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_invoice_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_new: boolean | null
          item_index: number | null
          mapping_id: string
          product_code: string | null
          quantity: number | null
          tax_rate: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_new?: boolean | null
          item_index?: number | null
          mapping_id: string
          product_code?: string | null
          quantity?: number | null
          tax_rate?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_new?: boolean | null
          item_index?: number | null
          mapping_id?: string
          product_code?: string | null
          quantity?: number | null
          tax_rate?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ocr_invoice_items_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "ocr_invoice_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_invoice_mappings: {
        Row: {
          comment: string | null
          confirmed_at: string | null
          created_at: string | null
          currency: string | null
          customer_address: string | null
          customer_address_id: string | null
          customer_name: string | null
          customer_vat: string | null
          delivery_date: string | null
          due_date: string | null
          file_path: string | null
          iban: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          line_items: Json | null
          ocr_request_id: string
          original_file_name: string | null
          payment_date: string | null
          po_number: string | null
          reference_number: string | null
          status: string | null
          supplier_address: string | null
          supplier_address_id: string | null
          supplier_email: string | null
          supplier_name: string | null
          supplier_phone: string | null
          supplier_vat: string | null
          swift: string | null
          total_amount: number | null
          total_net: number | null
          total_tax: number | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_address?: string | null
          customer_address_id?: string | null
          customer_name?: string | null
          customer_vat?: string | null
          delivery_date?: string | null
          due_date?: string | null
          file_path?: string | null
          iban?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          line_items?: Json | null
          ocr_request_id: string
          original_file_name?: string | null
          payment_date?: string | null
          po_number?: string | null
          reference_number?: string | null
          status?: string | null
          supplier_address?: string | null
          supplier_address_id?: string | null
          supplier_email?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          supplier_vat?: string | null
          swift?: string | null
          total_amount?: number | null
          total_net?: number | null
          total_tax?: number | null
          user_id: string
        }
        Update: {
          comment?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string | null
          customer_address?: string | null
          customer_address_id?: string | null
          customer_name?: string | null
          customer_vat?: string | null
          delivery_date?: string | null
          due_date?: string | null
          file_path?: string | null
          iban?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          line_items?: Json | null
          ocr_request_id?: string
          original_file_name?: string | null
          payment_date?: string | null
          po_number?: string | null
          reference_number?: string | null
          status?: string | null
          supplier_address?: string | null
          supplier_address_id?: string | null
          supplier_email?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          supplier_vat?: string | null
          swift?: string | null
          total_amount?: number | null
          total_net?: number | null
          total_tax?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_invoice_mappings_customer_address_id_fkey"
            columns: ["customer_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_invoice_mappings_ocr_request_id_fkey"
            columns: ["ocr_request_id"]
            isOneToOne: false
            referencedRelation: "ocr_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_invoice_mappings_supplier_address_id_fkey"
            columns: ["supplier_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_requests: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_name: string
          id: string
          original_file_name: string | null
          processed_at: string | null
          response: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_name: string
          id?: string
          original_file_name?: string | null
          processed_at?: string | null
          response?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          id?: string
          original_file_name?: string | null
          processed_at?: string | null
          response?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ocr_tokens: {
        Row: {
          tokens: number
          user_id: string
        }
        Insert: {
          tokens?: number
          user_id: string
        }
        Update: {
          tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          order_id: string
          product_name: string
          quantity: number
          supplier_id: string | null
          total_price: number
          unit_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id: string
          product_name: string
          quantity?: number
          supplier_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          order_id?: string
          product_name?: string
          quantity?: number
          supplier_id?: string | null
          total_price?: number
          unit_price?: number
          updated_at?: string
          user_id?: string | null
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
            foreignKeyName: "order_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          notes: string | null
          order_id: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
          image_url: string | null
          is_sales_order: boolean | null
          link: string | null
          notes: string | null
          ocr_customer_data: Json | null
          order_date: string | null
          order_number: string
          order_type: Database["public"]["Enums"]["order_type_enum"] | null
          payment_status: string | null
          price_limit: number | null
          purchase_origin: string | null
          purchase_type: Database["public"]["Enums"]["purchase_type"] | null
          search_description: string | null
          shipping_address_id: string | null
          source_order_id: string | null
          status: string | null
          status_history: Json | null
          supplier_country: string | null
          supplier_id: string | null
          supplier_vat_id: string | null
          tracking_number: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          amount: number
          billing_address_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          image_url?: string | null
          is_sales_order?: boolean | null
          link?: string | null
          notes?: string | null
          ocr_customer_data?: Json | null
          order_date?: string | null
          order_number: string
          order_type?: Database["public"]["Enums"]["order_type_enum"] | null
          payment_status?: string | null
          price_limit?: number | null
          purchase_origin?: string | null
          purchase_type?: Database["public"]["Enums"]["purchase_type"] | null
          search_description?: string | null
          shipping_address_id?: string | null
          source_order_id?: string | null
          status?: string | null
          status_history?: Json | null
          supplier_country?: string | null
          supplier_id?: string | null
          supplier_vat_id?: string | null
          tracking_number?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          billing_address_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          image_url?: string | null
          is_sales_order?: boolean | null
          link?: string | null
          notes?: string | null
          ocr_customer_data?: Json | null
          order_date?: string | null
          order_number?: string
          order_type?: Database["public"]["Enums"]["order_type_enum"] | null
          payment_status?: string | null
          price_limit?: number | null
          purchase_origin?: string | null
          purchase_type?: Database["public"]["Enums"]["purchase_type"] | null
          search_description?: string | null
          shipping_address_id?: string | null
          source_order_id?: string | null
          status?: string | null
          status_history?: Json | null
          supplier_country?: string | null
          supplier_id?: string | null
          supplier_vat_id?: string | null
          tracking_number?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
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
            foreignKeyName: "orders_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string | null
          description: string
          id: string
          language: string
          link: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          language: string
          link: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          language?: string
          link?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ruspost_barcodes: {
        Row: {
          barcode: string
          created_at: string | null
          id: string
          is_used: boolean | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          barcode: string
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          barcode?: string
          created_at?: string | null
          id?: string
          is_used?: boolean | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          eori_number: string | null
          id: string
          legal_form: string | null
          postal_code: string | null
          region: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string | null
          vat_number: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          eori_number?: string | null
          id?: string
          legal_form?: string | null
          postal_code?: string | null
          region?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          eori_number?: string | null
          id?: string
          legal_form?: string | null
          postal_code?: string | null
          region?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_tracking_references: {
        Row: {
          added_by: string | null
          carrier: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          label_url: string | null
          order_id: string | null
          tracking_code: string
        }
        Insert: {
          added_by?: string | null
          carrier?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label_url?: string | null
          order_id?: string | null
          tracking_code: string
        }
        Update: {
          added_by?: string | null
          carrier?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label_url?: string | null
          order_id?: string | null
          tracking_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_tracking_references_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shoppers: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          postal_code: string | null
          region: string | null
          salutation: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          salutation?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          salutation?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shoppers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          started_at: string
          status: string
          trial_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan: string
          started_at?: string
          status: string
          trial_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          status?: string
          trial_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      tax_reports: {
        Row: {
          created_at: string | null
          expected_tax: number
          id: string
          period: string
          taxable_income: number
          updated_at: string | null
          user_id: string | null
          vat_paid: number | null
          vat_refunded: number | null
        }
        Insert: {
          created_at?: string | null
          expected_tax: number
          id?: string
          period: string
          taxable_income: number
          updated_at?: string | null
          user_id?: string | null
          vat_paid?: number | null
          vat_refunded?: number | null
        }
        Update: {
          created_at?: string | null
          expected_tax?: number
          id?: string
          period?: string
          taxable_income?: number
          updated_at?: string | null
          user_id?: string | null
          vat_paid?: number | null
          vat_refunded?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          order_id: string | null
          payment_method: string | null
          status: string | null
          type: Database["public"]["Enums"]["transaction_type"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["transaction_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          status?: string | null
          type?: Database["public"]["Enums"]["transaction_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
          currency: string | null
          deleted_at: string | null
          email: string
          email_notifications: boolean | null
          eori_number: string | null
          eu_vat_id: string | null
          id: string
          language: string | null
          name: string | null
          phone: string | null
          role: string
          tax_number: string | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          email: string
          email_notifications?: boolean | null
          eori_number?: string | null
          eu_vat_id?: string | null
          id?: string
          language?: string | null
          name?: string | null
          phone?: string | null
          role?: string
          tax_number?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          business_type?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          email?: string
          email_notifications?: boolean | null
          eori_number?: string | null
          eu_vat_id?: string | null
          id?: string
          language?: string | null
          name?: string | null
          phone?: string | null
          role?: string
          tax_number?: string | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_ocr_tokens_for_new_user: {
        Args: { uid: string }
        Returns: undefined
      }
      decrement_ocr_token: {
        Args: { uid: string }
        Returns: undefined
      }
      folder_uid: {
        Args: Record<PropertyKey, never> | { name: string }
        Returns: string
      }
    }
    Enums: {
      order_status:
        | "pending"
        | "accepted"
        | "declined"
        | "processing"
        | "shipped"
        | "delivered"
      order_type: "fulfillment" | "supplier"
      order_type_enum: "fulfillment" | "supplier" | "search-request"
      paid_level: "free" | "starter" | "pro" | "enterprise"
      purchase_type: "domestic" | "eu_b2b" | "foreign_consumer"
      transaction_status: "success" | "pending" | "failed"
      transaction_type: "purchase" | "refund" | "payout"
      user_role: "shopper" | "manager" | "admin" | "site_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: [
        "pending",
        "accepted",
        "declined",
        "processing",
        "shipped",
        "delivered",
      ],
      order_type: ["fulfillment", "supplier"],
      order_type_enum: ["fulfillment", "supplier", "search-request"],
      paid_level: ["free", "starter", "pro", "enterprise"],
      purchase_type: ["domestic", "eu_b2b", "foreign_consumer"],
      transaction_status: ["success", "pending", "failed"],
      transaction_type: ["purchase", "refund", "payout"],
      user_role: ["shopper", "manager", "admin", "site_admin"],
    },
  },
} as const
