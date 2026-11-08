// ampulheta em letras — portado do engine em Python (pontos + normais -> luz -> uma letra por célula)
const HANDLE = "@seu_perfil";
const TAU = Math.PI * 2,
  CAMD = 7,
  TILT = 0.22,
  DONE = 7.6;
let CW,
  CH,
  COLS,
  ROWS,
  CX,
  CY,
  SC,
  NC,
  dustW = 1,
  rimW = 0.35;
let RAMP = ".:;-=+!i{}()[]oa0$&%@",
  RL = RAMP.length,
  CHARSET = RAMP + "|/\\_*x'`,~·.:!+&%";
let IX = {};
[...CHARSET].forEach((c, i) => (IX[c] = i));
let FLOOR = -1.1; // chão do reflexo (cada objeto pode mudar)
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
let sd_ = 7;
const rnd = () => {
  sd_ |= 0;
  sd_ = (sd_ + 0x6d2b79f5) | 0;
  let t = Math.imul(sd_ ^ (sd_ >>> 15), 1 | sd_);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hash3 = (x, y, z) => {
  const v = Math.abs(
    Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453,
  );
  return v - Math.floor(v);
};

// — geometria: cada objeto enche A com pontos + normais + hora de aparição (t) —
let A, N, PX, PY, PZ, NX, NY, NZ, ANG, KIND, SEED, T0, SPARK;
function add(x, y, z, nx, ny, nz, a, k, id, t) {
  A.x.push(x);
  A.y.push(y);
  A.z.push(z);
  A.nx.push(nx);
  A.ny.push(ny);
  A.nz.push(nz);
  A.a.push(a);
  A.k.push(k);
  A.id.push(id);
  A.t.push(t || 0);
}
function revolve(rf, y0, y1, ny, nth, cb) {
  for (let i = 0; i < ny; i++) {
    const y = y0 + ((y1 - y0) * i) / (ny - 1),
      r = rf(y),
      dr = (rf(y + 1e-3) - rf(y - 1e-3)) / 2e-3,
      l = Math.hypot(1, dr);
    for (let j = 0; j < nth; j++) {
      const a = (TAU * j) / nth,
        c = Math.cos(a),
        s = Math.sin(a);
      cb(r * c, y, r * s, c / l, -dr / l, s / l, a);
    }
  }
}
// peças reutilizáveis (tf = função que diz quando cada ponto aparece)
function sphere(cx, cy, cz, r, nu, nv, k, tf) {
  for (let i = 0; i < nv; i++) {
    const v = (Math.PI * (i + 0.5)) / nv,
      sv = Math.sin(v),
      cw = Math.cos(v);
    for (let j = 0; j < nu; j++) {
      const u = (TAU * j) / nu,
        nx = sv * Math.cos(u),
        nz = sv * Math.sin(u);
      add(cx + r * nx, cy + r * cw, cz + r * nz, nx, cw, nz, u, k, 0, tf(u));
    }
  }
}
function torus(cx, cy, cz, R, r, nu, nv, k, tf) {
  for (let i = 0; i < nu; i++) {
    const u = (TAU * i) / nu,
      cu = Math.cos(u),
      su = Math.sin(u);
    for (let j = 0; j < nv; j++) {
      const v = (TAU * j) / nv,
        cw = Math.cos(v),
        sv = Math.sin(v);
      add(
        cx + (R + r * cw) * cu,
        cy + (R + r * cw) * su,
        cz + r * sv,
        cw * cu,
        cw * su,
        sv,
        u,
        k,
        0,
        tf(u),
      );
    }
  }
}
function box(x0, x1, y0, y1, z0, z1, d, k, tf) {
  const e = 1e-6;
  for (let x = x0; x <= x1 + e; x += d)
    for (let y = y0; y <= y1 + e; y += d) {
      add(x, y, z0, 0, 0, -1, 0, k, 0, tf(x, y));
      add(x, y, z1, 0, 0, 1, 0, k, 0, tf(x, y));
    }
  for (let x = x0; x <= x1 + e; x += d)
    for (let z = z0; z <= z1 + e; z += d) {
      add(x, y0, z, 0, -1, 0, 0, k, 0, tf(x, y0));
      add(x, y1, z, 0, 1, 0, 0, k, 0, tf(x, y1));
    }
  for (let y = y0; y <= y1 + e; y += d)
    for (let z = z0; z <= z1 + e; z += d) {
      add(x0, y, z, -1, 0, 0, 0, k, 0, tf(x0, y));
      add(x1, y, z, 1, 0, 0, 0, k, 0, tf(x1, y));
    }
}
function puck(r, y0, y1, k, tf) {
  revolve(
    () => r,
    y0,
    y1,
    6,
    Math.floor(r * 240),
    (x, y, z, nx, ny, nz, a) => add(x, y, z, nx, ny, nz, a, k, 0, tf(a)),
  );
  for (let i = 1; i <= 16; i++) {
    const rr = (r * i) / 16,
      n = Math.floor(rr * 220 + 8);
    for (let j = 0; j < n; j++) {
      const a = (TAU * j) / n;
      add(rr * Math.cos(a), y1, rr * Math.sin(a), 0, 1, 0, a, k, 0, tf(a));
    }
  }
}
const sweepF = (a) =>
  Math.abs(((((a - Math.PI / 2 + Math.PI) % TAU) + TAU) % TAU) - Math.PI) /
  Math.PI; // 0 na frente, 1 atrás

const OBJECTS = (window.OBJECT_DEFS || []).slice(); // cada objeto vive em objects/*.js e se registra em OBJECT_DEFS
function finalize() {
  if (OBJ.retime) OBJ.retime(A);
  N = A.x.length;
  PX = Float32Array.from(A.x);
  PY = Float32Array.from(A.y);
  PZ = Float32Array.from(A.z);
  NX = Float32Array.from(A.nx);
  NY = Float32Array.from(A.ny);
  NZ = Float32Array.from(A.nz);
  ANG = Float32Array.from(A.a);
  KIND = Uint8Array.from(A.k);
  T0 = Float32Array.from(A.t);
  SEED = new Float32Array(N);
  SPARK = [];
  for (let i = 0; i < N; i++) {
    SEED[i] = rnd();
    if (KIND[i] == 2) SPARK.push(i);
  }
  if (!SPARK.length) for (let i = 0; i < N; i += 7) SPARK.push(i);
}

// — câmera —
let ca = 1,
  sa = 0,
  lastA = NaN,
  ct = Math.cos(TILT),
  st = Math.sin(TILT),
  tilt = TILT,
  fz = 1,
  fs = 0,
  useFlip = true,
  wY = 0;
let oX, oY, oD, rX, rY, rZ, qX, qY, qZ;
function prep(x, y, z, nx, ny, nz, a, mir) {
  if (a !== lastA) {
    lastA = a;
    ca = Math.cos(a);
    sa = Math.sin(a);
  }
  if (useFlip) {
    const x0 = fz * x - fs * y,
      y0 = fs * x + fz * y,
      a0 = fz * nx - fs * ny,
      b0 = fs * nx + fz * ny;
    x = x0;
    y = y0;
    nx = a0;
    ny = b0;
  } // virar a ampulheta
  if (mir) {
    y = -y + 2 * FLOOR;
    ny = -ny;
  } // reflexo no chão
  wY = y;
  const x1 = ca * x + sa * z,
    z1 = -sa * x + ca * z,
    y2 = ct * y - st * z1,
    z2 = st * y + ct * z1;
  const n1 = ca * nx + sa * nz,
    m1 = -sa * nx + ca * nz;
  qX = n1;
  qY = ct * ny - st * m1;
  qZ = st * ny + ct * m1;
  rX = x1;
  rY = y2;
  rZ = z2;
  oD = CAMD - z2;
  oX = CX + (SCP * CAMD * x1) / oD;
  oY = CY - (SCP * CAMD * y2) / oD;
}
let key = [-0.45, 0.75, 0.55],
  rim = [0, 0.5, 0],
  kn = Math.hypot(...key);
key = key.map((v) => v / kn);
let L = { dif: 0, rl: 0, sp: 0, fr: 0, nv: 0 };
function light() {
  let vx = -rX,
    vy = -rY,
    vz = CAMD - rZ;
  const vl = Math.sqrt(vx * vx + vy * vy + vz * vz);
  vx /= vl;
  vy /= vl;
  vz /= vl;
  const hx = vx + key[0],
    hy = vy + key[1],
    hz = vz + key[2],
    hl = Math.sqrt(hx * hx + hy * hy + hz * hz);
  L.dif = Math.max(qX * key[0] + qY * key[1] + qZ * key[2], 0);
  const r0 = Math.max(qX * rim[0] + qY * rim[1] + qZ * rim[2], 0);
  L.rl = r0 * r0 * r0;
  const s0 = Math.max((qX * hx + qY * hy + qZ * hz) / hl, 0),
    s2 = s0 * s0,
    s4 = s2 * s2,
    s8 = s4 * s4,
    s16 = s8 * s8;
  L.sp = s16 * s16 * s8; // ^40
  const nv = qX * vx + qY * vy + qZ * vz;
  L.nv = nv;
  const o = 1 - Math.abs(nv);
  L.fr = o * o;
}
function letter(b, nx, ny, edge, seed) {
  if (edge) {
    const ax = Math.abs(nx),
      ay = Math.abs(ny);
    if (ax > 2 * ay) return IX["|"];
    if (ay > 2 * ax) return ny > 0 ? IX["_"] : IX["-"];
    return nx * ny > 0 ? IX["\\"] : IX["/"];
  }
  return Math.round(clamp(b * (RL - 1) + (seed - 0.5) * 3, 0, RL - 1));
}

// — grades: uma letra por célula —
const mk = () => ({
  c: new Int8Array(NC).fill(-1),
  b: new Float32Array(NC),
  d: new Float32Array(NC).fill(1e9),
  k: new Uint8Array(NC),
});
let S, Gs, R, Gl;
const reset = (g) => {
  g.c.fill(-1);
  g.b.fill(0);
  g.d.fill(1e9);
  g.k.fill(0);
};
function put(g, ch, b, mode, kind) {
  const c = Math.floor(oX / CW),
    r = Math.floor(oY / CH);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS || b <= 0.02) return;
  const i = r * COLS + c;
  if (mode == 0 ? oD < g.d[i] : b > g.b[i]) {
    g.c[i] = ch;
    g.b[i] = b;
    g.d[i] = oD;
    g.k[i] = kind | 0;
  }
}

