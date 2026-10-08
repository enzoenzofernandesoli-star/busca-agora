export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          bairro: string;
          cep: string;
          cidade: string;
          complemento: string | null;
          created_at: string;
          id: string;
          numero: string;
          principal: boolean;
          rua: string;
          uf: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bairro: string;
          cep: string;
          cidade: string;
          complemento?: string | null;
          created_at?: string;
          id?: string;
          numero: string;
          principal?: boolean;
          rua: string;
          uf: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bairro?: string;
          cep?: string;
          cidade?: string;
          complemento?: string | null;
          created_at?: string;
          id?: string;
          numero?: string;
          principal?: boolean;
          rua?: string;
          uf?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      auth_rate_limits: {
        Row: {
          chave: string;
          janela_inicio: string;
          tentativas: number;
        };
        Insert: {
          chave: string;
          janela_inicio: string;
          tentativas?: number;
        };
        Update: {
          chave?: string;
          janela_inicio?: string;
          tentativas?: number;
        };
        Relationships: [];
      };
      banners: {
        Row: {
          ativo: boolean;
          created_at: string;
          id: string;
          imagem_path: string;
          imagem_url: string;
          link: string | null;
          ordem: number;
          titulo: string;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          created_at?: string;
          id?: string;
          imagem_path: string;
          imagem_url: string;
          link?: string | null;
          ordem?: number;
          titulo?: string;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          created_at?: string;
          id?: string;
          imagem_path?: string;
          imagem_url?: string;
          link?: string | null;
          ordem?: number;
          titulo?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          created_at: string;
          id: string;
          nome: string;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          nome: string;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          nome?: string;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          cart_id: string;
          created_at: string;
          id: string;
          quantidade: number;
          updated_at: string;
          variant_id: string;
        };
        Insert: {
          cart_id: string;
          created_at?: string;
          id?: string;
          quantidade: number;
          updated_at?: string;
          variant_id: string;
        };
        Update: {
          cart_id?: string;
          created_at?: string;
          id?: string;
          quantidade?: number;
          updated_at?: string;
          variant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      carts: {
        Row: {
          created_at: string;
          id: string;
          session_id: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          session_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          session_id?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "carts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          ativa: boolean;
          cor: string;
          created_at: string;
          icone: string | null;
          id: string;
          nome: string;
          ordem: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          ativa?: boolean;
          cor: string;
          created_at?: string;
          icone?: string | null;
          id?: string;
          nome: string;
          ordem?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          ativa?: boolean;
          cor?: string;
          created_at?: string;
          icone?: string | null;
          id?: string;
          nome?: string;
          ordem?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          chave: string | null;
          created_at: string;
          danfe_url: string | null;
          id: string;
          numero: string | null;
          order_id: string;
          serie: string | null;
          status: string;
          updated_at: string;
          xml_url: string | null;
        };
        Insert: {
          chave?: string | null;
          created_at?: string;
          danfe_url?: string | null;
          id?: string;
          numero?: string | null;
          order_id: string;
          serie?: string | null;
          status: string;
          updated_at?: string;
          xml_url?: string | null;
        };
        Update: {
          chave?: string | null;
          created_at?: string;
          danfe_url?: string | null;
          id?: string;
          numero?: string | null;
          order_id?: string;
          serie?: string | null;
          status?: string;
          updated_at?: string;
          xml_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          created_at: string;
          etapa: string;
          id: string;
          order_id: string;
          run_at: string;
          status: Database["public"]["Enums"]["job_status"];
          tentativas: number;
          tipo: Database["public"]["Enums"]["job_type"];
          ultimo_erro: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          etapa?: string;
          id?: string;
          order_id: string;
          run_at?: string;
          status?: Database["public"]["Enums"]["job_status"];
          tentativas?: number;
          tipo: Database["public"]["Enums"]["job_type"];
          ultimo_erro?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          etapa?: string;
          id?: string;
          order_id?: string;
          run_at?: string;
          status?: Database["public"]["Enums"]["job_status"];
          tentativas?: number;
          tipo?: Database["public"]["Enums"]["job_type"];
          ultimo_erro?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_events: {
        Row: {
          created_at: string;
          detalhe: NonNullable<Json>;
          evento: string;
          id: string;
          order_id: string;
        };
        Insert: {
          created_at?: string;
          detalhe?: NonNullable<Json>;
          evento: string;
          id?: string;
          order_id: string;
        };
        Update: {
          created_at?: string;
          detalhe?: NonNullable<Json>;
          evento?: string;
          id?: string;
          order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          ncm: string;
          nome: string;
          order_id: string;
          preco_cents: number;
          quantidade: number;
          sku: string;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          ncm: string;
          nome: string;
          order_id: string;
          preco_cents: number;
          quantidade: number;
          sku: string;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          ncm?: string;
          nome?: string;
          order_id?: string;
          preco_cents?: number;
          quantidade?: number;
          sku?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants_public";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          cliente_cpf: string;
          cliente_email: string | null;
          cliente_nome: string;
          created_at: string;
          desconto_cents: number;
          endereco: NonNullable<Json>;
          estoque_baixado_em: string | null;
          estoque_devolvido_em: string | null;
          frete_cents: number;
          frete_servico: string | null;
          id: string;
          numero: string;
          payment_method: Database["public"]["Enums"]["payment_method"];
          status: Database["public"]["Enums"]["order_status"];
          subtotal_cents: number;
          total_cents: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          cliente_cpf: string;
          cliente_email?: string | null;
          cliente_nome: string;
          created_at?: string;
          desconto_cents?: number;
          endereco: NonNullable<Json>;
          estoque_baixado_em?: string | null;
          estoque_devolvido_em?: string | null;
          frete_cents?: number;
          frete_servico?: string | null;
          id?: string;
          numero?: string;
          payment_method: Database["public"]["Enums"]["payment_method"];
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_cents: number;
          total_cents: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          cliente_cpf?: string;
          cliente_email?: string | null;
          cliente_nome?: string;
          created_at?: string;
          desconto_cents?: number;
          endereco?: NonNullable<Json>;
          estoque_baixado_em?: string | null;
          estoque_devolvido_em?: string | null;
          frete_cents?: number;
          frete_servico?: string | null;
          id?: string;
          numero?: string;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_cents?: number;
          total_cents?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          created_at: string;
          id: string;
          metodo: Database["public"]["Enums"]["payment_method"];
          mp_payment_id: string;
          order_id: string;
          parcelas: number;
          raw: NonNullable<Json>;
          status: string;
          updated_at: string;
          valor_cents: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metodo: Database["public"]["Enums"]["payment_method"];
          mp_payment_id: string;
          order_id: string;
          parcelas?: number;
          raw?: NonNullable<Json>;
          status: string;
          updated_at?: string;
          valor_cents: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          metodo?: Database["public"]["Enums"]["payment_method"];
          mp_payment_id?: string;
          order_id?: string;
          parcelas?: number;
          raw?: NonNullable<Json>;
          status?: string;
          updated_at?: string;
          valor_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: {
          alt: string;
          created_at: string;
          id: string;
          ordem: number;
          product_id: string;
          url: string;
        };
        Insert: {
          alt?: string;
          created_at?: string;
          id?: string;
          ordem?: number;
          product_id: string;
          url: string;
        };
        Update: {
          alt?: string;
          created_at?: string;
          id?: string;
          ordem?: number;
          product_id?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_listing";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          altura_cm: number;
          comprimento_cm: number;
          created_at: string;
          custo_cents: number | null;
          ean: string | null;
          estoque: number;
          id: string;
          largura_cm: number;
          nome: string;
          peso_g: number;
          preco_cents: number;
          preco_de_cents: number | null;
          product_id: string;
          sku: string;
          updated_at: string;
        };
        Insert: {
          altura_cm: number;
          comprimento_cm: number;
          created_at?: string;
          custo_cents?: number | null;
          ean?: string | null;
          estoque?: number;
          id?: string;
          largura_cm: number;
          nome?: string;
          peso_g: number;
          preco_cents: number;
          preco_de_cents?: number | null;
          product_id: string;
          sku: string;
          updated_at?: string;
        };
        Update: {
          altura_cm?: number;
          comprimento_cm?: number;
          created_at?: string;
          custo_cents?: number | null;
          ean?: string | null;
          estoque?: number;
          id?: string;
          largura_cm?: number;
          nome?: string;
          peso_g?: number;
          preco_cents?: number;
          preco_de_cents?: number | null;
          product_id?: string;
          sku?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_listing";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          ativo: boolean;
          brand_id: string | null;
          busca: unknown;
          category_id: string;
          cfop: string;
          created_at: string;
          descricao: string;
          destaque: boolean;
          id: string;
          ncm: string;
          nome: string;
          origem: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          brand_id?: string | null;
          busca?: never;
          category_id: string;
          cfop?: string;
          created_at?: string;
          descricao?: string;
          destaque?: boolean;
          id?: string;
          ncm: string;
          nome: string;
          origem?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          brand_id?: string | null;
          busca?: never;
          category_id?: string;
          cfop?: string;
          created_at?: string;
          descricao?: string;
          destaque?: boolean;
          id?: string;
          ncm?: string;
          nome?: string;
          origem?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          cpf: string | null;
          created_at: string;
          id: string;
          nome: string;
          role: Database["public"]["Enums"]["user_role"];
          telefone: string | null;
          terms_accepted_at: string | null;
          updated_at: string;
        };
        Insert: {
          cpf?: string | null;
          created_at?: string;
          id: string;
          nome?: string;
          role?: Database["public"]["Enums"]["user_role"];
          telefone?: string | null;
          terms_accepted_at?: string | null;
          updated_at?: string;
        };
        Update: {
          cpf?: string | null;
          created_at?: string;
          id?: string;
          nome?: string;
          role?: Database["public"]["Enums"]["user_role"];
          telefone?: string | null;
          terms_accepted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          cnpj: string | null;
          cpf_vendedor: string | null;
          email_contato: string | null;
          endereco_empresa: string | null;
          endereco_origem: Json | null;
          horario_atendimento: string | null;
          id: boolean;
          ie: string | null;
          printer_id: string | null;
          razao_social: string | null;
          regime_tributario: string | null;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          cnpj?: string | null;
          cpf_vendedor?: string | null;
          email_contato?: string | null;
          endereco_empresa?: string | null;
          endereco_origem?: Json | null;
          horario_atendimento?: string | null;
          id?: boolean;
          ie?: string | null;
          printer_id?: string | null;
          razao_social?: string | null;
          regime_tributario?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          cnpj?: string | null;
          cpf_vendedor?: string | null;
          email_contato?: string | null;
          endereco_empresa?: string | null;
          endereco_origem?: Json | null;
          horario_atendimento?: string | null;
          id?: boolean;
          ie?: string | null;
          printer_id?: string | null;
          razao_social?: string | null;
          regime_tributario?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [];
      };
      shipments: {
        Row: {
          created_at: string;
          etiqueta_url: string | null;
          id: string;
          me_order_id: string | null;
          order_id: string;
          rastreio: string | null;
          servico: string | null;
          status: string;
          transportadora: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          etiqueta_url?: string | null;
          id?: string;
          me_order_id?: string | null;
          order_id: string;
          rastreio?: string | null;
          servico?: string | null;
          status: string;
          transportadora?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          etiqueta_url?: string | null;
          id?: string;
          me_order_id?: string | null;
          order_id?: string;
          rastreio?: string | null;
          servico?: string | null;
          status?: string;
          transportadora?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_logs: {
        Row: {
          created_at: string;
          external_id: string;
          id: string;
          origem: string;
          payload: NonNullable<Json>;
          processed_at: string | null;
        };
        Insert: {
          created_at?: string;
          external_id: string;
          id?: string;
          origem: string;
          payload: NonNullable<Json>;
          processed_at?: string | null;
        };
        Update: {
          created_at?: string;
          external_id?: string;
          id?: string;
          origem?: string;
          payload?: NonNullable<Json>;
          processed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      product_listing: {
        Row: {
          categoria_nome: string | null;
          categoria_slug: string | null;
          created_at: string | null;
          destaque: boolean | null;
          estoque: number | null;
          id: string | null;
          imagem_alt: string | null;
          imagem_url: string | null;
          marca_nome: string | null;
          marca_slug: string | null;
          nome: string | null;
          preco_cents: number | null;
          preco_de_cents: number | null;
          preco_max_cents: number | null;
          slug: string | null;
        };
        Relationships: [];
      };
      product_variants_public: {
        Row: {
          altura_cm: number | null;
          comprimento_cm: number | null;
          created_at: string | null;
          ean: string | null;
          estoque: number | null;
          id: string | null;
          largura_cm: number | null;
          nome: string | null;
          peso_g: number | null;
          preco_cents: number | null;
          preco_de_cents: number | null;
          product_id: string | null;
          sku: string | null;
        };
        Insert: {
          altura_cm?: number | null;
          comprimento_cm?: number | null;
          created_at?: string | null;
          ean?: string | null;
          estoque?: number | null;
          id?: string | null;
          largura_cm?: number | null;
          nome?: string | null;
          peso_g?: number | null;
          preco_cents?: number | null;
          preco_de_cents?: number | null;
          product_id?: string | null;
          sku?: string | null;
        };
        Update: {
          altura_cm?: number | null;
          comprimento_cm?: number | null;
          created_at?: string | null;
          ean?: string | null;
          estoque?: number | null;
          id?: string | null;
          largura_cm?: number | null;
          nome?: string | null;
          peso_g?: number | null;
          preco_cents?: number | null;
          preco_de_cents?: number | null;
          product_id?: string | null;
          sku?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_listing";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      admin_dashboard: { Args: Record<PropertyKey, never>; Returns: Json };
      admin_save_product: { Args: { p_product: Json }; Returns: Json };
      cart_add: {
        Args: { p_cart_id: string; p_quantidade: number; p_variant_id: string };
        Returns: number;
      };
      cart_max_quantity: { Args: { p_variant_id: string }; Returns: number };
      cart_merge: {
        Args: { p_session_id: string; p_user_id: string };
        Returns: undefined;
      };
      cart_resolve: {
        Args: { p_session_id?: string; p_user_id?: string };
        Returns: string;
      };
      cart_set_quantity: {
        Args: { p_cart_id: string; p_item_id: string; p_quantidade: number };
        Returns: number;
      };
      claim_jobs: {
        Args: {
          p_limit?: number;
          p_tipos: Database["public"]["Enums"]["job_type"][];
        };
        Returns: {
          created_at: string;
          etapa: string;
          id: string;
          order_id: string;
          run_at: string;
          status: Database["public"]["Enums"]["job_status"];
          tentativas: number;
          tipo: Database["public"]["Enums"]["job_type"];
          ultimo_erro: string | null;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "jobs";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      cleanup_old_data: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      delete_account: { Args: { p_user_id: string }; Returns: undefined };
      delete_address: { Args: { p_address_id: string }; Returns: undefined };
      enqueue_job: {
        Args: {
          p_etapa: string;
          p_order_id: string;
          p_tipo: Database["public"]["Enums"]["job_type"];
        };
        Returns: undefined;
      };
      f_unaccent: { Args: { "": string }; Returns: string };
      format_order_number: { Args: { p_n: number }; Returns: string };
      hit_rate_limit: {
        Args: { p_chave: string; p_janela_segundos: number; p_max: number };
        Returns: boolean;
      };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      jobs_tick: { Args: Record<PropertyKey, never>; Returns: undefined };
      keep_warm: { Args: Record<PropertyKey, never>; Returns: undefined };
      next_order_number: { Args: Record<PropertyKey, never>; Returns: string };
      order_transition_allowed: {
        Args: {
          p_from: Database["public"]["Enums"]["order_status"];
          p_to: Database["public"]["Enums"]["order_status"];
        };
        Returns: boolean;
      };
      prefix_tsquery: { Args: { p_text: string }; Returns: unknown };
      reserve_stock: { Args: { p_order_id: string }; Returns: undefined };
      restore_stock: { Args: { p_order_id: string }; Returns: undefined };
      save_address: {
        Args: {
          p_address_id?: string;
          p_bairro: string;
          p_cep: string;
          p_cidade: string;
          p_complemento?: string;
          p_numero: string;
          p_principal: boolean;
          p_rua: string;
          p_uf: string;
        };
        Returns: string;
      };
      search_products: {
        Args: {
          p_categoria?: string;
          p_filtro?: string;
          p_marca?: string;
          p_ordem?: string;
          p_pagina?: number;
          p_por_pagina?: number;
          p_preco_max?: number;
          p_preco_min?: number;
          p_q?: string;
        };
        Returns: {
          categoria_nome: string;
          categoria_slug: string;
          created_at: string;
          destaque: boolean;
          estoque: number;
          id: string;
          imagem_alt: string;
          imagem_url: string;
          marca_nome: string;
          marca_slug: string;
          nome: string;
          preco_cents: number;
          preco_de_cents: number;
          preco_max_cents: number;
          slug: string;
          total: number;
        }[];
      };
      set_main_address: { Args: { p_address_id: string }; Returns: undefined };
      set_order_status: {
        Args: {
          p_detalhe?: Json;
          p_order_id: string;
          p_status: Database["public"]["Enums"]["order_status"];
        };
        Returns: undefined;
      };
      store_info: { Args: Record<PropertyKey, never>; Returns: Json };
      suggest_products: {
        Args: { p_q: string };
        Returns: {
          categoria_slug: string;
          nome: string;
          slug: string;
        }[];
      };
    };
    Enums: {
      job_status: "pending" | "running" | "done" | "failed";
      job_type: "notify" | "invoice" | "label" | "print" | "email";
      order_status:
        | "pending_payment"
        | "paid"
        | "invoiced"
        | "label_ready"
        | "printed"
        | "shipped"
        | "delivered"
        | "canceled"
        | "refunded";
      payment_method: "pix" | "boleto" | "card";
      user_role: "customer" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      job_status: ["pending", "running", "done", "failed"],
      job_type: ["notify", "invoice", "label", "print", "email"],
      order_status: [
        "pending_payment",
        "paid",
        "invoiced",
        "label_ready",
        "printed",
        "shipped",
        "delivered",
        "canceled",
        "refunded",
      ],
      payment_method: ["pix", "boleto", "card"],
      user_role: ["customer", "admin"],
    },
  },
} as const;
