// Chave antiga.
(function () {
  function buildChave() {
    torus(0, 0.7, 0, 0.3, 0.085, 200, 34, 1, (u) => 0.3 + (2.4 * u) / TAU);
    for (let k = 0; k < 3; k++) {
      const a = Math.PI / 2 + (k * TAU) / 3;
      sphere(
        0.14 * Math.cos(a),
        0.7 + 0.14 * Math.sin(a),
        0,
        0.055,
        22,
        14,
        1,
        () => 2.2 + 0.3 * k,
      );
    }
    const sr = (y) =>
      0.062 +
      0.026 * Math.exp(-(((y - 0.36) / 0.03) ** 2)) +
      0.02 * Math.exp(-(((y + 0.1) / 0.025) ** 2)) +
      0.018 * Math.exp(-(((y + 0.55) / 0.025) ** 2));
    revolve(sr, -1.02, 0.42, 200, 36, (x, y, z, nx, ny, nz, a) =>
      add(x, y, z, nx, ny, nz, a, 1, 0, 2.6 + (2.4 * (y + 1.02)) / 1.44),
    );
    const bt = (x, y) => 5 + (1.3 * (x - 0.05)) / 0.3 + (y + 1.02) * 0.9;
    box(0.05, 0.34, -1.02, -0.92, -0.035, 0.035, 0.011, 1, bt);
    box(0.05, 0.26, -0.86, -0.78, -0.035, 0.035, 0.011, 1, bt);
    box(0.05, 0.34, -0.72, -0.62, -0.035, 0.035, 0.011, 1, bt);
    box(0.05, 0.12, -1.02, -0.62, -0.035, 0.035, 0.011, 1, bt);
  }

  (window.OBJECT_DEFS = window.OBJECT_DEFS || []).push({
    id: "chave",
    label: "chave",
    build: buildChave,
    floor: -1.02,
  });
})();