// — areia —
// areia: sandF = quanto já escorreu (0 = tudo em cima). Controlada pelo slider e pela virada.
let sandF = 0;
// — brilhos: poeira, órbitas, onda de choque —
const DUST = Array.from({ length: 320 }, () => [
  -4 + 8 * rnd(),
  -2.6 + 5.8 * rnd(),
  -4 + 5 * rnd(),
  0.6 + 1.8 * rnd(),
  0.6 + 1.8 * rnd(),
]);
const ORB = [
  [1.55, 0.95, 0, 0.11],
  [1.75, -0.95, 1, -0.09],
  [1.35, 1.45, 2.1, 0.07],
];
let glCount = 0;
function glints(t) {
  reset(Gl);
  glCount = 0;
  useFlip = false;
  const f0 = Math.min(t / 1.2, 1);
  for (const d of DUST) {
    const c = Math.cos(t * 0.04),
      s = Math.sin(t * 0.04);
    prep(
      c * d[0] * dustW + s * d[2],
      d[1],
      -s * d[0] * dustW + c * d[2],
      0,
      0,
      0,
      0,
    );
    const tw = Math.pow(Math.max(Math.sin(t * d[3] * 3 + d[4] * 9), 0), 6);
    put(Gl, tw > 0.7 ? IX["·"] : IX["."], f0 * (0.08 + 0.4 * tw), 1);
  }
  const fade = clamp((t - DONE) / 1.5, 0, 1);
  if (fade > 0)
    for (const [Rr, tz, yaw, w] of ORB) {
      const cz = Math.cos(tz),
        sz = Math.sin(tz),
        yy = yaw + t * 0.15,
        cy = Math.cos(yy),
        sy = Math.sin(yy);
      for (let i = 0; i < 760; i++) {
        const phi = (TAU * i) / 760;
        let x = Rr * Math.cos(phi),
          y = 0,
          z = Rr * Math.sin(phi);
        const x2 = cz * x - sz * y,
          y2 = sz * x + cz * y;
        const x3 = cy * x2 + sy * z,
          z3 = -sy * x2 + cy * z;
        let cm = 0;
        for (const k of [0, 1]) {
          let d =
            ((((phi - t * w * TAU - k * Math.PI + Math.PI) % TAU) + TAU) %
              TAU) -
            Math.PI;
          cm += Math.exp((-d * d) / 0.04);
        }
        prep(x3, y2, z3, 0, 0, 0, 0);
        put(
          Gl,
          cm > 0.8 ? IX["*"] : cm > 0.4 ? IX["+"] : IX["."],
          fade * (0.12 + 0.85 * cm),
          1,
        );
      }
    }
  for (let k = 0; k < 3; k++) {
    const u = (t - DONE - 0.2 * k) / 2.4;
    if (u > 0 && u < 1) {
      const Rr = 0.9 + 5.5 * Math.pow(u, 0.8);
      for (let i = 0; i < 1100; i++) {
        const an = (TAU * i) / 1100,
          x = Rr * Math.cos(an),
          y = Rr * Math.sin(an) - 0.1,
          z = -0.4,
          c = Math.cos(-tilt),
          s = Math.sin(-tilt);
        const h = hash3(x * 9 + k, y * 9 + k, z * 9 + k);
        prep(x, c * y - s * z, s * y + c * z, 0, 0, 0, 0);
        put(
          Gl,
          IX["x&%*+"[Math.floor(h * 5)]],
          Math.pow(1 - u, 1.5) * (0.35 + 0.45 * h),
          1,
        );
      }
    }
  }
  for (let i = 0; i < NC; i++) if (Gl.c[i] >= 0) glCount++;
  useFlip = true;
}

