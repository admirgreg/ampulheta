// Coroa.
(function () {
  function buildCoroa() {
    const br = (y) => 0.56 + (0.14 * (y + 0.9)) / 0.64;
    revolve(br, -0.9, -0.26, 90, 260, (x, y, z, nx, ny, nz, a) =>
      add(
        x,
        y,
        z,
        nx,
        ny,
        nz,
        a,
        1,
        0,
        1.6 + (1.6 * (y + 0.9)) / 0.64 + 0.8 * sweepF(a),
      ),
    );
    revolve(
      (y) => br(y) - 0.04,
      -0.9,
      -0.26,
      60,
      220,
      (x, y, z, nx, ny, nz, a) =>
        add(
          x,
          y,
          z,
          -nx,
          -ny,
          -nz,
          a,
          1,
          0,
          2 + (1.6 * (y + 0.9)) / 0.64 + 0.8 * sweepF(a),
        ),
    );
    for (let k = 0; k < 5; k++) {
      const phi = (k * TAU) / 5 + Math.PI / 2,
        h = k % 2 ? 0.62 : 0.92,
        rb = br(-0.26) - 0.07,
        ox = rb * Math.cos(phi),
        oz = rb * Math.sin(phi);
      revolve(
        (y) => Math.max(0.15 * (1 - (y + 0.26) / h), 0.004),
        -0.26,
        -0.26 + h,
        50,
        40,
        (x, y, z, nx, ny, nz) =>
          add(
            x + ox,
            y,
            z + oz,
            nx,
            ny,
            nz,
            phi,
            1,
            0,
            3.2 + 0.35 * k + (1.6 * (y + 0.26)) / h,
          ),
      );
      sphere(ox, -0.26 + h + 0.03, oz, 0.065, 26, 16, 0, () => 5.2 + 0.3 * k);
      const gr = br(-0.57) + 0.01;
      sphere(
        gr * Math.cos(phi + TAU / 10),
        -0.57,
        gr * Math.sin(phi + TAU / 10),
        0.075,
        26,
        16,
        0,
        () => 4.4 + 0.25 * k,
      );
    }
  }

  (window.OBJECT_DEFS = window.OBJECT_DEFS || []).push({
    id: "coroa",
    label: "coroa",
    build: buildCoroa,
    floor: -0.9,
  });
})();
