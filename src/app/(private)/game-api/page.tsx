"use client";

import { useEffect, useState } from "react";

export default function ProxyPage() {
  const [iframeUrl, setIframeUrl] = useState("");

  useEffect(() => {
    // Simulate fetching session cookie from login route
    fetch("/api/login-api", {
      method: "POST",
    })
      .then((res) => res.json())
      .then(async (data) => {
        const session = data.sessionData?.PHPSESSID;
        if (session) {
          await fetch("/api/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: `PHPSESSID=${session}` }),
          });
          setIframeUrl(
            "/api/proxy?url=/index.php?act=hall&area=edit&hallId=941370"
          );
        }
      });
  }, []);

  if (!iframeUrl) return <p>Loading...</p>;

  return (
    <iframe
      src={iframeUrl}
      style={{ width: "100%", height: "90vh", border: "none" }}
    ></iframe>
  );
}