// — estrela (cruz de luz) —
function star(F, x, y, env) {
  const c0 = Math.floor(x / CW),
    r0 = Math.floor(y / CH);
  const arms = [
    [1, 0, "-", 7],
    [-1, 0, "-", 7],
    [0, 1, "|", 4],
    [0, -1, "|", 4],
    [1, -1, "/", 3],
    [-1, 1, "/", 3],
    [1, 1, "\\", 3],
    [-1, -1, "\\", 3],
  ];
  const cells = [[c0, r0, "*", env]];
  for (const [dc, dr, c, n] of arms)
    for (let i = 1; i <= n; i++)
      cells.push([
        c0 + dc * i,
        r0 + dr * i,
        c,
        env * Math.pow(1 - i / (n + 1), 1.5),
      ]);
  for (const [c, r, ch, b] of cells)
    if (c >= 0 && c < COLS && r >= 0 && r < ROWS && b > F.b[r * COLS + c]) {
      F.c[r * COLS + c] = IX[ch];
      F.b[r * COLS + c] = b;
      F.k[r * COLS + c] = 0;
    }
}

// — um quadro —
let FIN;
let letters = 0,
  rotDeg = 0;
function render(t) {
  const u = Math.max(t - DONE, 0),
    a = (TAU / 12) * (u - 1.2 * (1 - Math.exp(-u / 1.2))) + offA;
  rotDeg = ((((a * 180) / Math.PI) % 360) + 360) % 360;
  useFlip = true;
  reset(S);
  reset(Gs);
  reset(R);
  let nn = 0,
    mx = 0,
    my = 0;
  for (let i = 0; i < N; i++) {
    const age = t - T0[i];
    if (age < 0) continue;
    prep(PX[i], PY[i], PZ[i], NX[i], NY[i], NZ[i], a);
    light();
    const glass = KIND[i] == 2,
      flash = age < 0.4 ? Math.pow(1 - age / 0.4, 2) : 0;
    let b;
    if (glass) {
      b = 0.03 + 0.85 * (L.fr * Math.sqrt(L.fr)) + 0.9 * L.sp + 0.2 * L.rl;
      if (b < 0.16 && SEED[i] > 0.12) b = 0;
    } else
      b =
        (0.14 + 0.7 * L.dif + rimW * L.rl + 0.8 * L.sp + 0.2 * L.fr) *
        (L.nv < 0 ? 0.35 : 1) *
        (KIND[i] == 3 ? 0.5 : KIND[i] == 4 ? 0.62 : 1);
    b += 0.9 * flash + bBoost;
    if (b <= 0.02) continue;
    const ch =
      flash > 0.05
        ? Math.floor(Math.random() * RL)
        : letter(b, qX, qY, Math.abs(L.nv) < 0.2, SEED[i]);
    put(glass ? Gs : S, ch, b, glass ? 1 : 0);
    if (age < 0.12) {
      nn++;
      mx += oX;
      my += oY;
    }
    if (i % 3 == 0) {
      prep(PX[i], PY[i], PZ[i], NX[i], NY[i], NZ[i], a, true);
      const yy = wY;
      light();
      let rb = glass ? 0.6 * L.fr : 0.1 + 0.55 * L.dif + 0.3 * L.rl;
      rb *= 0.17 * Math.exp(-1.3 * (FLOOR - yy));
      put(R, letter(rb * 3, qX, qY, false, SEED[i]), rb, 1);
    }
  }
  if (OBJ.draw) OBJ.draw(t, a);
  // vidro sobre sólido
  for (let i = 0; i < NC; i++) {
    if (Gs.c[i] < 0) continue;
    const front = S.c[i] < 0 || Gs.d[i] < S.d[i];
    if (!front) continue;
    const lit = Math.max(S.b[i] * 0.8 + Gs.b[i] * 0.5, Gs.b[i]);
    if (Gs.b[i] >= S.b[i] * 0.8) {
      S.c[i] = Gs.c[i];
      S.k[i] = Gs.k[i];
    }
    S.b[i] = lit;
    S.d[i] = Gs.d[i];
  }
  glints(t);
  for (let i = 0; i < NC; i++) {
    let c = R.c[i],
      b = R.b[i],
      k = 0;
    if (Gl.c[i] >= 0 && Gl.b[i] > b) {
      c = Gl.c[i];
      b = Gl.b[i];
    }
    if (
      S.c[i] >= 0 &&
      !(Gl.c[i] >= 0 && Gl.d[i] < S.d[i] && Gl.b[i] > S.b[i] * 0.6)
    ) {
      c = S.c[i];
      b = S.b[i];
      k = S.k[i];
    }
    FIN.c[i] = c;
    FIN.b[i] = b;
    FIN.k[i] = k;
  }
  // linhas-guia durante a construção
  if (nn && t < DONE) {
    const c0 = Math.floor(mx / nn / CW),
      r0 = Math.floor(my / nn / CH);
    if (r0 >= 0 && r0 < ROWS)
      for (let c = Math.max(c0 - 46, 0); c < Math.min(c0 + 46, COLS); c += 2) {
        const i = r0 * COLS + c;
        if (FIN.c[i] < 0) {
          FIN.c[i] = IX["-"];
          FIN.b[i] = 0.2;
        }
      }
    if (c0 >= 0 && c0 < COLS)
      for (let r = Math.max(r0 - 30, 0); r < Math.min(r0 + 30, ROWS); r += 2) {
        const i = r * COLS + c0;
        if (FIN.c[i] < 0) {
          FIN.c[i] = IX["|"];
          FIN.b[i] = 0.16;
        }
      }
    star(FIN, c0 * CW, r0 * CH, 0.55);
  }
  // brilhos no vidro depois de pronto
  if (t > DONE)
    for (
      let k = Math.max(Math.floor((t - DONE) / 0.45) - 1, 0);
      k <= Math.floor((t - DONE) / 0.45);
      k++
    ) {
      const uu = (t - DONE - k * 0.45) / 0.6;
      if (uu < 0 || uu > 1) continue;
      const i = SPARK[Math.floor(hash3(k, 3, 7) * SPARK.length)];
      prep(PX[i], PY[i], PZ[i], NX[i], NY[i], NZ[i], a);
      star(FIN, oX, oY, Math.sin(Math.PI * uu));
    }
  for (const bt of beats) {
    const uu = (clock - bt.t) / 0.5;
    if (uu < 0 || uu > 1) continue; // estrelas no ritmo da música
    const i = SPARK[bt.i % SPARK.length];
    prep(PX[i], PY[i], PZ[i], NX[i], NY[i], NZ[i], a);
    star(FIN, oX, oY, Math.sin(Math.PI * uu));
  }
  letters = 0;
  for (let i = 0; i < NC; i++) if (S.c[i] >= 0) letters++;
}

