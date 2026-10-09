"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const plans = [
  {
    name: "Free",
    price: "0",
    period: "für immer",
    description: "Zum Ausprobieren und für kleine Projekte",
    features: [
      "5 KI-Anfragen pro Tag",
      "Basis-Analyse",
      "Community-Support",
      "1 Projekt",
    ],
    cta: "Kostenlos starten",
    popular: false,
    stripePriceId: null,
  },
  {
    name: "Pro",
    price: "19",
    period: "pro Monat",
    description: "Für wachsende Teams und Power-User",
    features: [
      "Unbegrenzte KI-Anfragen",
      "Erweiterte Analyse & Berichte",
      "Prioritäts-Support",
      "10 Projekte",
      "API-Zugang",
      "Export (PDF, CSV)",
    ],
    cta: "Pro wählen",
    popular: true,
    stripePriceId: "price_1QProGrowMaster001",
  },
  {
    name: "Enterprise",
    price: "99",
    period: "pro Monat",
    description: "Für Unternehmen mit hohen Anforderungen",
    features: [
      "Alles aus Pro",
      "Unbegrenzte Projekte",
      "Dedizierter Account-Manager",
      "SLA-Garantie",
      "Custom Integration",
      "On-Premise-Option",
      "SSO & SAML",
    ],
    cta: "Kontakt aufnehmen",
    popular: false,
    stripePriceId: "price_1QEnterpriseGrowMaster001",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheckout(priceId: string | null) {
    if (!priceId) {
      router.push("/register");
      return;
    }

    const token = localStorage.getItem("jwt_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ price_id: priceId }),
      });

      if (res.status === 503) {
        setError("Stripe ist aktuell nicht konfiguriert. Bitte versuche es später erneut.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? `HTTP ${res.status}`);
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein unbekannter Fehler ist aufgetreten."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Wähle deinen Plan
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Starte kostenlos und skaliere, wenn du bereit bist. Keine versteckten Kosten.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? "border-blue-500 shadow-lg shadow-blue-100"
                  : "border-slate-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                  Beliebt
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  {plan.name}
                </h2>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">
                  €{plan.price}
                </span>
                <span className="text-slate-500 ml-1">{plan.stripePriceId ? plan.period : ""}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.stripePriceId)}
                disabled={loading}
                className={`w-full py-3 px-6 rounded-xl font-medium transition-colors ${
                  plan.popular
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? "Lädt..." : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-8 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
            Häufige Fragen
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Kann ich jederzeit kündigen?",
                a: "Ja, du kannst jederzeit kündigen. Dein Zugang bleibt bis zum Ende des Abrechnungszeitraums aktiv.",
              },
              {
                q: "Gibt es eine kostenlose Testphase?",
                a: "Der Free-Plan ist kostenlos und für immer. Pro und Enterprise kannst du 14 Tage kostenlos testen.",
              },
              {
                q: "Welche Zahlungsmethoden werden akzeptiert?",
                a: "Wir akzeptieren Kreditkarte, SEPA-Lastschrift und PayPal.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-slate-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
