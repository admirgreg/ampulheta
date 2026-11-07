// Disco de vinil em pé (sulcos que brilham com a luz).
(function () {
  function buildVinil() {
    // disco em pé: os sulcos alternam a inclinação da normal e brilham ao girar
    for (const s of [1, -1])
      for (let i = 0; i < 110; i++) {
        const r = 0.37 + (0.63 * i) / 109,
          w = (i % 2 ? 1 : -1) * 0.5,
          nth = Math.floor(70 + r * 300),
          l = Math.hypot(w, 1);
        for (let j = 0; j < nth; j++) {
          const a = (TAU * j) / nth,
            c = Math.cos(a),
            sn = Math.sin(a);
          add(
            r * c,
            r * sn,
            s * 0.02,
            (w * c) / l,
            (w * sn) / l,
            s / l,
            a,
            1,
            0,
            0.5 + 6.3 * r,
          );
        }
      }
    for (let j = 0; j < 420; j++) {
      const a = (TAU * j) / 420,
        c = Math.cos(a),
        sn = Math.sin(a);
      for (let q = 0; q < 5; q++)
        add(c, sn, -0.02 + 0.01 * q, c, sn, 0, a, 1, 0, 7);
    }
    for (const s of [1, -1])
      for (let i = 0; i < 26; i++) {
        const r = 0.03 + (0.34 * i) / 25,
          nth = Math.floor(12 + r * 260);
        for (let j = 0; j < nth; j++) {
          const a = (TAU * j) / nth;
          add(
            r * Math.cos(a),
            r * Math.sin(a),
            s * 0.022,
            0,
            0,
            s,
            a,
            0,
            0,
            0.3 + 6.3 * r,
          );
        }
      }
  }

  (window.OBJECT_DEFS = window.OBJECT_DEFS || []).push({
    id: "vinil",
    label: "vinil",
    build: buildVinil,
    floor: -1,
  });
})();