// — tela cheia, entrada e controles —
const cv = document.getElementById("c"),
  g = cv.getContext("2d"),
  $ = (id) => document.getElementById(id);
const glow = $("glow"),
  gg = glow.getContext("2d");
let glowOn = true,
  shades;
let dpr, W, H;
function layout() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  cv.width = W * dpr;
  cv.height = H * dpr;
  glow.width = Math.ceil(W / 6);
  glow.height = Math.ceil(H / 6);
  CH = Math.max(10, H / 100);
  CW = (CH * 8) / 13;
  COLS = Math.floor(W / CW);
  ROWS = Math.floor(H / CH);
  NC = COLS * ROWS; // a grade acompanha a janela
  CX = W / 2;
  CY = H * 0.45;
  SC = Math.min(H * 0.3, W * 0.37);
  dustW = Math.max(1, (W / H) * 0.8);
  S = mk();
  Gs = mk();
  R = mk();
  Gl = mk();
  FIN = {
    c: new Int8Array(NC),
    b: new Float32Array(NC),
    k: new Uint8Array(NC),
  };
}

let offA = 0,
  vel = 0,
  tiltOff = 0,
  dragging = false,
  px0 = 0,
  py0 = 0,
  moved = 0,
  lastMove = 0,
  flipT = -1,
  autoWait = 0,
  speed = 1,
  tNow = 0,
  lastNow = 0,
  levelHold = false,
  idleTimer;
