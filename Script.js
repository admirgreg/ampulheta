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
const PLATE_R = 0.62,
  PIN = 0.98,
  POUT = 1.1,
  FLOOR = -1.1,
  PILLAR_D = 0.52,
  NECK = 0.05,
  BULB = 0.36,
  GH = 0.97,
  SIDES = 12;
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
const glassR = (y) => {
  const s = clamp(Math.abs(y) / GH, 0, 1);
  return (
    NECK +
    BULB * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(s, 0.85)), 0), 0.6) +
    0.12 * Math.pow(s, 6)
  );
};
const pillarR = (y) => {
  const u = Math.abs(y);
  return (
    0.032 +
    0.022 * Math.exp(-(((u - 0.86) / 0.035) ** 2)) +
    0.016 * Math.exp(-((y / 0.05) ** 2)) +
    0.008 * Math.cos(y * 18) ** 2
  );
};

// — geometria —
const A = { x: [], y: [], z: [], nx: [], ny: [], nz: [], a: [], k: [], id: [] };
function add(x, y, z, nx, ny, nz, a, k, id) {
  A.x.push(x);
  A.y.push(y);
  A.z.push(z);
  A.nx.push(nx);
  A.ny.push(ny);
  A.nz.push(nz);
  A.a.push(a);
  A.k.push(k);
  A.id.push(id);
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
function plate(ylo, yhi) {
  const N = 240;
  for (let j = 0; j < N; j++) {
    const a = (TAU * j) / N,
      c = ((Math.floor(a / (TAU / SIDES)) + 0.5) * TAU) / SIDES,
      rr = (PLATE_R * Math.cos(Math.PI / SIDES)) / Math.cos(a - c);
    for (let i = 0; i < 6; i++) {
      const y = ylo + ((yhi - ylo) * i) / 5;
      add(
        rr * Math.cos(a),
        y,
        rr * Math.sin(a),
        Math.cos(c),
        0,
        Math.sin(c),
        a,
        0,
        0,
      );
    }
    for (let i = 0; i < 28; i++) {
      const f = 0.02 + (0.98 * i) / 27;
      add(f * rr * Math.cos(a), yhi, f * rr * Math.sin(a), 0, 1, 0, a, 0, 0);
      add(f * rr * Math.cos(a), ylo, f * rr * Math.sin(a), 0, -1, 0, a, 0, 0);
    }
  }
}
plate(FLOOR, -PIN);
plate(PIN, POUT);
for (let k = 0; k < 3; k++) {
  const phi = -Math.PI / 2 + (k * TAU) / 3,
    ox = PILLAR_D * Math.cos(phi),
    oz = PILLAR_D * Math.sin(phi);
  revolve(pillarR, -PIN, PIN, 150, 20, (x, y, z, nx, ny, nz) =>
    add(x + ox, y, z + oz, nx, ny, nz, phi, 1, k),
  );
}
revolve(glassR, -GH, GH, 150, 200, (x, y, z, nx, ny, nz, a) =>
  add(x, y, z, nx, ny, nz, a, 2, 0),
);
const N = A.x.length,
  PX = Float32Array.from(A.x),
  PY = Float32Array.from(A.y),
  PZ = Float32Array.from(A.z),
  NX = Float32Array.from(A.nx),
  NY = Float32Array.from(A.ny),
  NZ = Float32Array.from(A.nz),
  ANG = Float32Array.from(A.a),
  KIND = Uint8Array.from(A.k);
const SEED = new Float32Array(N),
  T0 = new Float32Array(N),
  GLASSIDX = [];
for (let i = 0; i < N; i++) {
  SEED[i] = rnd();
  const a = ANG[i],
    y = PY[i];
  if (KIND[i] == 0) {
    const d = ((((a - Math.PI / 2 + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
    T0[i] = 0.3 + (1.5 * Math.abs(d)) / Math.PI + (y > 0 ? 3.2 : 0);
  } else if (KIND[i] == 1)
    T0[i] = 2 + (1.5 * (y + PIN)) / (2 * PIN) + A.id[i] * 0.15;
  else {
    T0[i] = 4.9 + (1.5 * Math.abs(y)) / GH + (0.12 * a) / TAU;
    GLASSIDX.push(i);
  }
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
  oX = CX + (SC * CAMD * x1) / oD;
  oY = CY - (SC * CAMD * y2) / oD;
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
function sandState(t) {
  if (t < DONE) return { ft: clamp((t - 6.5) / 1.1, 0, 1), fb: 0, flow: 0 };
  return { ft: 1 - sandF, fb: sandF, flow: sandF };
}
function sand(t, a) {
  const { ft, fb, flow } = sandState(t);
  const emit = (x, y, z, nx, ny, nz) => {
    const l = Math.hypot(nx, ny, nz);
    prep(x, y, z, nx / l, ny / l, nz / l, a);
    light();
    const b = 0.16 + 0.75 * L.dif + 0.2 * L.rl;
    put(S, letter(b, qX, qY, false, hash3(x * 40, y * 40, z * 40)), b, 0, 1);
  };
  const heap = (base, h, rmax, pw) => {
    for (let i = 0; i < 30; i++) {
      const rf = i / 29;
      for (let j = 0; j < 150; j++) {
        const an = (TAU * j) / 150,
          c = Math.cos(an),
          s = Math.sin(an);
        const y = base + h * Math.pow(1 - rf, pw),
          sl = (-h * pw * Math.pow(1 - rf, pw - 1 + 1e-6)) / rmax;
        emit(rf * rmax * c, y, rf * rmax * s, -sl * c, 1, -sl * s);
      }
    }
  };
  const wall = (y0, y1) => {
    if (y1 - y0 < 0.01) return;
    revolve(
      (y) => glassR(y) * 0.95,
      y0,
      y1,
      Math.floor(80 * (y1 - y0)) + 2,
      150,
      (x, y, z, nx, ny, nz) => emit(x, y, z, nx, ny, nz),
    );
  };
  if (ft > 0.01) {
    const lv = 0.03 + 0.52 * ft,
      dip = flow > 0 ? 0.1 : 0;
    heap(lv - dip, dip, glassR(lv) * 0.95, 1);
    wall(0.03, lv);
  }
  const fl = -GH + 0.03,
    base = fl + 0.3 * fb,
    cone = 0.22 * Math.min(1, fb * 3);
  if (fb > 0.005) {
    heap(base, cone, glassR(base) * 0.95, 1.3);
    wall(fl, base);
  }
  if (flow > 0 && flow < 0.85 && ft > 0.02)
    for (let i = 0; i < 70; i++) {
      const y = 0.03 + ((base + cone - 0.03) * i) / 69;
      prep((rnd() - 0.5) * 0.02, y, (rnd() - 0.5) * 0.02, 0, 0, 1, a);
      put(
        S,
        ["|", ":", "!"].map((c) => IX[c])[Math.floor(rnd() * 3)],
        0.7,
        0,
        1,
      );
    }
}

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
        (L.nv < 0 ? 0.35 : 1);
    b += 0.9 * flash;
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
  sand(t, a);
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
      const i = GLASSIDX[Math.floor(hash3(k, 3, 7) * GLASSIDX.length)];
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
  lvl = $("lvl"),
  spd = $("spd"),
  spdv = $("spdv");
function flip() {
  if (flipT < 0 && tNow >= DONE) flipT = 0;
}
function wake() {
  panel.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!panel.matches(":hover")) panel.classList.add("idle");
  }, 2800);
}
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
});
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
  chunks = [];
function setPalette(i) {
  pal = i % PAL.length;
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
function beep() {
  try {
    if (!actx) return;
    const o = actx.createOscillator(),
      n = actx.createGain();
    o.frequency.value = 880;
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
$("tmr").onchange = (e) => {
  timerMin = +e.target.value;
  sandF = 0;
  autoWait = 0;
  beeped = false;
  document.title = "Ampulheta ASCII";
  spd.disabled = !!timerMin;
  if (timerMin && !actx)
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {}
  e.target.blur();
};
addEventListener("keydown", (e) => {
  if (e.target.tagName === "SELECT") return;
  const k = e.key.toLowerCase();
  if (k === "f") toggleFS();
  else if (k === "p") togglePause();
  else if (k === "c") setPalette(pal + 1);
  else if (k === "r") setRamp(rampI + 1);
  else if (k === "g") toggleGlow();
  if (e.code === "Space") {
    e.preventDefault();
    flip();
  }
  wake();
});
addEventListener("pointermove", wake);
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
  actx = null;
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
  lastNow = now;
  if (dt > 0) fps += (1 / dt - fps) * 0.05;
  const sdt = paused ? 0 : dt;
  clock += sdt;
  const t = clock;
  tNow = t;
  // areia: escorre na velocidade do slider; quando acaba, vira sozinha
  const rate = timerMin ? 0.85 / (timerMin * 60) : (speed * 0.85) / 12.4;
  if (t >= DONE + 0.3 && flipT < 0) {
    if (sandF < 0.85) sandF = Math.min(0.85, sandF + sdt * rate);
    else if (timerMin) {
      if (!beeped) {
        beeped = true;
        beep();
        document.title = "⏳ acabou!";
      }
    } else {
      autoWait += sdt;
      if (autoWait > 1.5) {
        autoWait = 0;
        flip();
      }
    }
  }
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
      document.title = "Ampulheta ASCII";
    }
  }
  // inércia do arrasto e inclinação voltando ao normal
  if (!dragging) {
    offA += vel;
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
  rimW += ((cursor ? 0.9 : 0.35) - rimW) * Math.min(1, dt * 4);
  if (!levelHold && t >= DONE) lvl.value = sandF;
  render(t);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);
  g.font = CH + "px ui-monospace,Menlo,Consolas,monospace";
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
  const hf = Math.max(11, CH * 0.95);
  g.font = hf + "px ui-monospace,Menlo,Consolas,monospace";
  g.fillStyle = "#777";
  const rem = timerMin ? Math.max(0, Math.ceil((0.85 - sandF) / rate)) : -1,
    mmss = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  [
    HANDLE + " · 2026",
    "rotation " + rotDeg.toFixed(2) + "°",
    "glints " + glCount,
    "letters " + letters,
    "fps " + Math.round(fps) + (paused ? " · pausado" : ""),
    rem >= 0 ? "restante " + mmss(rem) : "",
  ].forEach((s, i) => g.fillText(s, 14, 14 + i * hf * 1.4));
  g.fillStyle = "#e5484d";
  g.textAlign = "right";
  g.fillText("t " + t.toFixed(2) + "s", W - 14, 14);
  g.textAlign = "left";
  if (glowOn) gg.drawImage(cv, 0, 0, glow.width, glow.height); // brilho: cópia pequena, borrada pelo CSS
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
