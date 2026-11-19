import { useEffect, useState } from "react";
import {
  Link, Route, Routes, useParams
} from "react-router-dom";
import {
  UploadCloud, Copy, ArrowLeft
} from "lucide-react";

const API_BASE = "https://videyclv-api.angelokasino2.workers.dev";
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

function Header() {
  return (
    <header className="topbar">
      <Link className="brand" to="/">
        VideyClv<span>.</span>
      </Link>
    </header>
  );
}

function Home() {
  return (
    <>
      <section className="hero">
        <div className="eyebrow">UPLOAD • SHARE • WATCH</div>
        <h1>Share videos<br/><em>with ease.</em></h1>
        <p>Upload a video and share its link.</p>
        <Link className="primary" to="/upload">
          <UploadCloud size={18}/> Upload video
        </Link>
      </section>
    </>
  );
}

function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [message, setMessage] = useState("");

  async function upload(e) {
    e.preventDefault();

    if (!file) {
      setMessage("Please choose a video file first.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage("Video format must be MP4, MOV, or WebM.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setMessage("Maximum file size is 100 MB.");
      return;
    }

    setUploading(true);
    setUploadPercent(0);
    setMessage("");

    try {
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_BASE}/api/upload`);
        xhr.responseType = "json";
        xhr.timeout = 600000;
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.addEventListener("progress", event => {
          if (event.lengthComputable) {
            setUploadPercent(Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          const data = xhr.response || {};
          if (xhr.status < 200 || xhr.status >= 300 || !data.success || !data.id) {
            reject(new Error(data.error || `Upload failed (HTTP ${xhr.status}). Please try again.`));
            return;
          }
          resolve(data);
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Connection lost. Check your internet and try uploading again."));
        });

        xhr.addEventListener("timeout", () => {
          reject(new Error("Upload terlalu lama dan waktu tunggu habis. Please try again."));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled."));
        });

        xhr.send(file);
      });

      setUploadPercent(100);
      window.location.href = `/v/${encodeURIComponent(result.id)}`;
    } catch (error) {
      setMessage(error.message || "Upload failed karena kesalahan jaringan. Please try again.");
      setUploading(false);
    }
  }

  return (
    <main className="narrow">
      <Link className="back" to="/">
        <ArrowLeft size={16}/> Back
      </Link>

      <div className="eyebrow">UPLOAD VIDEO</div>
      <h1>Add a video</h1>

      <form className="panel form" onSubmit={upload}>
        <label className="file-picker">
          <UploadCloud size={28}/>
          <b>{file ? file.name : "Choose a video from your device"}</b>
          <small>MP4, MOV, WebM • Max. 100 MB</small>
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            disabled={uploading}
            onChange={e => {
              setFile(e.target.files?.[0] || null);
              setMessage("");
              setUploadPercent(0);
            }}
          />
        </label>

        {uploading && (
          <div style={{ margin: "12px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <small>{uploadPercent >= 100 ? "Saving video…" : "Uploading video…"}</small>
              <b>{uploadPercent}%</b>
            </div>
            <progress
              value={uploadPercent}
              max="100"
              style={{ width: "100%", height: "10px" }}
              aria-label="Progres upload"
            />
          </div>
        )}

        {message && <p className="error" role="alert">{message}</p>}

        <button className="primary" disabled={uploading || !file}>
          {uploading ? "Uploading…" : "Upload sekarang"}
        </button>

        <small className="muted">
          Only upload videos you own or have permission to share.
        </small>
      </form>
    </main>
  );
}

function VideoPage() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;

    async function load() {
      try {
        const response = await fetch(
          `${API_BASE}/api/video/${encodeURIComponent(id)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Video not found.");
        }

        if (live) setVideo(data);
      } catch (error) {
        if (live) {
          setError(error.message || "Failed to load video.");
        }
      }
    }

    load();

    return () => {
      live = false;
    };
  }, [id]);

  useEffect(() => {
    if (!video) return;

    // Monetag scripts are intentionally loaded only on the video watch page.
    // The homepage and upload page do not load video-page ad scripts.
    const zones = [
      { id: "12289038", src: "https://n6wxm.com/vignette.min.js" },
      { id: "12288957", src: "https://al5sm.com/tag.min.js" }
    ];

    zones.forEach(({ id: zoneId, src }) => {
      if (document.querySelector(`script[data-videyclv-zone="${zoneId}"]`)) return;

      const script = document.createElement("script");
      script.dataset.zone = zoneId;
      script.dataset.videyclvZone = zoneId;
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    });
  }, [video]);

  if (error) {
    return (
      <main className="narrow">
        <h1>{error}</h1>
        <Link to="/">Back</Link>
      </main>
    );
  }

  if (!video) {
    return <main className="narrow">Loading video…</main>;
  }

  return (
    <main className="watch">
      <div className="player">
        <video
          controls
          playsInline
          preload="metadata"
          src={video.playback_url}
        >
          Your browser does not support video playback.
        </video>
      </div>

      <h1>{video.title}</h1>

      <div className="share">
        <input readOnly value={window.location.href}/>

        <button
          className="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
            } catch {
              setError("Could not copy the link. Copy the address from your browser.");
            }
          }}
        >
          <Copy size={16}/>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

    </main>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />

      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/v/:id" element={<VideoPage />} />
        </Routes>
      </div>

      <footer>
        © {new Date().getFullYear()} VideyClv. Upload and share responsibly.
      </footer>
    </div>
  );
}
