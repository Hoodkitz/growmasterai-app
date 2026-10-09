"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const features = [
  {
    icon: "🌱",
    title: "KI-gestützte Analyse",
    description: "Automatische Analyse deiner Pflanzen und Wachstumsbedingungen mit modernster KI-Technologie.",
  },
  {
    icon: "📊",
    title: "Detaillierte Berichte",
    description: "Erhalte wertvolle Insights und Empfehlungen für optimales Wachstum.",
  },
  {
    icon: "🔔",
    title: "Smarte Benachrichtigungen",
    description: "Verpasse nie wieder den richtigen Zeitpunkt für Gießen, Düngen oder Ernten.",
  },
  {
    icon: "📱",
    title: "Überall verfügbar",
    description: "Nutze GrowMaster auf dem Smartphone, Tablet oder Desktop.",
  },
  {
    icon: "🌍",
    title: "Community",
    description: "Tausche dich mit anderen Gärtnern aus und teile deine Erfolge.",
  },
  {
    icon: "🔒",
    title: "Datenschutz",
    description: "Deine Daten gehören dir. DSGVO-konform und sicher gespeichert.",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    role: "Hobbygärtnerin",
    text: "GrowMaster hat mir geholfen, meine erste erfolgreiche Ernte zu erzielen. Die KI-Empfehlungen sind unglaublich hilfreich!",
  },
  {
    name: "Thomas K.",
    role: "Landwirt",
    text: "Die detaillierten Berichte und die einfache Bedienung machen GrowMaster zu einem unverzichtbaren Werkzeug für meinen Betrieb.",
  },
  {
    name: "Lisa B.",
    role: "Urban Gardener",
    text: "Endlich verstehe ich, was meine Pflanzen brauchen. Die Benachrichtigungen sind perfekt – nie wieder vertrocknete Pflanzen!",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      // Simuliere API-Aufruf
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage("Vielen Dank! Bitte bestätige deine E-Mail-Adresse.");
      setEmail("");
    } catch {
      setMessage("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-block px-4 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full mb-6">
          🌱 KI-gestützte Gartenhilfe
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-6">
          GrowMaster AI
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
          Dein intelligenter Gartenassistent. KI-gestützte Analyse, detaillierte Berichte und smarte Empfehlungen für dein Wachstum.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push("/pricing")}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
          >
            Jetzt kostenlos starten
          </button>
          <button
            onClick={() => router.push("/demo")}
            className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors"
          >
            Demo ansehen
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Alles, was du für deinen Garten brauchst
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Was unsere Nutzer sagen
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.name} className="bg-white rounded-2xl p-6 border border-slate-200">
              <p className="text-slate-600 text-sm mb-4 italic">"{testimonial.text}"</p>
              <div>
                <p className="font-semibold text-slate-900">{testimonial.name}</p>
                <p className="text-slate-500 text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
          Einfache Preise
        </h2>
        <p className="text-slate-600 text-center mb-12">
          Starte kostenlos und skaliere, wenn du bereit bist.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: "Free", price: "0", features: ["5 KI-Anfragen/Tag", "Basis-Analyse", "1 Projekt"] },
            { name: "Pro", price: "19", features: ["Unbegrenzte Anfragen", "Erweiterte Berichte", "10 Projekte", "API-Zugang"], popular: true },
            { name: "Enterprise", price: "99", features: ["Alles aus Pro", "Unbegrenzte Projekte", "Dedizierter Support", "Custom Integration"] },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.popular ? "border-green-500 shadow-lg" : "border-slate-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  Beliebt
                </div>
              )}
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">€{plan.price}</span>
                <span className="text-slate-500 ml-1">/Monat</span>
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
                onClick={() => router.push("/pricing")}
                className={`w-full py-3 px-6 rounded-xl font-medium transition-colors ${
                  plan.popular
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                }`}
              >
                {plan.name === "Free" ? "Kostenlos starten" : "Jetzt wählen"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-green-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Bereit zu wachsen?</h2>
          <p className="text-green-100 mb-6">
            Starte jetzt kostenlos mit GrowMaster AI und sieh deinen Garten in einem neuen Licht.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              className="flex-1 px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-white text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              {loading ? "Lädt..." : "Kostenlos starten"}
            </button>
          </form>
          {message && (
            <p className="mt-4 text-green-100 text-sm">{message}</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>© 2026 GrowMaster AI. Alle Rechte vorbehalten.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="/impressum" className="hover:text-slate-700">Impressum</a>
            <a href="/datenschutz" className="hover:text-slate-700">Datenschutz</a>
            <a href="/agb" className="hover:text-slate-700">AGB</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
