import { useState, useEffect, useRef } from "react";

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, dir = "up", className = "", style = {} }) {
  const [ref, visible] = useInView();
  const dirs = {
    up: "translateY(52px)", down: "translateY(-52px)",
    left: "translateX(-52px)", right: "translateX(52px)", scale: "scale(0.88)",
  };
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "none" : dirs[dir],
      transition: `opacity 0.75s ease ${delay}ms, transform 0.75s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      ...style,
    }}>{children}</div>
  );
}

function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const pts = Array.from({ length: 90 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.2 + 0.4, o: Math.random() * 0.4 + 0.1,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,245,212,${p.o})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(0,245,212,${0.06 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.55 }} />;
}

function Cube({ size = 80, color = "#00f5d4", style: sx = {} }) {
  const [rot, setRot] = useState({ x: 20, y: 30 });
  const t = useRef(0), raf = useRef();
  useEffect(() => {
    const tick = () => {
      t.current += 0.007;
      setRot({ x: 18 + Math.sin(t.current * 0.6) * 14, y: t.current * 22 % 360 });
      raf.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf.current);
  }, []);
  const h = size / 2;
  return (
    <div style={{ width: size, height: size, perspective: 700, ...sx }}>
      <div style={{ width: size, height: size, position: "relative", transformStyle: "preserve-3d", transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}>
        {[`translateZ(${h}px)`, `translateZ(-${h}px) rotateY(180deg)`, `translateY(-${h}px) rotateX(90deg)`, `translateY(${h}px) rotateX(-90deg)`, `translateX(-${h}px) rotateY(-90deg)`, `translateX(${h}px) rotateY(90deg)`].map((tf, i) => (
          <div key={i} style={{ position: "absolute", width: size, height: size, border: `1px solid ${color}55`, background: "transparent", transform: tf }} />
        ))}
      </div>
    </div>
  );
}

function Glitch({ text, style: sx = {} }) {
  return (
    <>
      <style>{`
        .gt{position:relative;display:inline-block}
        .gt::before,.gt::after{content:attr(data-t);position:absolute;top:0;left:0;width:100%;height:100%}
        .gt::before{left:2px;text-shadow:-1px 0 #f72585;clip-path:polygon(0 20%,100% 20%,100% 42%,0 42%);animation:g1 4.5s infinite}
        .gt::after{left:-2px;text-shadow:1px 0 #4cc9f0;clip-path:polygon(0 62%,100% 62%,100% 80%,0 80%);animation:g2 4.5s infinite}
        @keyframes g1{0%,89%,100%{opacity:0;transform:none}90%{opacity:1;transform:translate(-2px,1px)}92%{opacity:1;transform:translate(2px,-1px)}94%{opacity:0}}
        @keyframes g2{0%,84%,100%{opacity:0;transform:none}85%{opacity:1;transform:translate(2px,1px)}87%{opacity:1;transform:translate(-2px,-1px)}89%{opacity:0}}
      `}</style>
      <span className="gt" data-t={text} style={sx}>{text}</span>
    </>
  );
}

function Typed({ words }) {
  const [text, setText] = useState("");
  const wi = useRef(0), ci = useRef(0), del = useRef(false);
  useEffect(() => {
    const tick = () => {
      const w = words[wi.current];
      if (!del.current) {
        setText(w.slice(0, ci.current + 1)); ci.current++;
        if (ci.current === w.length) { del.current = true; setTimeout(tick, 1600); return; }
      } else {
        setText(w.slice(0, ci.current - 1)); ci.current--;
        if (ci.current === 0) { del.current = false; wi.current = (wi.current + 1) % words.length; }
      }
      setTimeout(tick, del.current ? 38 : 75);
    };
    const id = setTimeout(tick, 800);
    return () => clearTimeout(id);
  }, []);
  return (
    <span style={{ fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,.65)", fontSize: "clamp(14px,1.8vw,18px)" }}>
      {text}
      <span style={{ display: "inline-block", width: 2, height: "1em", background: "#00f5d4", marginLeft: 3, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
    </span>
  );
}

function SkillTag({ name, icon, color }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 14px",
      borderRadius: 10, fontFamily: "'DM Mono',monospace", fontSize: 12, cursor: "default",
      border: `1px solid ${hov ? color : color + "22"}`,
      background: hov ? `${color}14` : `${color}06`,
      color: hov ? color : "rgba(255,255,255,.5)",
      transform: hov ? "translateY(-2px)" : "none",
      boxShadow: hov ? `0 0 14px ${color}28` : "none",
      transition: "all .2s ease",
    }}>
      <span>{icon}</span><span>{name}</span>
    </div>
  );
}

function ProjectCard({ project, index }) {
  const [ref, visible] = useInView(0.08);
  const [hov, setHov] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef();
  const handleMove = e => {
    const r = cardRef.current.getBoundingClientRect();
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * 10, y: -((e.clientX - r.left) / r.width - 0.5) * 10 });
  };
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(60px)", transition: `opacity .75s ease ${index * 110}ms, transform .75s cubic-bezier(.22,1,.36,1) ${index * 110}ms` }}>
      <div ref={cardRef}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => { setHov(false); setTilt({ x: 0, y: 0 }); }}
        onMouseMove={handleMove}
        style={{
          borderRadius: 18, overflow: "hidden", cursor: "pointer", height: "100%",
          background: "rgba(8,8,22,.88)",
          border: `1px solid ${hov ? project.color : "rgba(255,255,255,.07)"}`,
          transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${hov ? -6 : 0}px)`,
          transition: "transform .12s ease, border-color .3s, box-shadow .3s",
          boxShadow: hov ? `0 0 40px ${project.color}22, 0 24px 48px rgba(0,0,0,.5)` : "0 4px 20px rgba(0,0,0,.3)",
          position: "relative",
        }}>
        <div style={{ height: 2, background: `linear-gradient(90deg,${project.color},transparent)` }} />
        <div style={{ padding: "24px 26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, flexWrap: "wrap" }}>
                <div style={{ fontSize: 9, color: project.color, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'DM Mono',monospace" }}>{project.type}</div>
                {project.playstore && (
                  <span style={{ fontSize: 8, fontFamily: "'DM Mono',monospace", padding: "2px 7px", borderRadius: 4, background: "rgba(0,245,212,.12)", color: "#00f5d4", border: "1px solid rgba(0,245,212,.25)", letterSpacing: "0.08em" }}>▶ PLAY STORE</span>
                )}
                {project.live && (
                  <span style={{ fontSize: 8, fontFamily: "'DM Mono',monospace", padding: "2px 7px", borderRadius: 4, background: "rgba(247,37,133,.1)", color: "#f72585", border: "1px solid rgba(247,37,133,.22)", letterSpacing: "0.08em" }}>● LIVE</span>
                )}
              </div>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 24, color: "white", letterSpacing: "0.05em", lineHeight: 1 }}>{project.title}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.32)", fontFamily: "'DM Mono',monospace", marginTop: 3 }}>{project.sub}</div>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, background: `${project.color}10`, border: `1px solid ${project.color}28`, color: project.color }}>{project.emoji}</div>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,.42)", lineHeight: 1.75, marginBottom: 16, fontFamily: "'DM Mono',monospace" }}>{project.desc}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {project.tags.map(t => (
              <span key={t} style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", padding: "4px 10px", borderRadius: 6, background: `${project.color}0e`, color: project.color, border: `1px solid ${project.color}22` }}>{t}</span>
            ))}
          </div>
        </div>
        {hov && <div style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: 18, background: `repeating-linear-gradient(0deg,transparent,transparent 3px,${project.color}03 3px,${project.color}03 4px)` }} />}
      </div>
    </div>
  );
}

