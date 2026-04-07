"use client";

import { FormEvent, useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [pseudo, setPseudo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscordLoading, setIsDiscordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUserFound, setIsUserFound] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsUserFound(false);

    const trimmedPseudo = pseudo.trim();
    if (!trimmedPseudo) {
      setError("Merci de renseigner un pseudo.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/check-pseudo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: trimmedPseudo }),
      });

      const data = (await response.json()) as {
        exists?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      if (!data.exists) {
        setError("Pseudo introuvable.");
        return;
      }

      setIsUserFound(true);
    } catch {
      setError("Impossible de verifier le pseudo pour le moment.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDiscordLogin() {
    setError(null);
    setIsDiscordLoading(true);

    try {
      const response = await fetch("/api/auth/prepare-discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: pseudo.trim() }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Impossible de preparer la connexion Discord.");
        return;
      }

      window.location.href = "/api/auth/signin/discord";
    } catch {
      setError("Impossible de preparer la connexion Discord.");
    } finally {
      setIsDiscordLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Connexion</h1>
        <p className={styles.subtitle}>Entre ton pseudo pour continuer.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles.input}
            placeholder="Ton pseudo"
            value={pseudo}
            onChange={(event) => setPseudo(event.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className={styles.button} disabled={isLoading}>
            {isLoading ? "Verification..." : "Verifier"}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}

        {isUserFound && (
          <button
            type="button"
            className={styles.discordButton}
            onClick={handleDiscordLogin}
            disabled={isDiscordLoading}
          >
            {isDiscordLoading
              ? "Connexion Discord..."
              : "Se connecter via Discord"}
          </button>
        )}
      </section>
    </main>
  );
}
