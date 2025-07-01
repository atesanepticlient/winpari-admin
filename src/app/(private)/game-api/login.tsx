"use client";

import { useLoginApiMutation } from "@/lib/features/gameApiSlice";
import { useEffect, useState } from "react";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cookies, setCookies] = useState(null);

  const [loginApi, { isLoading }] = useLoginApiMutation();

  useEffect(() => {
    loginApi({})
      .unwrap()
      .then((res) => {
        console.log({ res });
      })
      .catch((error) => {
        console.log({ error });
      });
  }, []);

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {cookies && (
        <div>
          <h3>Received Cookies:</h3>
          <pre>{JSON.stringify(cookies, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