let mx = 0.5,
  my = 0.5,
  cursor = false,
  lightV = [0, 0.5, 0.7];
const panel = $("panel"),
  uiRoot = $("ui"),
  menuBtn = $("menuBtn"),
  lvl = $("lvl"),
  spd = $("spd"),
  spdv = $("spdv");
function flip() {
  if (OBJ.sand && flipT < 0 && tNow >= DONE) flipT = 0;
}
function wake() {
  menuBtn.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!panel.classList.contains("open")) menuBtn.classList.add("idle");
  }, 2800);
}
function toggleMenu(open) {
  const o = open === undefined ? !panel.classList.contains("open") : open;
  panel.classList.toggle("open", o);
  menuBtn.classList.toggle("open", o);
  menuBtn.setAttribute("aria-expanded", String(o));
  panel.setAttribute("aria-hidden", String(!o));
  wake();
}
menuBtn.onclick = () => toggleMenu();
const toggleFS = () =>
  document.fullscreenElement
    ? document.exitFullscreen()
    : document.documentElement.requestFullscreen();

// arrastar = girar (soltou, volta ao giro automático); clique sem arrastar = virar
cv.addEventListener("pointerdown", (e) => {
  dragging = true;
  px0 = e.clientX;
  py0 = e.clientY;
  moved = 0;
  vel = 0;
  cv.setPointerCapture(e.pointerId);
  if (panel.classList.contains("open")) {
    toggleMenu(false);
    moved = 99;
  }
}); // clicar fora fecha o menu (sem virar)
cv.addEventListener("pointermove", (e) => {
  mx = e.clientX / W;
  my = e.clientY / H;
  cursor = true;
  if (dragging) {
    const dx = e.clientX - px0,
      dy = e.clientY - py0;
    px0 = e.clientX;
    py0 = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    offA += dx * 0.008;
    vel = dx * 0.008;
    lastMove = performance.now();
    tiltOff = clamp(tiltOff + dy * 0.004, -0.7, 0.7);
  }
});
cv.addEventListener("pointerup", () => {
  if (dragging && moved < 6) flip();
  if (performance.now() - lastMove > 80) vel = 0;
  dragging = false;
});
cv.addEventListener("pointercancel", () => (dragging = false));
spd.oninput = () => {
  speed = +spd.value;
  spdv.textContent = speed.toFixed(1) + "×";
};
lvl.oninput = () => {
  levelHold = true;
  sandF = +lvl.value;
  autoWait = 0;
};
lvl.onchange = () => (levelHold = false);
$("flipBtn").onclick = flip;
$("fs").onclick = toggleFS;
const PAL = [
  ["branco", [0.93, 0.95, 1], [1, 0.72, 0.25]],
  ["verde", [0.25, 1, 0.45], [1, 0.3, 0.75]],
  ["âmbar", [1, 0.7, 0.2], [0.35, 0.7, 1]],
  ["ciano", [0.3, 0.85, 1], [1, 0.55, 0.2]],
  ["vermelho", [1, 0.25, 0.3], [0.3, 1, 0.85]],
]; // [nome, objeto, areia]
const RAMPS = [
  ["original", ".:;-=+!i{}()[]oa0$&%@"],
  ["clássico", ".:;!i><~+_-?1tfjxnuvczXYUJCL0OZmwpdbkhao*#MW&8%B@"],
  ["dígitos", ".:;-1l7I0O8@#"],
];
let pal = 0,
  rampI = 0,
  rec = null,
  chunks = [],
  userPal = 0;
const PH = { foco: 25, pausa: 5, longa: 15 },
  PHN = { foco: "FOCO", pausa: "PAUSA", longa: "PAUSA LONGA" },
  pomo = { on: false, phase: "foco", cycle: 1, done: 0 };
