import { env } from "./env";

export function adminTokenTtlMs(): number {
  return env.adminSessionTtlMinutes * 60 * 1000;
}

export function adminTokenTtlSeconds(): number {
  return Math.floor(adminTokenTtlMs() / 1000);
}
