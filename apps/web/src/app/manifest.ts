import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NOD",
    short_name: "NOD",
    description: "Save technical articles and build your AI-powered second brain.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#000000",
    icons: [
      {
        src: "/brand/nod-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/nod-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