function setPalette(i, auto) {
  pal = i % PAL.length;
  if (!auto) userPal = pal;
  const mk3 = ([a, b, c]) =>
    Array.from({ length: 24 }, (_, k) => {
      const v = 40 + (215 * k) / 23;
      return `rgb(${(v * a) | 0},${(v * b) | 0},${(v * c) | 0})`;
    });
  shades = mk3(PAL[pal][1]).concat(mk3(PAL[pal][2]));
  $("pal").textContent = "◐ cor: " + PAL[pal][0];
}
function setRamp(i) {
  rampI = i % RAMPS.length;
  RAMP = RAMPS[rampI][1];
  RL = RAMP.length;
  CHARSET = RAMP + "|/\\_*x'`,~·.:!+&%";
  IX = {};
  [...CHARSET].forEach((c, k) => (IX[c] = k));
  $("ramp").textContent = "Aa letras: " + RAMPS[rampI][0];
}
function beep(f) {
  try {
    if (!actx) return;
    const o = actx.createOscillator(),
      n = actx.createGain();
    o.frequency.value = f || 880;
    o.connect(n);
    n.connect(actx.destination);
    n.gain.setValueAtTime(0.2, actx.currentTime);
    n.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 1.2);
    o.start();
    o.stop(actx.currentTime + 1.2);
  } catch (e) {}
}
function toggleRec() {
  const b = $("rec");
  if (rec) {
    rec.stop();
    return;
  }
  const mt = ["video/webm;codecs=vp9", "video/webm"].find((m) =>
    MediaRecorder.isTypeSupported(m),
  );
  rec = new MediaRecorder(cv.captureStream(60), {
    mimeType: mt,
    videoBitsPerSecond: 12e6,
  });
  chunks = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  rec.onstop = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
    a.download = "ampulheta.webm";
    a.click();
    rec = null;
    b.textContent = "● gravar";
  };
  rec.start();
  b.textContent = "■ parar e salvar";
}
const togglePause = () => {
  paused = !paused;
  $("pause").textContent = paused ? "▶ retomar" : "⏸ pausar";
};
const toggleGlow = () => {
  glowOn = !glowOn;
  glow.style.display = glowOn ? "" : "none";
};
$("pause").onclick = togglePause;
$("pal").onclick = () => setPalette(pal + 1);
$("ramp").onclick = () => setRamp(rampI + 1);
$("glowBtn").onclick = toggleGlow;
$("rec").onclick = toggleRec;
function syncUI() {
  spd.disabled = !OBJ.sand || !!timerMin;
  lvl.disabled = !OBJ.sand;
  $("flipBtn").disabled = !OBJ.sand;
  [...$("objList").children].forEach((b, i) =>
    b.classList.toggle("on", i === objI),
  );
}
function advancePomo() {
  const p = pomo;
  if (p.phase === "foco") {
    p.done++;
    p.phase = p.cycle % 4 === 0 ? "longa" : "pausa";
  } else {
    p.cycle = p.phase === "longa" ? 1 : p.cycle + 1;
    p.phase = "foco";
  }
  timerMin = PH[p.phase];
  setPalette(p.phase === "foco" ? userPal : userPal === 1 ? 3 : 1, true);
} // pausa: troca de cor
$("tmr").onchange = (e) => {
  const v = e.target.value;
  if (pomo.on) setPalette(userPal, true);
  pomo.on = v === "pomo";
  if (pomo.on) {
    pomo.phase = "foco";
    pomo.cycle = 1;
    timerMin = PH.foco;
  } else timerMin = +v;
  sandF = 0;
  autoWait = 0;
  beeped = false;
  lastTitle = "";
  document.title = "Ampulheta ASCII";
  syncUI();
  if (timerMin)
    try {
      ensureCtx();
    } catch (_) {}
  e.target.blur();
};

// objetos
let OBJ = OBJECTS[0],
  objI = 0,
  objStart = 0;
function setObject(i) {
  objI = ((i % OBJECTS.length) + OBJECTS.length) % OBJECTS.length;
  OBJ = OBJECTS[objI];
  FLOOR = OBJ.floor !== undefined ? OBJ.floor : -1.1;
  A = {
    x: [],
    y: [],
    z: [],
    nx: [],
    ny: [],
    nz: [],
    a: [],
    k: [],
    id: [],
    t: [],
  };
  OBJ.build();
  finalize();
  objStart = clock;
  flipT = -1;
  fz = 1;
  fs = 0;
  beats.length = 0;
  syncUI();
} // a construção recomeça; o timer continua
function buildObjList() {
  const L = $("objList");
  L.innerHTML = "";
  OBJECTS.forEach((o, i) => {
    const b = document.createElement("button");
    b.textContent = o.label;
    b.onclick = () => setObject(i);
    L.appendChild(b);
  });
}
buildObjList();

// áudio: microfone, áudio de uma aba/sistema, ou arquivo
function ensureCtx() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === "suspended") actx.resume();
  return actx;
}
function setupAn(src) {
  const c = ensureCtx();
  audioSrc = src;
  analyser = c.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.5;
  abuf = new Uint8Array(analyser.frequencyBinCount);
  src.connect(analyser);
}
function stopAudio() {
  try {
    audioSrc && audioSrc.disconnect();
  } catch (_) {}
  micStream && micStream.getTracks().forEach((t) => t.stop());
  audioEl && audioEl.pause();
  audioSrc = micStream = audioEl = analyser = null;
  audioMode = "";
  $("tab").textContent = "♪ aba";
  $("aud").textContent = "♪ arquivo";
}
async function startTab() {
  stopAudio();
  try {
    const c = ensureCtx(),
      s = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    if (!s.getAudioTracks().length) {
      s.getTracks().forEach((t) => t.stop());
      alert(
        'Na janela de compartilhamento, marque "Compartilhar áudio da guia/do sistema".',
      );
      return;
    }
    micStream = s;
    setupAn(c.createMediaStreamSource(new MediaStream(s.getAudioTracks())));
    audioMode = "tab";
    $("tab").textContent = "■ aba";
  } catch (e) {}
}
function startFile(f) {
  stopAudio();
  const c = ensureCtx();
  audioEl = new Audio(URL.createObjectURL(f));
  audioEl.loop = true;
  setupAn(c.createMediaElementSource(audioEl));
  analyser.connect(c.destination);
  audioEl.play();
  audioMode = "file";
  $("aud").textContent = "■ arquivo";
}
$("tab").onclick = () => (audioMode === "tab" ? stopAudio() : startTab());
$("aud").onclick = () =>
  audioMode === "file" ? stopAudio() : $("audioFile").click();
