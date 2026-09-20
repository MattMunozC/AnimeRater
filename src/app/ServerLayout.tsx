import type { ReactNode } from "react";
import AnimeCatalogProvider from "./providers/AnimeCatalogProvider";

type ServerLayoutProps = {
  children: ReactNode;
};

export default function ServerLayout({ children }: ServerLayoutProps) {
  return (
    <AnimeCatalogProvider>
      <main className="app-shell">{children}</main>
    </AnimeCatalogProvider>
  );
}
