import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Mail } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import SEO from '@/components/seo/SEO';

export default function Contact() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-['Inter',_sans-serif]">
      <SEO
        title="Contact Yira | Get in Touch"
        description="Reach out to the Yira team. We'd love to hear from tango artists, fans, organizers, and anyone curious about the platform."
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
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          Contact Us
        </h1>
        <p className="text-white/60 text-lg mb-12">
          We'd love to hear from tango artists, fans, organizers, or anyone curious about Yira.
        </p>

        <div className="space-y-6">
          <a
            href="mailto:hola@yira.app"
            className="flex items-center gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-['JetBrains_Mono',_monospace] font-bold uppercase tracking-widest text-white/40 mb-1">Email</div>
              <div className="text-white text-lg font-medium">hola@yira.app</div>
            </div>
          </a>

          <a
            href="https://instagram.com/yira.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-['JetBrains_Mono',_monospace] font-bold uppercase tracking-widest text-white/40 mb-1">Instagram</div>
              <div className="text-white text-lg font-medium">@yira.app</div>
            </div>
          </a>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <Link
            to="/about"
            className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white text-sm font-['JetBrains_Mono',_monospace] font-bold uppercase rounded-full hover:bg-white/20 transition-colors border border-white/10"
          >
            Learn About Yira
          </Link>
        </div>
      </main>
    </div>
  );
}