// ── DATA ────────────────────────────────────────────────────────────
const NAV_LINKS = ["Home", "About", "Skills", "Projects", "Experience", "Contact"];

const SKILL_GROUPS = [
  {
    label: "Frontend & Mobile", color: "#00f5d4",
    skills: [
      { name: "React.js", icon: "⚛" }, { name: "React Native", icon: "📱" },
      { name: "Next.js", icon: "▲" }, { name: "TypeScript", icon: "🔷" },
      { name: "JavaScript ES6+", icon: "🟡" }, { name: "Tailwind CSS", icon: "💨" },
      { name: "Redux Toolkit", icon: "🔄" }, { name: "HTML5 / CSS3", icon: "🎨" },
    ]
  },
  {
    label: "Backend", color: "#f72585",
    skills: [
      { name: "Node.js", icon: "🟢" }, { name: "Express.js", icon: "🚂" },
      { name: "REST APIs", icon: "🔗" }, { name: "Socket.io", icon: "⚡" },
      { name: "JWT / Auth", icon: "🔐" }, { name: "MVC Architecture", icon: "🏗" },
      { name: "GraphQL", icon: "🔴" }, { name: "Nginx", icon: "🌐" },
    ]
  },
  {
    label: "Database & Cloud", color: "#7b2ff7",
    skills: [
      { name: "MongoDB", icon: "🍃" }, { name: "MySQL", icon: "🐬" },
      { name: "Sequelize ORM", icon: "🔧" }, { name: "AWS EC2 / S3", icon: "☁" },
      { name: "Route 53", icon: "🗺" }, { name: "Digital Ocean", icon: "🌊" },
      { name: "Cloudinary", icon: "🖼" }, { name: "Firebase", icon: "🔥" },
    ]
  },
  {
    label: "Tools & Integrations", color: "#4cc9f0",
    skills: [
      { name: "Git / GitHub", icon: "🐙" }, { name: "Razorpay", icon: "💳" },
      { name: "Twilio", icon: "📞" }, { name: "Nodemailer", icon: "📧" },
      { name: "MapBox", icon: "🗺" }, { name: "OpenAI", icon: "🤖" },
      { name: "Postman", icon: "📮" }, { name: "Figma", icon: "✏️" },
    ]
  },
];

