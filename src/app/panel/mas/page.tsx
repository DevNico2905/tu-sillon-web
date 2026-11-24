import type { Metadata } from "next";
import { MenuMas } from "@/components/panel/menu-mas";

export const metadata: Metadata = { title: "Más" };

export default function PaginaMas() {
  return <MenuMas />;
}
