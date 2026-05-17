import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import SEO from '@/components/seo/SEO';

export default function About() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-['Inter',_sans-serif]">
      <SEO
        title="About Yira | The Global Tango Artist Network"
        description="Learn about Yira — the interactive platform connecting tango artists, fans, and organizers around the world through a live 3D globe."
      />

      <nav className="px-6 py-5 flex items-center justify-between border-b border-white/10 max-w-4xl mx-auto w-full">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo width={72} height={36} className="text-white" />
        </Link>
        <Link to="/" className="text-xs font-['JetBrains_Mono',_monospace] font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors">
          ← Back to App
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
          About Yira
        </h1>

        <div className="space-y-6 text-white/75 text-base md:text-lg leading-relaxed">
          <p>
            Yira is a real-time global platform designed for the tango community. It connects tango artists — maestros, musicians, DJs, and orchestras — with their fans and event organizers worldwide through an interactive 3D globe that shows where artists are, where they are heading, and when they will be performing next.
          </p>

          <p>
            The name "Yira" comes from the iconic tango song <em>Yira, Yira</em> by Enrique Santos Discépolo, a timeless anthem about wandering the world. It perfectly captures what the platform is about: artists who travel the globe sharing the art of tango, and fans who follow along.
          </p>

          <p>
            Yira is built for two kinds of people. First, tango artists who tour internationally and want a simple, beautiful way to publish their calendar, be discoverable on a map, and let fans track their journey in real time. Second, tango enthusiasts — from devoted followers to event organizers — who want to know when their favorite maestros are coming to their city, discover new artists nearby, and request visits or collaborations directly.
          </p>

          <p>
            Artists can check in to their current location, upload upcoming tour dates, and share a public profile page with their biography, social links, and full schedule. Fans can follow artists, receive automatic notifications when new dates are announced, and send visit or collaboration requests with a single tap.
          </p>

          <p>
            Yira was created by a small team of tango lovers and software builders who were tired of hunting across Instagram posts, Facebook groups, and scattered websites to find out where their favorite teachers were performing. We wanted one living, breathing map of the global tango circuit — and so we built it.
          </p>

          <p>
            The platform is free for artists to join and list their dates. Our mission is to support the tango world by making artists more visible and fans more connected, regardless of where in the world everyone happens to be dancing.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-white text-black text-sm font-['JetBrains_Mono',_monospace] font-bold uppercase rounded-full hover:bg-white/90 transition-colors"
          >
            Explore the Globe
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white text-sm font-['JetBrains_Mono',_monospace] font-bold uppercase rounded-full hover:bg-white/20 transition-colors border border-white/10"
          >
            Contact Us
          </Link>
        </div>
      </main>
    </div>
  );
}