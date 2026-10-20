"""Print isometric diorama <symbol> markup (viewBox 0 0 52 90, tile centre 26,77). Pasted by hand into artboards."""
C = (26, 77)


def f(v):
    return f"{v:g}" if v == int(v) else f"{v:.1f}"


def pts(*p):
    return " ".join(f"{f(x)},{f(y)}" for x, y in p)


def box(cx, cy, a, h, l="dinding", r="dinding2", t="atap", lift=0):
    """iso box footprint half-width a (depth a/2), height h, bottom raised by lift."""
    cy -= lift
    L, B, R, T = (cx - a, cy), (cx, cy + a / 2), (cx + a, cy), (cx, cy - a / 2)
    up = lambda p: (p[0], p[1] - h)
    return (f'<polygon class="{l}" points="{pts(L, B, up(B), up(L))}"/>'
            f'<polygon class="{r}" points="{pts(B, R, up(R), up(B))}"/>'
            f'<polygon class="{t}" points="{pts(up(L), up(T), up(R), up(B))}"/>')


def win(cx, cy, a, h, rows, cls="kaca"):
    """window dots on both visible faces."""
    out = []
    for i in range(rows):
        y = cy - h * (i + 0.6) / (rows + 0.2)
        for k in (0.35, 0.7):
            out.append(f'<rect class="{cls}" x="{f(cx - a * k - 1.5)}" y="{f(y + a * k / 2 - 2)}" width="3" height="3"/>')
            out.append(f'<rect class="{cls}" x="{f(cx + a * k - 1.5)}" y="{f(y + a * k / 2 - 2)}" width="3" height="3"/>')
    return "".join(out)


shadow = '<ellipse class="bayang" cx="26" cy="79" rx="15" ry="6"/>'
cx, cy = C
S = {}
S["sawit"] = shadow + ('<path class="batang" d="M24.5 79 L25.3 50 L26.9 50 L27.7 79 Z"/>'
                       '<path class="daun2" d="M26 50 Q18 36 9 37 Q19 42 25 52 Z"/><path class="daun2" d="M26 50 Q34 36 43 37 Q33 42 27 52 Z"/>'
                       '<path class="daun" d="M26 51 Q15 43 5 52 Q16 47 26 54 Z"/><path class="daun" d="M26 51 Q37 43 47 52 Q36 47 26 54 Z"/>'
                       '<path class="daun" d="M26 51 Q27 38 23 31 Q31 40 28 51 Z"/>'
                       '<circle class="aksen" cx="24.5" cy="54" r="2.2"/><circle class="aksen" cx="28" cy="54.5" r="2.2"/>')
S["tambang"] = ('<path class="tanah2" d="M4 80 Q10 64 20 69 Q27 59 37 68 Q45 72 48 80 Z"/>'
                '<path class="tanah" d="M10 80 Q15 70 22 73 Q28 66 35 72 Q41 75 42 80 Z"/>'
                + box(30, 84, 8, 9, "logam", "logam2", "aksen") + box(20, 79, 6, 7, "aksen2", "aksen", "kaca")
                + '<ellipse class="roda" cx="24" cy="85" rx="2.6" ry="3"/><ellipse class="roda" cx="33" cy="88" rx="2.6" ry="3"/>')
S["pabrik"] = (shadow + box(cx, cy, 16, 16)
               + '<polygon class="atap2" points="10,61 14,55 18,61 22,57 26,63 26,61"/>'
               + box(34, 70, 3.2, 30, "putih", "logam2", "logam") + '<rect class="aksen" x="30.8" y="49" width="6.4" height="3"/>'
               + win(cx, cy, 16, 16, 1))
S["listrik"] = (shadow + '<path class="garis" d="M18 80 L24 42 L28 42 L34 80 M20 68 L32 68 M22 56 L30 56 M14 50 L38 50 M16 44 L36 44 M21 80 L30 56 M31 80 L22 56"/>'
                '<circle class="aksen" cx="14" cy="51" r="1.5"/><circle class="aksen" cx="38" cy="51" r="1.5"/>')
S["air"] = (shadow + '<path class="garis" d="M18 80 L20 58 M34 80 L32 58 M26 83 L26 60"/>'
            '<ellipse class="air2" cx="26" cy="58" rx="11" ry="5"/><rect class="air2" x="15" y="44" width="22" height="14"/>'
            '<ellipse class="air" cx="26" cy="44" rx="11" ry="5"/><rect class="putih" x="17" y="49" width="2" height="7"/>')
S["crane"] = (shadow + box(30, 79, 10, 10, "dinding", "dinding2", "tanah")
              + '<path class="garis2" d="M14 80 L14 24 M17 80 L17 24 M14 30 L44 24 M14 24 L8 26 M40 25 L40 40"/>'
              '<rect class="aksen" x="12" y="20" width="7" height="6"/><rect class="aksen" x="37.5" y="40" width="5" height="4"/>')