const PROJECTS_DATA = [
  {
    title: "GX MITRA",
    sub: "Live on Google Play Store",
    type: "Professional · React Native",
    emoji: "📲",
    color: "#00f5d4",
    live: false,
    playstore: true,
    desc: "Customer-facing fintech app for GrowXCD built with React Native. Users can check their loan details, manage their profile, and participate in a Refer & Earn programme. Co-built with my team lead and shipped live on the Google Play Store.",
    tags: ["React Native", "Redux", "REST API", "JWT", "Expo", "Refer & Earn"],
  },
  {
    title: "GROWXCD PLATFORM",
    sub: "Fintech Branch Operations System",
    type: "Professional · Web · MERN",
    emoji: "🏦",
    color: "#f72585",
    live: false,
    playstore: false,
    desc: "Core fintech platform powering GrowXCD's daily operations — real-time transaction dashboards, role-based access control, automated reporting, staff management, and an internal communication portal built and maintained as part of the dev team.",
    tags: ["React.js", "Node.js", "MongoDB", "Express", "Socket.io", "AWS", "JWT"],
  },
  {
    title: "HOSTEL HIVE",
    sub: "Full-Stack Hostel Booking Platform",
    type: "Personal Project · Full Stack",
    emoji: "🏠",
    color: "#7b2ff7",
    live: true,
    playstore: false,
    desc: "Full-stack platform for hostel owners and students to manage and book accommodations. Features map-based property listing, separate admin and student dashboards, rent payments, leave requests, complaint handling, and Razorpay integration.",
    tags: ["React", "Node.js", "MongoDB", "Redux Toolkit", "Razorpay", "MapBox", "Twilio", "Cloudinary"],
  },
  {
    title: "SHOEHUB",
    sub: "E-Commerce Platform with Admin Panel",
    type: "Personal Project · Full Stack",
    emoji: "👟",
    color: "#4cc9f0",
    live: true,
    playstore: false,
    desc: "Full-fledged e-commerce platform with user cart, wishlist, coupon codes, wallet system, and Razorpay payments. Includes a comprehensive admin dashboard for product, coupon, and user management with block/unblock capabilities.",
    tags: ["MongoDB", "Node.js", "Express", "Bootstrap", "EJS", "Razorpay"],
  },
  {
    title: "PASSCRAFTER-X",
    sub: "Secure Password Generator · MERN",
    type: "Mini Project · TypeScript",
    emoji: "🔐",
    color: "#00f5d4",
    live: true,
    playstore: false,
    desc: "MERN stack password generator built with TypeScript end-to-end. Implements the Repository pattern with MVC on the backend, Formik & Yup for forms, JWT authentication, and MongoDB Atlas — focused on security and maintainability.",
    tags: ["MERN", "TypeScript", "Formik", "Yup", "JWT", "MongoDB Atlas"],
  },
  {
    title: "NETFLIX CLONE",
    sub: "Streaming Platform Clone",
    type: "Mini Project · MERN",
    emoji: "🎬",
    color: "#f72585",
    live: false,
    playstore: false,
    desc: "Netflix-style streaming platform built with the MERN stack. Features dynamic content loading, user-specific recommendations, and a polished streaming interface with responsive design.",
    tags: ["React", "Node.js", "MongoDB", "Express", "Redux"],
  },
];

