import { useState, useEffect } from 'react';
import Logo from '@/components/ui/Logo';
import { createPageUrl } from '@/utils';
import LanguageSwitcher from '@/components/map/LanguageSwitcher';
import { useI18n } from '@/components/contexts/I18nContext';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import SEO from '@/components/seo/SEO';

const FeatureImages = ({ activeFeature }) => {
  const images = [
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/a60633894_d1.png",
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/af3bc4fe0_d3.png",
    "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/60db9f739_d2.png"
  ];
  const [loadedImages, setLoadedImages] = useState({});

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center min-h-[300px]">
      <div className={`absolute inset-0 bg-[#111] skeleton-shimmer transition-opacity duration-300 ${loadedImages[activeFeature] ? 'opacity-0' : 'opacity-100'}`} />
      {images.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={`Feature ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ease-out ${activeFeature === index && loadedImages[index] ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          onLoad={() => setLoadedImages(prev => ({ ...prev, [index]: true }))}
        />
      ))}
    </div>
  );
};

export default function ArtistsLanding() {
  const [openFaq, setOpenFaq] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { lang } = useI18n();
  const isEn = lang === 'en';

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontsLoaded(true);
    });

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowNav(false);
      } else {
        setShowNav(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

const handleAuth = (e) => {
  e.preventDefault();
  window.location.href = '/onboarding';
};

  const faqData = isEn ? [
    {
      question: "Why use Yira if I already use Instagram or Facebook?",
      answer: "Even if you use social media, Yira connects you by location and tour dates, without algorithm noise. By adding your Yira link to your bio or stories, your fans can see your entire calendar instantly and follow you much more efficiently than on any other platform."
    },
    {
      question: "Is it hard to upload dates? Who sees them?",
      answer: "It's very easy. You can upload your dates from your profile in a minute. Any user on the map can discover you in real-time and start following you instantly."
    },
    {
      question: "Do I have to pay to appear on the map?",
      answer: "No, appearing on the map and uploading your dates is completely free. We want to support tango artists and connect them with their fans all over the world, without barriers and regardless of their audience size."
    },
    {
      question: "How do my fans track me during tours?",
      answer: "You gain unique visibility: when you are live, your location stands out with a different color on the map. If you are in transit, the system shows where you are coming from, where you are going, and how many days are left until you arrive. Every moment of your trip is personalized, and your fans never lose track of you."
    },
    {
      question: "Can I announce last-minute changes?",
      answer: "Of course! You can update your location instantly and your followers receive an automatic notification. No matter where you are, they never lose track."
    },

  ] : [
    {
      question: "¿Por qué usar Yira si ya uso Instagram o Facebook?",
      answer: "Aunque uses redes, Yira te conecta por ubicación y fechas de gira, sin el ruido del algoritmo. Si sumás tu link de Yira a tu bio o historias, tus fans ven todo tu calendario al instante y te siguen de forma mucho más eficiente que en cualquier otra plataforma."
    },
    {
      question: "¿Es difícil cargar las fechas? ¿Quién las ve?",
      answer: "Es muy sencillo. En un minuto subís tus fechas desde tu perfil. Cualquier usuario en el mapa te descubre en tiempo real y empieza a seguirte al instante."
    },
    {
      question: "¿Tengo que pagar para aparecer en el mapa?",
      answer: "No, aparecer en el mapa y cargar tus fechas es totalmente gratuito. Queremos apoyar a los artistas de tango y conectarlos con sus fans por todo el mundo, sin barreras y sin importar el tamaño de su audiencia."
    },
    {
      question: "¿Cómo me siguen mis fans durante las giras?",
      answer: "Ganás una visibilidad única: cuando estás en vivo, tu ubicación resalta con un color diferente en el mapa. Si estás en tránsito, el sistema muestra de dónde venís, hacia dónde vas y cuántos días faltan para llegar. Así, cada momento de tu viaje es personalizado y tus fans no te pierden el rastro nunca."
    },
    {
      question: "¿Puedo avisar cambios de último momento?",
      answer: "¡Claro! Podés actualizar tu ubicación al instante y tus seguidores reciben una notificación automática. Así, no importa dónde estés, nunca te pierden el rastro."
    },

  ];

  return (
    <div className="min-h-screen bg-white text-black w-full flex flex-col font-['Inter',_sans-serif] relative z-50">
      <SEO 
        title={isEn ? "Yira for Artists | Grow your Tango Fanbase" : "Yira para Artistas | Potencia tu Fanbase de Tango"}
        description={isEn ? "Centralize your dates in one place. Getting discovered and tracked by new fans has never been easier." : "Centralizá tus fechas en un solo lugar. Que nuevos fans te descubran y te sigan el rastro en el mapa nunca fue tan fácil."}
        image="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/50dcc913f_IMG_00752.png"
      />
      <style>{`
        @font-face {
            font-family: 'Bigger';
            src: url('data:font/woff2;charset=utf-8;base64,d09GMgABAAAAABKoAA8AAAAAKaQAABJJAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP0ZGVE0cGiYbnj4cMAZgAIJiEQgKolyaHQuBLAABNgIkA4JUBCAFhQIHgUwbsiNFRbBxCASg9yOqOAdGVDDKs/+rBTpFDK5+B0aamoXeUmNkN60l2fTlxl72hqm0LTWSkRqpOzZm/8A3BRWcOlXBqPD5euhr4y8dHaGxT3J9eNy095NgSQiEmgWoCVIVKFRHV9qZwUS8m+fvJmpnNvET687MOrTNED11JLEtIhZC+Z6eqDz3fgIRCIQw0KlVoNhOGMrUU1m6ZU7KY8ZOtHXuiDDysISGqcghIhdCfAH3rQtYsiy3rqx7uAIFdKOpq4IowMQzTiKLHwCebP2nufL/wMH7kysFSo5IqLJQx9kcojDbxszYiT0iucu2wAoJnv/25mzuGX6KXCLUuuBWyLCe6tTuZPKTl3fmfEobhk/pk770DymNLhzGNWGQrSgOQnEQEoUsTSIkRmsG135fN9yjDtMYKWX2ZNszP+QguSW1TGhUEjS3DM0jIdJI8YeUv5npmpXSGixBNKd5hK8//mddhdkNyTecdY+81mijjTJKK61EhrUZtUysHGAhoIvXZf7TAAgAH8ePXQPAB/d01gHwUdY7aQhABERLxiCIIIIDMADy9y48h2rMcbYGIe179lTER9bDI+n7v/xzOXnDM6dCP6lc0ocIEo/nhX9ivrhO7BBBDMbBxpfGBPLjd7ypy1TL/fnPGfKQLDIHmNFMB5vEj3WL/cr+4qK5Vq6KU5p9mvHsV02ZZkSzofmjzdbO19bpknXpuoAuTfdWN6vb0f3WD9TX6ef58ROGUsNgQ4thjD/Kb+V3hCvgxDRsTzhjT0JOiXGanKZOXRLIghVAhLwL7ZzIMkTlzYFfJ2flAjePvPthwt131FldW5X28foQqAVMQiIYEFiVlyGiPsonOhSjFiy5gBdJaTKwOlZvKtuC6i9ha8KuHOlsySVjD+T1oYviWo49jOzlFNn0hfcwqyyBN0waKuks8xQn+Grqo6EqI85fmvBrFiswWpf2SXbDJ3kqYgOumFlbig/WvpbT5ELj3YSnUe8QCn39qNfZLQRHl2wij7UzSC0ZqDOXzmOKIhfqd8qT3gyl4K3vWYRSXAeKkKy4LWJDcUlpTvs94xYSllPlYrgTMtHprS9tQ69rCQCWLK4yMK0YVyPcQprK8zPZ4GqDAUAfp6nEK0ETaFkGBdgiO8nx8yce5GEyY/qItbeAQEmo04wGqZo6whzgRCCvVj0QlWMKagNfD3WKT0tVGBo2Jk2BQMMa8iBIb8oEYEjILYRKA56LIKDBCdbTizkh4RQnq7j+ggQh17kRmD6f18btLlNT/26N5fbsqGmwtNROPu9bgG2twUIMKhwq6glOgCRlqs4Fez+d5OLmGUgYssByDOFusZFWEjYjHA53bwdRwVoyxU4HYtcor5toS6OeNFpII0MZ2koWVU99ZEXLzxSaECnJH4ekq+a/BYQ+otmMCkJZtayypRXZBYq8vlp3Fs1gxVvT2WVKETwlZ1RqcKhVinbShtlaXN7n4KJ3w5eW7Ad5LFFBFjorurWgG4M7sbier6D23I4IIXRClU3bSdBNjBgIlp43O4BnCYtULZYzAGp+jCrQkQV6QIPsndaQN8Yap9ASO9pSA7XyCVYyWTJASSc4OnmaxTAFEs8m7hwbmtY1ENtvmGAM8FQ8JEvcYMncwBJVs2EJexKZ+9du4MAdkonbZUWpmhUgeJpCGre0Vu1qAloF1W3s67+ObCDZYAMLwGzoBkeN2NR7YSfdMFOnoukyHZ2judwCxuvwtE3isl7zNUvc67T+HXuqq7MHeNEx2J+oUG4nTL2iAt8pU/aoT9vVgSfho+iS2ID8wmUr4tNOI31nRyY8UjPo6W/DhMYmBHceIZu8XPY7ZR9kNwvkkUeeI1FUNToCylXCIgUDoQGMgmFgwplEgUSpwq8NBEFYLAZHOBiz3I8skNauYwmBGNQsEJqFjX0zhUC1IJgTLI37hh2vU9lFBy3F60NgdL2ORizBJU4V6OpLS51QTxH6EBPKOgvxJIqQcIXgUCCIQNAZ5o37TNbysmhkNG7Cs4ShKqvH58IPDtSz9L5OgcMyAyzSSbLksMtXJh1hjQO1PGMsYsZQKprlUp5qjlOkWKk/f9q0qXgK5le5HuTc9iKULHfUNH8/nVgupUpV83DRdi1q77R3PQwZk7QCg8VuQJEyDMQRQkzKArvs4GtEQZEc6+e4AEB5TE5PNEwp7fdkm/bES5YaJodilfdYzz+IWV2+jDRshMk2ymg+Bl5aykSOAm6qvuRlsh8NQ5JKQ8ZxTgyrNNNgOAoUGFOv9Z/Urp2mV6J4ZE/uq7m17WWkYaMBm2ST56fLVsDJBRgZby66JugGjvHu74vZbp8S0MfMCAMj/cT/V6CcViEjQHJukkkkoMOyQ9n+/FMDDA2Glo4eYMATmIkYLBsbIl8+wsGBICJo6ZkobOxGkfzSO+ReZpz7A7xc+Xece2JvZYPnc9PDPkQNzMcMIMMG+sXkj3VigMEPWUbWfyTweENYbrZwpPadMnikYkl6H3uqIrdndz4xXoYGSkY1Tm0U6S/+ZFNjcCQuLLaQri7oGvXlfZ+kivSjDbn1EbIJ9pH5LozyF7DLCtDu90Pm90jm903+1wDKZbOnpqVnZGZl5+Tm5Rc4nC53YVFxSWkZygGouKuqa2rr6mGDx9vo8zc1t7S2tfcLdAi9f2CQUMl9SW2GqM3vBfmDiDr2ph9RINVEIreP3Zk3tzoUx+axKA/hOHcVlDkrirnx0wMe55TvKXJVEuV0rEkUz/OUwu1Agb2yLjoRbZbXxbEDXqeHhvOc3jsGXPh3FK5J3Emj9oQoKYVQNOEOH6k3EwlK/MCbCVyVg8UDsUA59Ks8F28YHDivO/roPTHndm/8hlz0nYnbpuW1waFU2IDhxqs8jP3b/7pffqPzndNYviO6VbAr2WRTy04lnOu+lNv4K0gh8mi6sfff1NvzxoCEBGH71p/e5a91xMUN4Dd3N6TnIMXHCzu2IctxNnZS1+DwqSttHGKhtGuR0EXGxLe0ep8xB5QQgZJFQnnSvEFfA7P8j/o6EV0t6uyamq3QIi38DzwX/8msYpPm1ORcZTbxBmyIHg57eC1cI4D8f2PAGx13u6CDgTuXCDJJB+4COtDL/3udsJCOWk8268ymBrAU9p54g82YU8CiUMfOUSnx4CL9kBytk5b3XSqhJmBIQAi2heJr0p6UrXUESF0PYTMm7ixB565p+2zJEB2goUPNK8N8NmrlCtjYYmMDMmbQaAyxtDB3R2A+Hcpx31a6Qyi4hldo7FiEtfN/pj3g9TaPJ6ukK1+RVNJOc/81c831IPSZRGXahEogM+VOio3ltQpBE/5VRg0kOJp5LWzAfkvey2w6DTlTwqg00MyYGZpmZkFsEYn1WpiHY10yio10OjTOwmRoc3Anb9lWaGCyWU+4h8+72BglQqVuRas5eHXkNM2Q2R4mphicJNPmml00kjVtJDd8XNdrIR24xOFl+QIMYxB5JiNI0SnFX0DnNgn61eFQjhtZH4IERzthK8R0EFhIqcAU2H/ENf8FRpVwENyWa9g9BTqXTEIACJQuoJS/UE8bJhGUrkJRqtpXSTXMwTl+91NVW3yO/RcJHXDh8Ah2xZFEJ3TkopfCPAP8vJRhJC46i8DorILmyagXZAqsWgmzmAY1Vyb5zn750SgJ0S2EIVLvPbs8cDpVACLnkjdP6GHG6fuulk6j7d0tFzbJNNgZt33tbgffrZFHFed5Ou5d794ZvVKmw1gP1XhmDnDwwSK5SCv8O2/5y9JJKasnMp6XMYIS4JLJnetx3mAlrYExeDQfI5CJ4NCUBIqM3jTfz3i7ojZHDXPm3p8LQ6esQs1S36EqBb9SpmUdgTJv4rpEL62iZQH3h+LAs3sclbbLl3ylbWgr9V26bK1yFDbVD3cPP7Lw3W29x8oC/4ZdFQQsYYah2ruROXfhVLpb0rcXbd9elBGtl9zi30vefGrk6l3/n8wKFmgTwM+SuaeUe5NA48PmisVfpLUnBGOWLYtekjIwxXf4CC1a5fRL7IyOjVo6uPH+I9gu0iyuxOCKwYj7UhI6Y8KjcTYxpaZjSnNJYEpgxvfxPTlJA5dmrxm+psHNVHzxKj17Rj1zFj8a23fRskBHWWPi2iQvBd9EB1Ocp6q0Sjc5lf3Bz/CHwpszr/8O/f9QJU+iR7pjakhsMMHCyhwt+79lTnnA40BYHPp8yOP/4cUX7a5M05k9ksZBAAAzuvaYQnQs8Y4JeeGHW4bXEfL4Xrpid1XeRTg+MGRwxwC/zdXkRWisL6SGTWfOftibKk2Mej6qakNV1AuRkyR774dnz5hCdIwvNLYRfrgt/gEI22QqU0p76UvfUfW79aXrEJ77nD8c3hwO+1toi+nMHlOv23TEFPzwmlUkhFDzjXL6kPbCgyX2I9feB3/uKV+TjvW1qq1SQ2KDdNQWEf+DXrQ/l53KEGIhIBYL7DIBCCFmAkAGiFWGLFvNxGqGbHZi9Tan9dVPWOVjM7+FYRwB1swAhDErirK/FGanw4w6F4HLCXlMV8oRMrEBsicNRPg+Eeu2xZyRCCr6VscIIyK6U6ZNRY6laeuSX52sTk68m7U5a+Y3X/dShGYuLk9KKl9kErnIY1ksycSXGhdLbomAzHJxkw7yvrrItGd3Lxj0ruQi45F3rU8xkb9NQxgp9ogHah6+9pLtuZxUwkDoEbBZCoWxIigXVgvMZtmAfJjZhVXbncprHyss+m1mzFxA0QAI2TWzEmZOZZzOGk7A6YI5VAo2GTYCU7MIIlKkQgl0hWwCGQAykN9IVbq+5zJDJ5V/hPQvRPeSU4C+d/Pc7wYMj9D3TbxdBWEQFzQKHxwLoTWsjpze2nE+095Xb25Rm/3hcT74IFv8yd0HP+B8QMSDMnOT28Itcp3FlvtDp/6baZwh4m3xLne3rCNQvjl/1aq8x8vvE5bOP2CXGqRBnGB7Zpnkkey3w/54+7X9UqHp5jLd6fBmUz/pIH24ZuDAmty9/efpEQ9gP/dWcWtLMWBAd+GMOyTZvz/58m2rH9ip7nzgAi3lSim2ifT6jhceWK4uR3jtKNoqndn7oVQo3TYHP+y1S4di6NFn1u8XH/o9yXbk2vt2DfcDYHxQVjm1urGa99EKtaIR5zmVQ/QYeVH52io61cyBMGK3HGN7Tvqu9irRa+aKBxrbylEvlnJ0wQUc3iiuoNzbCT3G8+XkHY6uEK09a7FaVAdXGqsa82Dpq1RhWMvT+u75tpReGTqBY/KtBPnOflDZX7T3xP3Sgt8P9yB8zm8zDxlCL87xv2N/l8uW3q9OvvoOQrdT+zr8NXtKFNFKuZvTwEviC80JhdI6yS3hbWNI5QdkWmo3eC+/1OAPPbsKjvX3FC9aF9GQ6ejZHinTZR/Qv3v9And9V4MQp2XiMv9tK3WmX7EQ0bNkOmGBumASnaQqz0pbip2sh6Wze3Jcd+Lyrpj53UJqOwl+HAT7JzLzIPeeUCmexXuNvsY63wh+OMj02TfANnlXTrmEmrs8PZ6eXblVInlQhbfP911SL110taBcr3/GoePGO3So+thHxnO0lmJoIbtff+vE53+MMFX+pofsl49Nn234L515hLWOAKDHMBzIzlYaXG+g719kG8T68V0JXACQC/A34DAh8yS5Ow1uIl12bAfPg59ZmjadQC0bXD3ZeBh2TSsIaJkAExym7CYY3Ch+XxgQzac3M3DM81MMN/e0E8romtB0aDPQ2PKDk6Z8KRtgtt2SjmNxOHo0gVnIvunsLLHkh5/1ZXsFAXQ5iAUADIAggFrrCpKLiKZiU11EaD2IGDrPIlZW0hHHmMlIw5S9Qrt3+h0l0gwAJgNEhOgEYkieQKz+Xkac+ASQRnIWCi2+6qwG00y3wEwTjDPebIpMY2RRuDi4uOVSNBlnmpkUbUZZ/VkmGCNsbpNibMpxQePNMVVI2J/aaXYwZEK/BP/AgmtM1o8VPbhp3LSZStuombMmjAnPJXsZkDs4/hlg/BO1NKC+YmocvwGof8aNC5vwtKfNMt1koyyAlwStgNKnD3cqyimcprMb0gY6FclTRqPsVtSFk0alXCneUBoJO51FeWV5TVkrBC8HgwZ0IzWrVmJqIRynAqd8DiueNdvucDjzHdlCCdXAgA32dXKxdb0EbhiOhuEOC/BvS0zMZBYRIkWJFiNWnHgJEiVJlkJhZZMqTboMmbJky5Er7/4+e+GI/EeFq29UqUoND69GPn5NmrVo1aZdPwEd+usU1KXbAAMNMtgQQw0DAAAA') format('woff2'),
        url('data:font/woff;charset=utf-8;base64,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') format('woff');
            font-weight: 900;
            font-style: normal;
            font-display: swap;
        }
      `}</style>
      
      {/* HEADER: Navegación Crítica Semántica */}
      <header className={`sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-black/10 transition-transform duration-300 ${showNav ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-[1000px] mx-auto px-[1rem] h-16 flex items-center justify-between">
          <a href="#" onClick={handleAuth} title="Ir a Yira" className="text-black hover:opacity-80 transition-opacity">
            <Logo width={64} height={33} className="text-black" />
          </a>
          <nav className="flex items-center gap-[1.618rem]">
            <LanguageSwitcher variant="light" />
            <button 
              onClick={handleAuth} 
              title={isEn ? "Log In" : "Acceder a tu cuenta"} 
              className="hidden sm:block font-['JetBrains_Mono',_monospace] font-extrabold text-[0.75rem] uppercase text-black hover:text-black/60 transition-colors"
            >
              {isEn ? "Log In" : "Acceder"}
            </button>
            <button 
              onClick={handleAuth} 
              title={isEn ? "Start for Free" : "Registrarse gratis"} 
              className="font-['JetBrains_Mono',_monospace] font-extrabold text-[0.75rem] uppercase bg-black text-white px-5 py-2.5 rounded-full hover:bg-black/80 transition-colors shadow-lg"
            >
              {isEn ? "Start for Free" : "Empezar Gratis"}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col">
        {/* HERO SECTION */}
        <section className="pt-[4rem] md:pt-[6.854rem] pb-[1.5rem] md:pb-[4.236rem] px-0 md:px-[1rem] max-w-[1000px] mx-auto text-center flex flex-col items-center w-full">
          <span className="font-['Inter',_sans-serif] font-semibold text-[16px] tracking-widest text-black mb-[1rem] md:mb-[1.618rem] uppercase block">
            {isEn ? "Yira for tango artists" : "Yira para artistas de tango"}
          </span>
          <div className="relative w-full flex justify-center mb-[1rem] md:mb-[1.618rem] px-0">
            {!fontsLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-full h-[3.5rem] md:h-[7.5rem] bg-black/5 skeleton-shimmer rounded-lg" />
                <div className="w-full h-[3.5rem] md:h-[7.5rem] bg-black/5 skeleton-shimmer rounded-lg" />
              </div>
            )}
            <h1 className={`font-['Bigger',_sans-serif] text-[15.5vw] sm:text-[14vw] md:text-[7.5rem] leading-[0.85] text-black uppercase break-words w-full transition-opacity duration-300 ease-out ${fontsLoaded ? 'opacity-100' : 'opacity-0'}`}>
              {isEn ? <>Elevate your<br/>tour level</> : <>Elevá el nivel<br/>de tus giras</>}
            </h1>
          </div>
          <p className="font-['Inter',_sans-serif] font-medium text-[1rem] md:text-[1.5rem] text-black/80 max-w-[42.36rem] mx-auto mb-[2rem] md:mb-[2.618rem] px-[1rem]">
           {isEn ? "Centralize all your dates in one place. Get discovered by new fans and let them track you more easily than ever." : "Centralizá todas tus fechas en un solo lugar. Hacé que te descubran nuevos fans y que seguirte el rastro sea más fácil que nunca."}
          </p>
          <button 
           onClick={handleAuth} 
           title={isEn ? "Create Free Account" : "Crear cuenta gratis"} 
           className="bg-black text-white font-['JetBrains_Mono',_monospace] font-extrabold text-[0.75rem] uppercase tracking-wide px-8 py-2.5 rounded-full hover:bg-black/80 transition-transform hover:-translate-y-1 mb-[2rem] md:mb-[4.236rem] shadow-xl"
          >
           {isEn ? "Create Free Account" : "Crear cuenta gratis"}
          </button>
          <div className="px-[2rem] md:px-0 w-full flex justify-center">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/50dcc913f_IMG_00752.png" 
              alt="Ilustración conceptual de un artista de tango recibiendo corazones y amor de sus fans" 
              className="w-full max-w-[220px] sm:max-w-[300px] md:max-w-[500px] h-auto object-contain" 
              fetchPriority="high"
            />
          </div>
        </section>

         {/* FEATURES SECTION (Golden Ratio Applied) */}
         <section className="pt-[6.854rem] pb-[2rem] md:pb-[4.236rem] px-[1rem] max-w-[1000px] mx-auto w-full">
          <h2 className="font-['JetBrains_Mono',_monospace] font-extrabold text-[2.5rem] md:text-[3.5rem] uppercase text-black mb-[2rem] md:mb-[4.236rem] leading-[1.1]">
           {isEn ? <>Why join <br className="hidden md:block" />Yira</> : <>Por qué<br className="hidden md:block" /> sumarse a Yira</>}
          </h2>
          
          {/* Desktop Interactive Layout */}
          <div className="hidden md:grid md:grid-cols-2 gap-[4.236rem] items-center">
            <ul className="space-y-[2.618rem] flex flex-col justify-between py-1">
              {(isEn ? [
                {
                  id: 0,
                  icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/6b5cf9f12_1.png",
                  title: "Fan-driven tours",
                  desc: "Let your community guide you. Receive direct requests and organize your next destinations knowing exactly which cities are waiting for you."
                },
                {
                  id: 1,
                  icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/5a64af63a_2.png",
                  title: "Your dynamic live presence",
                  desc: "Your professional schedule in one place. Everyone will know instantly when and where you perform so finding you is simple for any organizer or fan."
                },
                {
                  id: 2,
                  icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/0ca922cfa_3.png",
                  title: "New fans around you",
                  desc: "Expand your reach automatically. We alert tango lovers in the area when you pass by so you gain new audiences at every stop on your tour."
                }
              ] : [
                {
                  id: 0,
                  icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/6b5cf9f12_1.png",
                  title: "Giras impulsadas por fans",
                  desc: "Dejá que tu comunidad te guíe. Recibí pedidos directos y organizá tus próximos destinos sabiendo exactamente en qué ciudades te están esperando."
                },
                {
                  id: 1,
                  icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/5a64af63a_2.png",
                  title: "Tu presencia dinámica en vivo",
                  desc: "Tu agenda profesional en un solo lugar. Que todos sepan al instante cuándo y dónde te presentás para que encontrarte sea simple para cualquier organizador o fan."
                },
                {
                  id: 2,
                  icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/0ca922cfa_3.png",
                  title: "Nuevos fans a la redonda",
                  desc: "Expandí tu alcance automáticamente. Les avisamos a los tangueros de la zona cuando pasás por ahí para que sumes público nuevo en cada parada de tu tour."
                }
              ]).map((feature) => (
                <li 
                  key={feature.id} 
                  onClick={() => setActiveFeature(feature.id)}
                  onMouseEnter={() => setActiveFeature(feature.id)}
                  className={`flex flex-col cursor-pointer transition-colors duration-300 group ${activeFeature === feature.id ? 'text-black' : 'text-[#B3B3B3] hover:text-black'}`}
                >
                  <h3 className="font-['JetBrains_Mono',_monospace] font-extrabold text-[1.25rem] md:text-[1.5rem] uppercase mb-[0.618rem] flex items-start gap-[1rem]">
                    <img 
                      src={feature.icon} 
                      alt="" 
                      className={`w-6 h-6 object-contain mt-1 shrink-0 transition-all ${activeFeature === feature.id ? 'opacity-100 grayscale-0' : 'opacity-30 grayscale group-hover:grayscale-0 group-hover:opacity-100'}`} 
                    />
                    <span>{feature.title}</span>
                  </h3>
                  <p className="font-['Inter',_sans-serif] font-medium text-[1rem] pl-[2.5rem]">
                    {feature.desc}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex w-full aspect-square relative">
              <FeatureImages activeFeature={activeFeature} />
            </div>
          </div>

          {/* Mobile Sequential Layout */}
          <div className="flex flex-col md:hidden gap-[3rem]">
            {(isEn ? [
              {
                id: 0,
                icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/6b5cf9f12_1.png",
                title: "Fan-driven tours",
                desc: "Let your community guide you. Receive direct requests and organize your next destinations knowing exactly which cities are waiting for you.",
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/a60633894_d1.png"
              },
              {
                id: 1,
                icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/5a64af63a_2.png",
                title: "Your dynamic live presence",
                desc: "Your professional schedule in one place. Everyone will know instantly when and where you perform so finding you is simple for any organizer or fan.",
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/af3bc4fe0_d3.png"
              },
              {
                id: 2,
                icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/0ca922cfa_3.png",
                title: "New fans around you",
                desc: "Expand your reach automatically. We alert tango lovers in the area when you pass by so you gain new audiences at every stop on your tour.",
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/60db9f739_d2.png"
              }
            ] : [
              {
                id: 0,
                icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/6b5cf9f12_1.png",
                title: "Giras impulsadas por fans",
                desc: "Dejá que tu comunidad te guíe. Recibí pedidos directos y organizá tus próximos destinos sabiendo exactamente en qué ciudades te están esperando.",
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/a60633894_d1.png"
              },
              {
                id: 1,
                icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/5a64af63a_2.png",
                title: "Tu presencia dinámica en vivo",
                desc: "Tu agenda profesional en un solo lugar. Que todos sepan al instante cuándo y dónde te presentás para que encontrarte sea simple para cualquier organizador o fan.",
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/af3bc4fe0_d3.png"
              },
              {
                id: 2,
                icon: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/0ca922cfa_3.png",
                title: "Nuevos fans a la redonda",
                desc: "Expandí tu alcance automáticamente. Les avisamos a los tangueros de la zona cuando pasás por ahí para que sumes público nuevo en cada parada de tu tour.",
                image: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/60db9f739_d2.png"
              }
            ]).map((feature) => (
              <div key={feature.id} className="flex flex-col gap-[1.5rem]">
                <div className="w-full bg-black aspect-square flex items-center justify-center p-[2rem]">
                  <img src={feature.image} alt={feature.title} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-['JetBrains_Mono',_monospace] font-extrabold text-[1.25rem] uppercase mb-[0.5rem] flex items-start gap-[0.75rem] text-black">
                    <img src={feature.icon} alt="" className="w-5 h-5 object-contain mt-[2px] shrink-0" />
                    <span>{feature.title}</span>
                  </h3>
                  <p className="font-['Inter',_sans-serif] font-medium text-[1rem] text-black/80">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section className="py-[2rem] md:py-[4.236rem] px-[1rem] max-w-[1000px] mx-auto w-full">
          <div className="bg-white p-[1rem] md:p-[2.618rem]">
            {faqData.map((faq, index) => (
              <article key={index} className="border-b-[2px] border-black last:border-0 py-[1.618rem] first:pt-0 last:pb-0">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)} 
                  className="w-full flex justify-between items-center text-left focus:outline-none group" 
                  title={openFaq === index ? "Ocultar respuesta" : "Mostrar respuesta"}
                  aria-expanded={openFaq === index}
                >
                  <h3 className="font-['JetBrains_Mono',_monospace] font-extrabold text-[1rem] md:text-[1.5rem] uppercase text-black pr-[1rem] group-hover:text-black/70 transition-colors">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0 transition-transform duration-300">
                    {openFaq === index ? <ChevronUp className="w-5 h-5 text-black" /> : <ChevronDown className="w-5 h-5 text-black" />}
                  </div>
                </button>
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${openFaq === index ? 'grid-rows-[1fr] opacity-100 mt-[1rem]' : 'grid-rows-[0fr] opacity-0 mt-0'}`}
                >
                  <p className="overflow-hidden font-['Inter',_sans-serif] font-medium text-[1rem] text-[#333] leading-[1.6]">
                    {faq.answer}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-[#F2EF1D] w-full pt-[4.236rem] pb-[1.618rem] px-[1rem] md:px-[4rem] relative overflow-hidden mt-[4.236rem]">
        <div className="w-full flex flex-col relative z-10 min-h-[500px] justify-between">
          
          {/* Top Features Row */}
          <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-[1.5rem] md:gap-[1rem] mb-[4rem] z-20 text-center">
            {(isEn ? [
              "Real-time tango radar",
              "Your tours under control",
              "Made by and for tango people"
            ] : [
              "Radar tanguero en tiempo real",
              "Tus giras bajo control",
              "Hecho por y para la gente del tango"
            ]).map((text, i) => (
              <div key={i} className="flex items-center justify-center gap-[0.75rem]">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6985f5bb902ec2f8c9596a0d/b5191b43c_iconocheck.png" alt="check" className="w-[1.25rem] h-[1.25rem] object-contain" />
                <span className="font-['JetBrains_Mono',_monospace] font-extrabold text-[0.875rem] md:text-[1rem] uppercase text-black">
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* Middle Main Content */}
          <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-[4rem] lg:gap-[4rem] flex-1 z-20 w-full max-w-[1400px] mx-auto">
            {/* Logo Container */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end items-center h-full pb-8 lg:pb-0 pl-[6%] lg:pl-0">
              <Logo className="text-black w-auto object-contain h-[10.2rem] md:h-[15.3rem] lg:h-[17.85rem]" />
            </div>
            
            {/* Big Text Container */}
            <div className="w-full lg:w-1/2 flex justify-center lg:justify-start items-center text-center lg:text-left relative h-full">
              {!fontsLoaded && (
                <div className="absolute inset-0 flex flex-col items-center lg:items-start justify-center gap-4">
                  <div className="w-[90%] h-[3rem] md:h-[5rem] bg-black/10 skeleton-shimmer rounded-lg" />
                  <div className="w-[70%] h-[3rem] md:h-[5rem] bg-black/10 skeleton-shimmer rounded-lg" />
                  <div className="w-[50%] h-[3rem] md:h-[5rem] bg-black/10 skeleton-shimmer rounded-lg" />
                </div>
              )}
              <h2 className={`font-['Bigger',_sans-serif] text-[4rem] md:text-[6rem] lg:text-[7rem] leading-[0.85] text-black uppercase transition-opacity duration-300 ease-out ${fontsLoaded ? 'opacity-100' : 'opacity-0'} max-w-[600px] m-0`}>
                {isEn ? "Made for traveling tango lovers" : "Hecho para tangueros que viajan"}
              </h2>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-[1rem] mt-[4rem] z-20 text-black max-w-[1400px] mx-auto w-full">
            <span className="font-['JetBrains_Mono',_monospace] font-medium text-[10px] uppercase text-center md:text-left">
              {isEn ? "Let the world keep turning. Yira, yira." : "Que al mundo nada le importa. Yira, yira."}
            </span>
            <div className="flex items-center gap-4">
              <a href="/about" className="font-['JetBrains_Mono',_monospace] font-medium text-[10px] uppercase hover:opacity-70 transition-opacity">
                {isEn ? "About" : "Nosotros"}
              </a>
              <a href="/contact" className="font-['JetBrains_Mono',_monospace] font-medium text-[10px] uppercase hover:opacity-70 transition-opacity">
                {isEn ? "Contact" : "Contacto"}
              </a>
              <span className="font-['JetBrains_Mono',_monospace] font-medium text-[10px] uppercase text-center md:text-right">
                {isEn ? "2026 | Copyright | yira, All rights reserved" : "2026 | Copyright | yira, Todos los derechos reservados"}
              </span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}