S["toko"] = (shadow + box(cx, cy, 15, 14)
             + '<polygon class="aksen" points="11,63 26,70.5 26,74 9,66"/><polygon class="putih" points="15,65 19,67 18.6,70.3 14,68"/>'
             '<polygon class="aksen2" points="26,70.5 41,63 43,66 26,74"/><polygon class="putih" points="33,67 37,65 38.5,68.2 34,70.3"/>'
             '<rect class="kaca" x="15" y="72" width="7" height="6"/><rect class="kaca" x="30" y="72" width="7" height="6"/>')
S["kontainer"] = (shadow + box(22, 80, 10, 9, "aksen", "aksen2", "atap") + box(31, 76, 10, 9, "air", "air2", "atap")
                  + box(26, 70, 10, 9, "daun", "daun2", "atap", lift=9))
S["hotel"] = (shadow + box(24, 79, 13, 30) + win(24, 79, 13, 30, 3)
              + '<path class="garis2" d="M42 82 L42 66"/><path class="aksen" d="M33 67 Q42 57 51 67 Z"/><path class="putih" d="M38.5 67 Q42 59 45.5 67 Z"/>')
S["menara"] = (shadow + '<path class="garis2" d="M20 80 L25 30 L27 30 L32 80 M22 66 L30 66 M23 52 L29 52 M21 74 L29 58 M31 74 L23 58"/>'
               '<rect class="aksen" x="23.5" y="38" width="5" height="6"/><rect class="putih" x="23.5" y="44" width="5" height="6"/>'
               '<path class="garis" d="M33 30 Q37 35 33 40 M36 27 Q42 35 36 43 M19 30 Q15 35 19 40"/>')
S["bank"] = (shadow + box(cx, 80, 16, 3, "putih", "logam", "putih") + box(cx, 77, 14, 16, "dinding", "dinding2", "putih")
             + "".join(f'<rect class="putih" x="{x}" y="{y}" width="2.5" height="13"/>' for x, y in ((14, 63), (19, 65.5), (29, 65.5), (34, 63)))
             + '<polygon class="atap" points="10,61 26,53 26,69"/><polygon class="atap2" points="26,53 42,61 26,69"/><circle class="aksen2" cx="26" cy="61" r="2"/>')
S["rumah"] = (shadow + box(cx, cy, 13, 11)
              + '<polygon class="atap" points="11,64 20,56 33,62.5 26,70"/><polygon class="atap2" points="26,70 33,62.5 41,66 39,66"/>'
              '<polygon class="dinding2" points="26,70 33,62.5 39,66 39,70"/><rect class="kaca" x="17" y="71" width="4" height="5"/><rect class="aksen" x="31" y="72" width="4" height="7"/>')
S["kantor"] = shadow + box(cx, cy, 11, 44, "kaca", "kaca2", "putih") + "".join(
    f'<path class="garis3" d="M15 {y} L26 {y + 5.5} L37 {y}"/>' for y in range(40, 80, 7))
S["pemda"] = (shadow + box(cx, cy, 16, 13, "putih", "dinding2", "atap")
              + '<rect class="dinding" x="22" y="50" width="8" height="10"/><path class="aksen2" d="M20 51 Q26 37 32 51 Z"/>'
              '<path class="garis2" d="M26 44 L26 31"/><rect class="aksen" x="26" y="31" width="8" height="3"/><rect class="putih" x="26" y="34" width="8" height="3"/>'
              + "".join(f'<rect class="kaca" x="{x}" y="{y}" width="2" height="7"/>' for x, y in ((14, 66), (19, 68.5), (31, 68.5), (36, 66))))
S["sekolah"] = (shadow + box(24, 78, 14, 14) + win(24, 78, 14, 14, 1)
                + '<polygon class="atap" points="9,64 24,57 24,71"/><polygon class="atap2" points="24,57 39,64 24,71"/>'
                '<path class="garis2" d="M44 82 L44 52"/><rect class="aksen" x="44" y="52" width="7" height="3"/><rect class="putih" x="44" y="55" width="7" height="3"/>')
S["rs"] = (shadow + box(cx, cy, 15, 20, "putih", "logam", "putih")
           + '<path class="aksen" d="M24 46 h4 v3 h3 v4 h-3 v3 h-4 v-3 h-3 v-4 h3 Z"/>'
           '<path class="aksen" d="M30.5 72 h3 v2.5 h2.5 v3 h-2.5 v2.5 h-3 v-2.5 h-2.5 v-3 h2.5 Z"/>' + win(cx, cy, 15, 20, 1, "kaca"))
S["taman"] = ('<ellipse class="bayang" cx="22" cy="80" rx="13" ry="5"/><path class="batang" d="M21 80 L21.5 62 L23 62 L23.5 80 Z"/>'
              '<circle class="daun2" cx="22" cy="56" r="10"/><circle class="daun" cx="20" cy="53" r="7"/>'
              '<path class="garis2" d="M33 83 L33 78 M42 79 L42 74 M31 78 L44 73"/><circle class="aksen" cx="12" cy="76" r="1.6"/><circle class="aksen2" cx="35" cy="70" r="1.6"/>')

for k, v in S.items():
    print(f'<symbol id="ik-{k}" viewBox="0 0 52 90">{v}</symbol>')