// ── APP ──────────────────────────────────────────────────────────────
export default function Portfolio() {
  const [activeNav, setActiveNav] = useState("Home");
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", msg: "" });

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = id => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: "smooth" });
    setActiveNav(id);
    setMenuOpen(false);
  };

  const C = { cyan: "#00f5d4", pink: "#f72585", purple: "#7b2ff7", blue: "#4cc9f0", bg: "#04040f", card: "rgba(8,8,22,.88)" };

  return (
    <div style={{ background: C.bg, color: "white", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&family=Syne:wght@700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'DM Mono',monospace;background:#04040f}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#04040f}::-webkit-scrollbar-thumb{background:#00f5d4;border-radius:4px}
        @keyframes blink{50%{opacity:0}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
        @keyframes gridmove{0%{background-position:0 0}100%{background-position:60px 60px}}
        @keyframes scanline{0%{top:-2%}100%{top:102%}}
        @keyframes pring{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.4);opacity:0}}
        @keyframes heroin{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}
        .bebas{font-family:'Bebas Neue',cursive;letter-spacing:.04em}
        .syne{font-family:'Syne',sans-serif}
        .mono{font-family:'DM Mono',monospace}
        .gridbg{background-image:linear-gradient(rgba(0,245,212,.032) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,212,.032) 1px,transparent 1px);background-size:60px 60px;animation:gridmove 10s linear infinite}
        .neon{box-shadow:0 0 12px rgba(0,245,212,.03)}
        .floaty{animation:float 5s ease-in-out infinite}
        .ring{animation:pring 2.2s ease-out infinite}
        .hin{animation:heroin .9s ease both}
        @media(max-width:768px){.deskonly{display:none!important}.mobonly{display:flex!important}.grid2{grid-template-columns:1fr!important}.heroGrid{grid-template-columns:1fr!important}.proj-grid{grid-template-columns:1fr!important}}
        .mobonly{display:none}
        input,textarea{font-family:'DM Mono',monospace}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,.2)}
      `}</style>

      <ParticleField />

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, width: "100%", zIndex: 100, background: scrollY > 60 ? "rgba(4,4,15,.96)" : "transparent", backdropFilter: scrollY > 60 ? "blur(24px)" : "none", borderBottom: scrollY > 60 ? "1px solid rgba(0,245,212,.07)" : "none", transition: "all .3s" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, border: `1px solid ${C.cyan}`, background: "rgba(0,245,212,.09)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.cyan, fontFamily: "DM Mono" }}>MS</span>
            </div>
            <span className="mono" style={{ fontSize: 12, color: "rgba(255,255,255,.32)" }}>muhammed.shifin</span>
          </div>
          <div className="deskonly" style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {NAV_LINKS.map(n => (
              <button key={n} onClick={() => scrollTo(n)} className="mono" style={{ padding: "7px 13px", fontSize: 11, borderRadius: 8, cursor: "pointer", border: activeNav === n ? "1px solid rgba(0,245,212,.25)" : "1px solid transparent", background: activeNav === n ? "rgba(0,245,212,.08)" : "transparent", color: activeNav === n ? C.cyan : "rgba(255,255,255,.42)", transition: "all .2s" }}>{n}</button>
            ))}
            <a href="mailto:dev.muhammedshifin@gmail.com" className="mono" style={{ marginLeft: 8, padding: "8px 18px", fontSize: 11, fontWeight: 600, background: C.cyan, color: C.bg, borderRadius: 8, textDecoration: "none", boxShadow: `0 0 18px rgba(0,245,212,.4)` }}>Hire Me</a>
          </div>
          <button className="mobonly" onClick={() => setMenuOpen(!menuOpen)} style={{ fontSize: 18, background: "none", border: "none", color: C.cyan, cursor: "pointer" }}>{menuOpen ? "✕" : "☰"}</button>
        </div>
        {menuOpen && (
          <div style={{ background: "rgba(4,4,15,.98)", borderTop: "1px solid rgba(0,245,212,.07)", padding: "8px 24px 16px" }}>
            {NAV_LINKS.map(n => (
              <button key={n} onClick={() => scrollTo(n)} className="mono" style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 0", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: activeNav === n ? C.cyan : "rgba(255,255,255,.45)", borderBottom: "1px solid rgba(255,255,255,.04)" }}>{n}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", overflow: "hidden", paddingTop: 64 }}>
        <div className="gridbg" style={{ position: "absolute", inset: 0, opacity: 0.55 }} />
        <div style={{ position: "absolute", left: 0, width: "100%", height: 2, background: `linear-gradient(90deg,transparent,rgba(0,245,212,.3),transparent)`, animation: "scanline 5s linear infinite", zIndex: 1 }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", userSelect: "none" }}>
          <span className="bebas" style={{ fontSize: "clamp(80px,18vw,260px)", color: "rgba(255,255,255,.016)", lineHeight: 1 }}>SHIFIN</span>
        </div>

        <div className="floaty deskonly" style={{ position: "absolute", top: "14%", right: "5%", animationDelay: "0s", zIndex: 2 }}><Cube size={72} color={C.cyan} /></div>
        <div className="floaty deskonly" style={{ position: "absolute", bottom: "22%", right: "17%", animationDelay: "1.8s", zIndex: 2 }}><Cube size={40} color={C.purple} /></div>
        <div className="floaty deskonly" style={{ position: "absolute", top: "52%", right: "36%", animationDelay: "0.9s", zIndex: 2 }}><Cube size={22} color={C.pink} /></div>

        <div style={{ position: "relative", zIndex: 5, maxWidth: 1200, margin: "0 auto", padding: "40px 24px", width: "100%" }}>
          <div className="heroGrid" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center" }}>
            <div>
              {/* <div className="hin" style={{ animationDelay: "0ms", display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div style={{ position: "relative", width: 10, height: 10 }}>
                  <div className="ring" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: C.cyan }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.cyan }} />
                </div>
                <span className="mono" style={{ fontSize: 10, color: C.cyan, letterSpacing: "0.2em", textTransform: "uppercase" }}>Open to Work · Full Stack Developer</span>
              </div> */}

              <div className="hin bebas" style={{ animationDelay: "100ms", fontSize: "clamp(54px,9vw,115px)", lineHeight: 0.87, marginBottom: 6 }}>
                <Glitch text="MUHAMMED" />
              </div>
              <div className="hin bebas" style={{ animationDelay: "180ms", fontSize: "clamp(54px,9vw,115px)", color: C.cyan, lineHeight: 0.87, marginBottom: 28, textShadow: `0 0 60px rgba(0,245,212,.22)` }}>
                SHIFIN
              </div>

              <div className="hin" style={{ animationDelay: "260ms", marginBottom: 22, display: "flex", alignItems: "center", gap: 8 }}>
                <span className="mono" style={{ fontSize: 13, color: "rgba(255,255,255,.25)" }}>// </span>
                <Typed words={["MERN Stack Developer", "React Native Developer", "Full Stack Engineer", "Fintech Product Builder"]} />
              </div>

              <div className="hin" style={{ animationDelay: "340ms", marginBottom: 36 }}>
                <p className="mono" style={{ fontSize: 13, color: "rgba(255,255,255,.38)", lineHeight: 1.85, maxWidth: 520 }}>
                  Full Stack Developer with <span style={{ color: "white", fontWeight: 600 }}>2.5+ years of experience</span> in the <span style={{ color: C.cyan }}>MERN stack</span> and <span style={{ color: C.pink }}>React Native</span>. Currently at <span style={{ color: C.purple }}>GrowXCD</span>, a Chennai-based fintech — building web platforms and mobile apps used by customers and officers every day. Co-built <span style={{ color: C.cyan }}>GX Mitra</span>, now live on the Play Store.
                </p>
              </div>

              <div className="hin" style={{ animationDelay: "420ms", display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 48 }}>
                {[
                  { label: "View Work →", action: () => scrollTo("Projects"), primary: true },
                  { label: "Contact Me", action: () => scrollTo("Contact"), primary: false },
                ].map(b => (
                  <button key={b.label} onClick={b.action} className="mono" style={{ padding: "13px 26px", fontSize: 12, fontWeight: b.primary ? 600 : 400, background: b.primary ? C.cyan : `rgba(0,245,212,.06)`, color: b.primary ? C.bg : C.cyan, border: b.primary ? "none" : `1px solid rgba(0,245,212,.25)`, borderRadius: 10, cursor: "pointer", boxShadow: b.primary ? `0 0 26px rgba(0,245,212,.4)` : "none", transition: "transform .18s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "none"}>{b.label}</button>
                ))}
                <a href="https://www.linkedin.com/in/muhammed-shifin/" target="_blank" rel="noreferrer" className="mono" style={{ padding: "13px 18px", fontSize: 12, background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.45)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, textDecoration: "none", transition: "transform .18s", display: "flex", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}>LinkedIn ↗</a>
              </div>

              <div className="hin" style={{ animationDelay: "500ms", display: "flex", flexWrap: "wrap", gap: 32, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                {[["2.5+", "Years Exp."],["6+", "Products"], ["5000+", "Users"]].map(([n, l]) => (
                  <div key={l}>
                    <div className="bebas" style={{ fontSize: 30, color: C.cyan, lineHeight: 1 }}>{n}</div>
                    <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,.22)", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="deskonly" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cube size={195} color={C.cyan} />
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
          <span className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,.18)", letterSpacing: "0.18em", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: 1, height: 46, background: `linear-gradient(to bottom, rgba(0,245,212,.45), transparent)` }} />
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ padding: "120px 24px", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 15% 50%, rgba(0,245,212,.04) 0%, transparent 55%)" }} />
        <div className="grid2" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <Reveal>
              <h2 className="syne" style={{ fontSize: "clamp(30px,4vw,50px)", fontWeight: 800, color: "white", marginBottom: 22, lineHeight: 1.1 }}>
                Self-Taught.<br /><span style={{ color: C.cyan }}>Shipped to Production.</span>
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mono" style={{ fontSize: 13, color: "rgba(255,255,255,.42)", lineHeight: 1.9, marginBottom: 14 }}>
                I'm <span style={{ color: "white" }}>Muhammed Shifin P</span>, a self-taught Full Stack Developer from Kerala, India. I specialise in the <span style={{ color: C.cyan }}>MERN stack</span> and <span style={{ color: C.pink }}>React Native</span>, passionate about building real products that solve real problems.
              </p>
              <p className="mono" style={{ fontSize: 13, color: "rgba(255,255,255,.42)", lineHeight: 1.9, marginBottom: 14 }}>
                Over <span style={{ color: "white" }}>2+ years at GrowXCD</span>, a Kerala-based fintech, I've been part of a collaborative team building and maintaining the company's core platform — from web dashboards to mobile apps. I co-built <span style={{ color: C.cyan }}>GX Mitra</span> with my team lead, now live on the <span style={{ color: C.pink }}>Google Play Store</span>, letting customers manage their loans and refer friends from their phones.
              </p>
              <p className="mono" style={{ fontSize: 13, color: "rgba(255,255,255,.35)", lineHeight: 1.9 }}>
                I care about clean architecture, good UX, and writing code that teammates can actually work with.
              </p>
            </Reveal>
            <Reveal delay={200}>
              <div style={{ display: "flex", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
                {[
                  { label: "LinkedIn", href: "https://www.linkedin.com/in/muhammed-shifin/" },
                  { label: "GitHub", href: "#" },
                  { label: "Email", href: "mailto:dev.muhammedshifin@gmail.com" },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="mono" style={{ fontSize: 11, padding: "8px 16px", borderRadius: 8, border: `1px solid rgba(0,245,212,.2)`, color: C.cyan, background: "rgba(0,245,212,.05)", textDecoration: "none", transition: "all .2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,245,212,.13)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,245,212,.05)"; e.currentTarget.style.transform = "none"; }}>{s.label} ↗</a>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal dir="left" delay={100}>
            <div className="neon" style={{ borderRadius: 20, padding: 32, background: C.card, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${C.cyan},${C.purple},${C.pink})` }} />
              <div className="mono" style={{ fontSize: 10, color: C.cyan, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 22 }}>// Quick Facts</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "📍", label: "Location", value: "Kerala, India", color: C.cyan },
                  { icon: "🏢", label: "Current Role", value: "Full Stack Dev · GrowXCD (Fintech)", color: C.pink },
                  { icon: "📱", label: "Live App", value: "GX Mitra — Google Play Store", color: C.purple },
                  { icon: "🎓", label: "Training", value: "MERN Stack · Brototype, Calicut", color: C.blue },
                  { icon: "📧", label: "Email", value: "dev.muhammedshifin@gmail.com", color: C.cyan },
                  { icon: "📞", label: "Phone", value: "+91 6238424753", color: C.pink },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: `${row.color}08`, border: `1px solid ${row.color}14` }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{row.icon}</span>
                    <div>
                      <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,.28)", marginBottom: 1 }}>{row.label}</div>
                      <div className="mono" style={{ fontSize: 11, color: row.color }}>{row.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SKILLS ── */}
      <section id="skills" style={{ padding: "120px 24px", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(123,47,247,.05) 0%, transparent 55%)" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 className="syne" style={{ fontSize: "clamp(30px,4vw,50px)", fontWeight: 800, color: "white" }}>Tech <span style={{ color: C.cyan }}>Arsenal</span></h2>
          </Reveal>
          <div className="grid2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
            {SKILL_GROUPS.map((grp, gi) => (
              <Reveal key={grp.label} delay={gi * 90} dir="up">
                <div className="neon" style={{ borderRadius: 18, padding: "24px 24px 20px", background: C.card, height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: grp.color, boxShadow: `0 0 8px ${grp.color}` }} />
                    <span className="syne" style={{ fontSize: 13, fontWeight: 700, color: grp.color, letterSpacing: "0.04em" }}>{grp.label}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {grp.skills.map((sk, si) => (
                      <Reveal key={sk.name} delay={gi * 90 + si * 40}><SkillTag name={sk.name} icon={sk.icon} color={grp.color} /></Reveal>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div style={{ marginTop: 20, borderRadius: 18, padding: "20px 24px", background: C.card, border: "1px solid rgba(255,255,255,.05)" }}>
              <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,.25)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 14 }}>Also worked with</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["Formik", "Yup", "Joi", "ContextAPI", "Thunk", "Cron Jobs", "EJS", "HBS Template", "Bootstrap", "Material UI", "Sequelize", "Netlify", "Render", "C", "C++"].map(s => (
                  <span key={s} style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", padding: "5px 11px", borderRadius: 6, background: "rgba(255,255,255,.03)", color: "rgba(255,255,255,.32)", border: "1px solid rgba(255,255,255,.07)" }}>{s}</span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section id="projects" style={{ padding: "120px 24px", position: "relative" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal style={{ marginBottom: 52 }}>
            <h2 className="syne" style={{ fontSize: "clamp(30px,4vw,50px)", fontWeight: 800, color: "white" }}>Selected <span style={{ color: C.cyan }}>Work</span></h2>
            <p className="mono" style={{ fontSize: 12, color: "rgba(255,255,255,.28)", marginTop: 10 }}>Professional work + personal projects — all built from scratch</p>
          </Reveal>
          <div className="proj-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 18 }}>
            {PROJECTS_DATA.map((p, i) => <ProjectCard key={p.title} project={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE ── */}
      <section id="experience" style={{ padding: "120px 24px", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(0,245,212,.035) 0%, transparent 55%)" }} />
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="syne" style={{ fontSize: "clamp(30px,4vw,50px)", fontWeight: 800, color: "white" }}>Where I've <span style={{ color: C.cyan }}>Worked</span></h2>
          </Reveal>

          <Reveal delay={100}>
            <div className="neon" style={{ borderRadius: 20, overflow: "hidden", background: C.card, marginBottom: 20 }}>
              <div style={{ height: 3, background: `linear-gradient(90deg,${C.cyan},${C.purple})` }} />
              <div style={{ padding: "32px 36px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 28 }}>
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: C.cyan, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>2022 — Present</div>
                    <div className="bebas" style={{ fontSize: 34, color: "white", lineHeight: 1, letterSpacing: "0.03em" }}>Full Stack Developer</div>
                    <div className="mono" style={{ fontSize: 12, color: "rgba(255,255,255,.38)", marginTop: 5 }}>GrowXCD · Fintech · Kerala, India</div>
                  </div>
                  <div className="mono" style={{ padding: "6px 14px", borderRadius: 8, background: `rgba(0,245,212,.1)`, border: `1px solid rgba(0,245,212,.22)`, fontSize: 10, color: C.cyan }}>Current · 2+ Years</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    "Part of the development team building and maintaining GrowXCD's core fintech platform — web dashboards, internal tools, and APIs used by staff and customers daily",
                    "Co-built GX Mitra with my team lead — a React Native customer-facing app for loan management, profile, and Refer & Earn — now live on the Google Play Store",
                    "Developed the branch operations web platform using the MERN stack: real-time dashboards with Socket.io, role-based access control, and automated reporting",
                    "Built the staff portal covering attendance, task management, payroll overview, and inter-branch communication",
                    "Integrated third-party services including Razorpay, Twilio, Cloudinary, Nodemailer, and MapBox across various features",
                    "Collaborated with a growing team — contributing to code reviews, feature discussions, and shared coding standards",
                  ].map((h, j) => (
                    <Reveal key={j} delay={j * 60}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.cyan, flexShrink: 0, marginTop: 5, boxShadow: `0 0 6px ${C.cyan}` }} />
                        <p className="mono" style={{ fontSize: 13, color: "rgba(255,255,255,.48)", lineHeight: 1.7 }}>{h}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.05)", display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {["React.js", "React Native", "Node.js", "Express", "MongoDB", "Socket.io", "AWS", "JWT", "Razorpay", "Twilio"].map(t => (
                    <span key={t} style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", padding: "4px 10px", borderRadius: 6, background: "rgba(0,245,212,.07)", color: C.cyan, border: "1px solid rgba(0,245,212,.15)" }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="neon" style={{ borderRadius: 20, overflow: "hidden", background: C.card }}>
              <div style={{ height: 3, background: `linear-gradient(90deg,${C.purple},${C.pink})` }} />
              <div style={{ padding: "28px 36px" }}>
                <div className="mono" style={{ fontSize: 10, color: C.purple, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 20 }}>Education</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {[
                    { period: "2022 — Present", title: "MERN Stack Development", place: "Brototype, Calicut", color: C.cyan },
                    { period: "2020 — 2022", title: "Plus Two · BioScience", place: "NMHSS, Malappuram", color: C.purple },
                  ].map((e, i) => (
                    <div key={i} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                      <div style={{ width: 3, minHeight: 44, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                      <div>
                        <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,.28)", letterSpacing: "0.12em", marginBottom: 4 }}>{e.period}</div>
                        <div className="bebas" style={{ fontSize: 20, color: "white", letterSpacing: "0.04em", lineHeight: 1 }}>{e.title}</div>
                        <div className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 3 }}>{e.place}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: "120px 24px", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(0,245,212,.048) 0%, transparent 55%)" }} />
        <div style={{ maxWidth: 660, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <div className="mono" style={{ fontSize: 10, color: C.cyan, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>// 005 — Contact</div>
            <h2 className="syne" style={{ fontSize: "clamp(30px,4vw,50px)", fontWeight: 800, color: "white", marginBottom: 12 }}>Let's <span style={{ color: C.cyan }}>Build</span> Together</h2>
            <p className="mono" style={{ fontSize: 13, color: "rgba(255,255,255,.33)", marginBottom: 48, lineHeight: 1.85 }}>Open to full-time roles, freelance projects, and exciting collaborations. Drop me a message!</p>
          </Reveal>

          {!sent ? (
            <Reveal delay={80}>
              <div className="neon" style={{ borderRadius: 20, padding: "34px 30px", background: C.card, textAlign: "left" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  {[{ label: "Name", key: "name", ph: "Your name" }, { label: "Email", key: "email", ph: "your@email.com" }].map(({ label, key, ph }) => (
                    <div key={key}>
                      <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginBottom: 7 }}>{label}</div>
                      <input value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} style={{ width: "100%", padding: "11px 13px", fontSize: 12, background: "rgba(255,255,255,.04)", border: "1px solid rgba(0,245,212,.1)", borderRadius: 9, color: "white", outline: "none" }}
                        onFocus={e => e.target.style.borderColor = "rgba(0,245,212,.5)"}
                        onBlur={e => e.target.style.borderColor = "rgba(0,245,212,.1)"} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 18 }}>
                  <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginBottom: 7 }}>Message</div>
                  <textarea value={form.msg} onChange={e => setForm({ ...form, msg: e.target.value })} rows={5} placeholder="Tell me about your project or opportunity..." style={{ width: "100%", padding: "11px 13px", fontSize: 12, background: "rgba(255,255,255,.04)", border: "1px solid rgba(0,245,212,.1)", borderRadius: 9, color: "white", outline: "none", resize: "none" }}
                    onFocus={e => e.target.style.borderColor = "rgba(0,245,212,.5)"}
                    onBlur={e => e.target.style.borderColor = "rgba(0,245,212,.1)"} />
                </div>
                <button onClick={() => setSent(true)} className="mono" style={{ width: "100%", padding: 14, fontSize: 12, fontWeight: 600, background: C.cyan, color: C.bg, borderRadius: 9, border: "none", cursor: "pointer", boxShadow: `0 0 26px rgba(0,245,212,.4)`, transition: "transform .18s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "none"}>Send Message →</button>
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <div className="neon" style={{ borderRadius: 20, padding: "56px 32px", background: C.card }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>✓</div>
                <div className="syne" style={{ fontSize: 22, color: C.cyan, marginBottom: 8, fontWeight: 700 }}>Message Sent!</div>
                <p className="mono" style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>I'll get back to you within 24 hours.</p>
                <button onClick={() => setSent(false)} className="mono" style={{ marginTop: 18, fontSize: 11, background: "none", border: "none", color: "rgba(255,255,255,.28)", cursor: "pointer", textDecoration: "underline" }}>Send another</button>
              </div>
            </Reveal>
          )}

          <Reveal delay={180}>
            <div style={{ display: "flex", justifyContent: "center", gap: 44, marginTop: 44, flexWrap: "wrap" }}>
              {[
                { label: "Location", value: "Kerala, India 🇮🇳" },
                { label: "Email", value: "dev.muhammedshifin@gmail.com" },
                { label: "Status", value: "Open to work ✓" },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,.2)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                  <div className="mono" style={{ fontSize: 11, color: C.cyan }}>{value}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(0,245,212,.06)", padding: "26px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, border: `1px solid ${C.cyan}`, background: "rgba(0,245,212,.09)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="mono" style={{ fontSize: 9, fontWeight: 700, color: C.cyan }}>MS</span>
            </div>
            <span className="mono" style={{ fontSize: 11, color: "rgba(255,255,255,.24)" }}>Muhammed Shifin P · Full Stack Developer</span>
          </div>
          <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,.17)" }}>© 2025 · Built with React & ❤️ in Kerala, India</span>
          <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,.17)" }}>MERN · React Native · Fintech</span>
        </div>
      </footer>
    </div>
  );
}