$("audioFile").onchange = (e) => {
  if (e.target.files[0]) startFile(e.target.files[0]);
  e.target.value = "";
};
addEventListener("keydown", (e) => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if (k === "f") toggleFS();
  else if (k === "p") togglePause();
  else if (k === "c") setPalette(pal + 1);
  else if (k === "r") setRamp(rampI + 1);
  else if (k === "g") toggleGlow();
  else if (k === "o") setObject(objI + 1);
  else if (k === "h")
    uiRoot.style.display = uiRoot.style.display === "none" ? "" : "none";
  else if (k === "m") toggleMenu();
  else if (k === "escape") toggleMenu(false);
  if (e.code === "Space") {
    e.preventDefault();
    flip();
  }
  wake();
});
addEventListener("pointermove", wake);
addEventListener("pointerdown", wake);
addEventListener("resize", layout);
setPalette(0);
setRamp(0);
layout();
wake();

let clock = 0,
  paused = false,
  fps = 60,
  timerMin = 0,
  beeped = false,
  actx = null,
  lastTitle = "",
  pomoAt = 0,
  lastDraw = 0;
let bass = 0,
  mid = 0,
  tre = 0,
  bBoost = 0,
  lastBeat = 0,
  beats = [],
  SCP = 1,
  analyser = null,
  abuf = null,
  audioSrc = null,
  audioEl = null,
  micStream = null,
  audioMode = "",
  weArr = null,
  weTime = 0;
const FONT = "ui-monospace,Menlo,Consolas,monospace";
// Wallpaper Engine entrega o espectro do som do sistema sem pedir permissão (128 valores: 64 esquerda + 64 direita, graves primeiro)
if (typeof window.wallpaperRegisterAudioListener === "function")
  window.wallpaperRegisterAudioListener((a) => {
    weArr = a;
    weTime = performance.now();
  });
