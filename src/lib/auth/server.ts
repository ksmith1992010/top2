import { headers } from "next/headers";
import { getAuth } from "@/lib/auth/auth";

export async function getSession() {
  return getAuth().api.getSession({
    headers: await headers(),
  });
}
