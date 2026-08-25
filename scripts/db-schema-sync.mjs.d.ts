export const REQUIRED_SCHEMA: Record<
  string,
  {
    columns: Record<string, string>;
    create: string;
    indexes: Array<{ name: string; unique: boolean; columns: string[] }>;
  }
>;