function frame(now) {
  if (fpsCap && now - lastDraw < 1000 / fpsCap - 2) {
    requestAnimationFrame(frame);
    return;
  }
  lastDraw = now;
  const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
  lastNow = now;
  if (dt > 0) fps += (1 / dt - fps) * 0.05;
  const sdt = paused ? 0 : dt;
  clock += sdt;
  const t = clock - objStart;
  tNow = t;
  // áudio: graves, médios e agudos (0..1) -> pulso, brilho, giro e estrelas no ritmo
  let rb = -1,
    rm = 0,
    rt = 0;
  if (analyser) {
    analyser.getByteFrequencyData(abuf);
    const avg = (a, b) => {
      let s = 0;
      for (let i = a; i < b; i++) s += abuf[i];
      return Math.min(1, (s / ((b - a) * 255)) * 1.8);
    };
    rb = avg(1, 5);
    rm = avg(5, 40);
    rt = avg(40, 120);
  } else if (weArr && performance.now() - weTime < 600) {
    const aw = (a, b) => {
      let s = 0;
      for (let i = a; i < b; i++) s += weArr[i] + weArr[i + 64];
      return Math.min(1, (s / ((b - a) * 2)) * 1.7);
    };
    rb = aw(0, 3);
    rm = aw(3, 22);
    rt = aw(22, 64);
  }
  if (rb >= 0) {
    const sm = (v, r) => v + (r - v) * (r > v ? 0.6 : 0.1),
      pb = bass;
    bass = sm(bass, rb);
    mid = sm(mid, rm);
    tre = sm(tre, rt);
    if (rb - pb > 0.12 && rb > 0.35 && clock - lastBeat > 0.25) {
      lastBeat = clock;
      beats.push({ t: clock, i: Math.floor(Math.random() * 1e6) });
      if (beats.length > 4) beats.shift();
    }
  } else {
    bass *= 0.9;
    mid *= 0.9;
    tre *= 0.9;
  }
  SCP =
    SC *
    (typeof OBJ.scale === "function" ? OBJ.scale() : OBJ.scale || 1) *
    (1 + 0.09 * bass);
  bBoost = 0.35 * bass;
  if (analyser || weArr || bass > 0.01)
    glow.style.opacity = (0.6 + 0.4 * bass).toFixed(2);
  // areia: escorre na velocidade do slider; quando acaba, vira sozinha
  const rate = timerMin ? 0.85 / (timerMin * 60) : (speed * 0.85) / 12.4;
  if (clock >= DONE + 0.3 && flipT < 0 && (OBJ.sand || timerMin)) {
    if (sandF < 0.85) sandF = Math.min(0.85, sandF + sdt * rate);
    else if (timerMin) {
      if (!beeped) {
        beeped = true;
        beep(pomo.on && pomo.phase === "foco" ? 523 : 880);
        document.title = "⏳ acabou!";
        pomoAt = clock + 2.5;
      }
    } else {
      autoWait += sdt;
      if (autoWait > 1.5) {
        autoWait = 0;
        flip();
      }
    }
  }
  if (pomo.on && beeped && clock >= pomoAt && flipT < 0) {
    advancePomo();
    if (tNow >= DONE && OBJ.sand) flip();
    else {
      sandF = 0;
      beeped = false;
      autoWait = 0;
    }
  } // pomodoro: próxima fase
  // virada de 180°; no fim, o que estava embaixo passa a estar em cima
  if (flipT >= 0) {
    flipT += sdt / 1.5;
    const p = Math.min(flipT, 1),
      e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    fz = Math.cos(Math.PI * e);
    fs = Math.sin(Math.PI * e);
    if (flipT >= 1) {
      flipT = -1;
      fz = 1;
      fs = 0;
      sandF = timerMin ? 0 : 1 - sandF;
      autoWait = 0;
      beeped = false;
      lastTitle = "";
      document.title = "Ampulheta ASCII";
    }
  }
  // inércia do arrasto e inclinação voltando ao normal
  if (!dragging) {
    offA += vel + dt * bass * 1.4;
    vel *= Math.pow(0.02, dt);
    tiltOff -= tiltOff * Math.min(1, dt * 1.5);
  }
  tilt = TILT + tiltOff;
  ct = Math.cos(tilt);
  st = Math.sin(tilt);
  // luz: segue o cursor; sem cursor, orbita como no original
  const tg = cursor
      ? [(mx - 0.5) * 3, (0.5 - my) * 3, 0.7]
      : [Math.cos(t * 0.9), 0.5, Math.sin(t * 0.9)],
    tl = Math.hypot(...tg);
  for (let i = 0; i < 3; i++)
    lightV[i] += (tg[i] / tl - lightV[i]) * Math.min(1, dt * 8);
  const ll = Math.hypot(...lightV);
  rim = lightV.map((v) => v / ll);
  rimW += ((cursor ? 0.9 : 0.35) + 0.4 * bass - rimW) * Math.min(1, dt * 4);
  if (!levelHold && t >= DONE && OBJ.sand) lvl.value = sandF;
  render(t);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  g.font = CH + "px " + FONT;
  g.textBaseline = "top";
  let last = -1;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c,
        ch = FIN.c[i];
      if (ch < 0) continue;
      const s =
        Math.min(23, Math.floor(clamp(FIN.b[i] * 1.15, 0, 1) * 23)) +
        24 * FIN.k[i];
      if (s !== last) {
        g.fillStyle = shades[s];
        last = s;
      }
      g.fillText(CHARSET[ch], c * CW, r * CH);
    }
  const rem = timerMin ? Math.max(0, Math.ceil((0.85 - sandF) / rate)) : -1,
    mmss = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  if (timerMin && !beeped) {
    const tt = "⏳ " + mmss(rem) + (pomo.on ? " · " + PHN[pomo.phase] : "");
    if (tt !== lastTitle) {
      document.title = tt;
      lastTitle = tt;
    }
  }
  if (timerMin) {
    g.textAlign = "center";
    g.fillStyle = shades[24 + 20];
    g.font = "bold " + Math.round(CH * 3.4) + "px " + FONT;
    g.fillText(mmss(rem), W / 2, H * 0.04);
    if (pomo.on) {
      g.font = Math.round(CH * 1.1) + "px " + FONT;
      g.fillStyle = shades[24 + 12];
      g.fillText(
        PHN[pomo.phase] +
          " " +
          pomo.cycle +
          "/4 · ciclos concluídos: " +
          pomo.done,
        W / 2,
        H * 0.04 + CH * 4.2,
      );
    }
    g.textAlign = "left";
  }
  if (showHud) {
    const hf = Math.max(11, CH * 0.95);
    g.font = hf + "px " + FONT;
    g.fillStyle = "#777";
    [
      HANDLE + " · 2026",
      OBJ.label + " · rotation " + rotDeg.toFixed(2) + "°",
      "glints " + glCount,
      "letters " + letters,
      "fps " +
        Math.round(fps) +
        (paused ? " · pausado" : "") +
        (analyser
          ? " · ♪ " + audioMode
          : weArr && performance.now() - weTime < 600
            ? " · ♪ sistema"
            : ""),
    ].forEach((s, i) => g.fillText(s, 64, 20 + i * hf * 1.4));
    g.fillStyle = "#e5484d";
    g.textAlign = "right";
    g.fillText("t " + t.toFixed(2) + "s", W - 14, 14);
    g.textAlign = "left";
  }
  if (glowOn) gg.drawImage(cv, 0, 0, glow.width, glow.height); // brilho: cópia pequena, borrada pelo CSS
  if (cycleSec && t > DONE + cycleSec) {
    setObject(objI + 1);
    setPalette(pal + 1);
  } // modo papel de parede: troca de objeto
  requestAnimationFrame(frame);
}

// — configuração: window.CONFIG (wallpaper.html) ou parâmetros na URL (?obj=coroa&pal=verde&timer=pomo) —
const CFG = Object.assign(
  {},
  window.CONFIG || {},
  typeof location !== "undefined"
    ? Object.fromEntries(new URLSearchParams(location.search))
    : {},
);
const WALL = !!+CFG.wallpaper,
  fpsCap = +CFG.fps || (WALL ? 30 : 0),
  cycleSec = +CFG.cycle || 0,
  showHud = CFG.hud !== undefined ? !!+CFG.hud : !WALL;
const idx = (list, v, key) => {
  if (v === undefined || v === "") return 0;
  if (!isNaN(+v)) return +v;
  return Math.max(
    0,
    list.findIndex((o) => (o[key] || o) === v),
  );
};
if (CFG.pal !== undefined) setPalette(idx(PAL, CFG.pal, 0));
if (CFG.ramp !== undefined) setRamp(idx(RAMPS, CFG.ramp, 0));
if (CFG.glow !== undefined && !+CFG.glow) toggleGlow();
if (CFG.speed) {
  speed = +CFG.speed;
  spd.value = speed;
  spdv.textContent = speed.toFixed(1) + "×";
}
if (CFG.timer) {
  const o = $("tmr");
  o.value = CFG.timer;
  o.onchange({ target: o });
}
if (CFG.ui !== undefined ? !+CFG.ui : WALL) uiRoot.style.display = "none";
if (WALL) document.body.style.cursor = "none";
setObject(idx(OBJECTS, CFG.obj, "id"));
requestAnimationFrame(frame);
