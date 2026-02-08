import { mountVmlPlayer, type VmlPlayerOptions } from "./runtime.js";

const BOOL_FALSE = new Set(["false", "0", "no", "off"]);

const readBoolAttr = (el: HTMLElement, name: string, fallback: boolean) => {
  if (!el.hasAttribute(name)) return fallback;
  const raw = el.getAttribute(name);
  if (raw == null || raw === "") return true;
  return !BOOL_FALSE.has(raw.toLowerCase());
};

const readClockMode = (el: HTMLElement) => {
  const raw = el.getAttribute("clock-mode");
  if (raw === "bounded" || raw === "live") return raw;
  return "live" as const;
};

const readInlineXml = (el: HTMLElement): string | null => {
  const inline = el.querySelector("vml, videoml, video-ml") as Element | null;
  if (inline) return inline.outerHTML;
  const text = el.textContent?.trim();
  return text ? text : null;
};

export const defineVmlPlayer = () => {
  if (typeof window === "undefined" || !("customElements" in window)) return;
  if (customElements.get("vml-player")) return;

  class VmlPlayerElement extends HTMLElement {
    static get observedAttributes() {
      return ["src", "auto-play", "loop", "clock-mode", "sync-group"];
    }

    private cleanup: (() => void) | null = null;
    private abort?: AbortController;
    private container: HTMLDivElement | null = null;

    connectedCallback() {
      if (!this.shadowRoot) {
        const shadow = this.attachShadow({ mode: "open" });
        const container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.position = "relative";
        container.style.overflow = "hidden";
        shadow.appendChild(container);
        this.container = container;
      }
      this.style.display = this.style.display || "block";
      void this.renderPlayer();
    }

    disconnectedCallback() {
      this.abort?.abort();
      this.cleanup?.();
      this.cleanup = null;
    }

    attributeChangedCallback() {
      void this.renderPlayer();
    }

    private async resolveXml(): Promise<string | null> {
      const src = this.getAttribute("src");
      if (src) {
        this.abort?.abort();
        this.abort = new AbortController();
        const res = await fetch(src, { signal: this.abort.signal });
        if (!res.ok) {
          throw new Error(`Failed to load VML: ${res.status}`);
        }
        return await res.text();
      }
      return readInlineXml(this);
    }

    private async renderPlayer() {
      if (!this.container) return;
      this.cleanup?.();
      this.cleanup = null;

      let xml: string | null = null;
      try {
        xml = await this.resolveXml();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load VML";
        this.dispatchEvent(new CustomEvent("vml:error", { detail: { message } }));
        return;
      }
      if (!xml) {
        this.dispatchEvent(new CustomEvent("vml:error", { detail: { message: "No VML found." } }));
        return;
      }

      const options: VmlPlayerOptions = {
        xml,
        autoPlay: readBoolAttr(this, "auto-play", true),
        loop: readBoolAttr(this, "loop", false),
        clockMode: readClockMode(this),
        syncGroup: this.getAttribute("sync-group") ?? undefined,
        onError: (message) => {
          if (message) {
            this.dispatchEvent(new CustomEvent("vml:error", { detail: { message } }));
          }
        },
      };

      this.cleanup = mountVmlPlayer(this.container, options);
    }
  }

  customElements.define("vml-player", VmlPlayerElement);
};
