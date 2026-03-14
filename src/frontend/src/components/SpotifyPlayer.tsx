import { Music2, X } from "lucide-react";
import { useState } from "react";
import { useGetSpotifyUrl } from "../hooks/useQueries";

/**
 * Converts any open.spotify.com URL to an embed URL with dark theme.
 */
function toEmbedUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!url.hostname.includes("spotify.com")) return null;
    if (url.pathname.startsWith("/embed")) {
      url.searchParams.set("theme", "0");
      return url.toString();
    }
    const embedPath = url.pathname.replace(/^\//, "embed/");
    return `https://open.spotify.com/${embedPath}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}

interface SpotifyPlayerProps {
  visible: boolean;
  onClose: () => void;
  isPlaying?: boolean;
}

export default function SpotifyPlayer({
  visible,
  onClose,
  isPlaying,
}: SpotifyPlayerProps) {
  const { data: rawUrl } = useGetSpotifyUrl();
  const [loaded, setLoaded] = useState(false);

  const embedUrl = rawUrl ? toEmbedUrl(rawUrl) : null;

  if (!embedUrl || !visible) return null;

  // When playing, float to top; otherwise stick to bottom
  const positionStyle = isPlaying
    ? { top: 0, bottom: "auto", paddingTop: 12, paddingBottom: 0 }
    : { bottom: 0, top: "auto", paddingTop: 0, paddingBottom: 16 };

  return (
    <section
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        zIndex: 60,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        transition: "top 0.4s ease, bottom 0.4s ease",
        ...positionStyle,
        paddingLeft: 16,
        paddingRight: 16,
      }}
      aria-label="Spotify Music Player"
      data-ocid="spotify.player.panel"
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 480,
          pointerEvents: "all",
          background: "rgba(2, 4, 15, 0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "2px solid #00FFFF",
          borderRadius: 20,
          boxShadow: isPlaying
            ? "0 0 40px rgba(0,255,255,0.8), 0 4px 32px rgba(0,0,0,0.7)"
            : "0 0 24px rgba(0,255,255,0.5), 0 8px 32px rgba(0,0,0,0.6)",
          padding: 12,
          transition:
            "box-shadow 0.3s ease, transform 0.25s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 0 48px rgba(0,255,255,0.9), 0 12px 40px rgba(0,0,0,0.7)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = isPlaying
            ? "0 0 40px rgba(0,255,255,0.8), 0 4px 32px rgba(0,0,0,0.7)"
            : "0 0 24px rgba(0,255,255,0.5), 0 8px 32px rgba(0,0,0,0.6)";
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: -10,
            right: -10,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#02040f",
            border: "1px solid #00FFFF",
            color: "#00FFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 2,
          }}
          aria-label="Hide player"
          data-ocid="spotify.player.close_button"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {!loaded && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "16px 0",
              animation: "navyPulse 1.4s ease-in-out infinite",
            }}
            aria-hidden="true"
          >
            <Music2
              className="w-5 h-5 animate-pulse"
              style={{ color: "#00FFFF" }}
            />
            <span className="text-xs" style={{ color: "#00FFFF" }}>
              Loading player…
            </span>
          </div>
        )}

        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        >
          <iframe
            src={embedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify Player"
            onLoad={() => setLoaded(true)}
            style={{ borderRadius: "12px" }}
          />
        </div>
      </div>
    </section>
  );
}
