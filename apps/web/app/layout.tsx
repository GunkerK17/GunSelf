import type { Metadata } from "next";
import { Space_Grotesk, Teko } from "next/font/google";
import Script from "next/script";

import { LanguageProvider } from "@/components/providers/language-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space"
});
const teko = Teko({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "GunSelf",
  description: "Personal Life Operating System",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html className={`${spaceGrotesk.variable} ${teko.variable}`} lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="gunself-hydration-guard" strategy="beforeInteractive">
          {`
            (function () {
              var blocked = [/^bis_skin_checked$/, /^__processed_/, /^data-new-gr-c-s-check-loaded$/, /^data-gr-ext-installed$/];
              function shouldDrop(name) {
                for (var i = 0; i < blocked.length; i++) {
                  if (blocked[i].test(name)) return true;
                }
                return false;
              }
              function scrub(el) {
                if (!el || !el.attributes) return;
                for (var i = el.attributes.length - 1; i >= 0; i--) {
                  var attr = el.attributes[i];
                  if (attr && shouldDrop(attr.name)) {
                    el.removeAttribute(attr.name);
                  }
                }
              }
              function scrubAll() {
                var nodes = document.querySelectorAll('*');
                for (var i = 0; i < nodes.length; i++) scrub(nodes[i]);
              }
              scrubAll();
              var obs = new MutationObserver(function (mutations) {
                for (var i = 0; i < mutations.length; i++) {
                  var m = mutations[i];
                  if (m.type === 'attributes' && m.target) scrub(m.target);
                  if (m.addedNodes && m.addedNodes.length) {
                    for (var j = 0; j < m.addedNodes.length; j++) {
                      var node = m.addedNodes[j];
                      if (node && node.nodeType === 1) {
                        scrub(node);
                        if (node.querySelectorAll) {
                          var children = node.querySelectorAll('*');
                          for (var k = 0; k < children.length; k++) scrub(children[k]);
                        }
                      }
                    }
                  }
                }
              });
              obs.observe(document.documentElement, { subtree: true, childList: true, attributes: true });
            })();
          `}
        </Script>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
