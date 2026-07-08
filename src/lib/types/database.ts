// Supabase データベース型定義
// スキーマ変更時は `npx supabase gen types typescript` での再生成を推奨

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "viewer";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      allowed_emails: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      presentations: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          presented_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          presented_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          presented_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "presentations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      materials: {
        Row: {
          id: string;
          presentation_id: string;
          file_name: string;
          storage_path: string;
          file_type: string;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          presentation_id: string;
          file_name: string;
          storage_path: string;
          file_type: string;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          presentation_id?: string;
          file_name?: string;
          storage_path?: string;
          file_type?: string;
          file_size?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "materials_presentation_id_fkey";
            columns: ["presentation_id"];
            isOneToOne: false;
            referencedRelation: "presentations";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          presentation_id: string;
          transcript: string | null;
          summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          presentation_id: string;
          transcript?: string | null;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          presentation_id?: string;
          transcript?: string | null;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_presentation_id_fkey";
            columns: ["presentation_id"];
            isOneToOne: true;
            referencedRelation: "presentations";
            referencedColumns: ["id"];
          },
        ];
      };
      tag_categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          category_id: string;
          value: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          value: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          value?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "tag_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      presentation_tags: {
        Row: {
          presentation_id: string;
          tag_id: string;
        };
        Insert: {
          presentation_id: string;
          tag_id: string;
        };
        Update: {
          presentation_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "presentation_tags_presentation_id_fkey";
            columns: ["presentation_id"];
            isOneToOne: false;
            referencedRelation: "presentations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "presentation_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_email_allowed: {
        Args: { check_email: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Profile = Tables<"profiles">;
export type AllowedEmail = Tables<"allowed_emails">;
export type Project = Tables<"projects">;
export type Presentation = Tables<"presentations">;
export type Material = Tables<"materials">;
export type Comment = Tables<"comments">;
export type TagCategory = Tables<"tag_categories">;
export type Tag = Tables<"tags">;
