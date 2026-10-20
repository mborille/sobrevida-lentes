// ---------- Núcleo: análise de sobrevida (Kaplan-Meier, IC log-log, log-rank) ----------
var MONTH_DAYS = 30.4375;
function parseDate(s) {
  s = String(s).trim(); var m;
  if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) return mk(+m[1], +m[2], +m[3]);
  if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s))) return mk(+m[3], +m[2], +m[1]);
  return null;
}
function mk(y, mo, d) { var t = Date.UTC(y, mo - 1, d); var D = new Date(t); return (D.getUTCFullYear() === y && D.getUTCMonth() === mo - 1 && D.getUTCDate() === d) ? t : null; }
function parseEvent(s) {
  var v = String(s).trim().toLowerCase();
  if (['1', 'sim', 's', 'y', 'yes', 'falha', 'fracasso', 'evento'].indexOf(v) >= 0) return 1;
  if (['0', 'nao', 'não', 'n', 'no', 'censura', 'censurado', 'ok', ''].indexOf(v) >= 0) return 0;
  return null;
}
// texto: colunas separadas por ; , tab. Colunas: grupo, inicio, fim, falha. Cabeçalho opcional.
// Se 'inicio' e 'fim' forem números, 'fim' é o tempo de seguimento em meses.
function parseData(text, asOfMs) {
  var rows = [], errors = [], lines = String(text).split(/\r?\n/);
  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i].trim(); if (!ln) continue;
    var parts = ln.split(/[;\t]/.test(ln) ? /[;\t]/ : ',').map(function (x) { return x.trim(); });
    if (/^(grupo|group)/i.test(parts[0]) && isNaN(parseFloat(parts[1]))) continue;
    if (parts.length < 4) { errors.push('Linha ' + (i + 1) + ': esperado grupo; início; fim; falha.'); continue; }
    var g = parts[0] || 'Todos', ev = parseEvent(parts[3]);
    if (ev === null) { errors.push('Linha ' + (i + 1) + ': "falha" deve ser 1/0 ou sim/não.'); continue; }
    var t = null;
    var d0 = parseDate(parts[1]), d1 = parts[2] === '' ? asOfMs : parseDate(parts[2]);
    if (d0 !== null && d1 !== null) t = (d1 - d0) / 86400000 / MONTH_DAYS;
    else if (/^\d+([.,]\d+)?$/.test(parts[2]) && (parts[1] === '' || parts[1] === '0')) t = parseFloat(parts[2].replace(',', '.'));
    if (t === null || !isFinite(t)) { errors.push('Linha ' + (i + 1) + ': datas inválidas (use AAAA-MM-DD ou DD/MM/AAAA).'); continue; }
    if (t < 0) { errors.push('Linha ' + (i + 1) + ': fim antes do início.'); continue; }
    rows.push({ g: g, t: t, e: ev });
  }
  return { rows: rows, errors: errors };
}
// Kaplan-Meier com IC log-log (95%)
function km(times, events, z) {
  z = z || 1.959964;
  var n = times.length, idx = []; for (var i = 0; i < n; i++) idx.push(i);
  idx.sort(function (a, b) { return times[a] - times[b]; });
  var steps = [{ t: 0, s: 1, lo: 1, hi: 1, atRisk: n, d: 0, c: 0 }], S = 1, gw = 0, atRisk = n, p = 0;
  while (p < n) {
    var t = times[idx[p]], d = 0, c = 0, q = p;
    while (q < n && times[idx[q]] === t) { if (events[idx[q]]) d++; else c++; q++; }
    if (d > 0) {
      S *= 1 - d / atRisk;
      if (atRisk > d) gw += d / (atRisk * (atRisk - d));
      var lo = S, hi = S;
      if (S > 0 && S < 1 && gw > 0) { var se = Math.sqrt(gw) / Math.abs(Math.log(S)); lo = Math.pow(S, Math.exp(z * se)); hi = Math.pow(S, Math.exp(-z * se)); }
      else if (S === 0) { lo = 0; hi = 0; }
      steps.push({ t: t, s: S, lo: lo, hi: hi, atRisk: atRisk, d: d, c: c });
    } else steps.push({ t: t, s: S, lo: steps[steps.length - 1].lo, hi: steps[steps.length - 1].hi, atRisk: atRisk, d: 0, c: c, cens: true });
    atRisk -= d + c; p = q;
  }
  return steps;
}
function at(steps, t) { var r = steps[0]; for (var i = 0; i < steps.length; i++) { if (steps[i].t <= t) r = steps[i]; else break; } return r; }
function atRiskAt(times, t) { var k = 0; for (var i = 0; i < times.length; i++) if (times[i] >= t) k++; return k; }
function median(steps) { for (var i = 0; i < steps.length; i++) if (steps[i].s <= 0.5 && steps[i].t > 0) return steps[i].t; return null; }
// gama incompleta regularizada para p-valor do qui-quadrado
function gammaln(x) { var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5], y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); var s = 1.000000000190015; for (var j = 0; j < 6; j++) s += c[j] / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
function gammaQ(a, x) {
  if (x <= 0) return 1;
  if (x < a + 1) { var ap = a, sum = 1 / a, del = sum; for (var n = 0; n < 500; n++) { ap++; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; } return 1 - sum * Math.exp(-x + a * Math.log(x) - gammaln(a)); }
  var b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (var i = 1; i < 500; i++) { var an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; var del2 = d * c; h *= del2; if (Math.abs(del2 - 1) < 1e-14) break; }
  return Math.exp(-x + a * Math.log(x) - gammaln(a)) * h;
}
function chi2p(x, df) { return gammaQ(df / 2, x / 2); }
function solve(A, b) {
  var n = b.length, M = A.map(function (r, i) { return r.slice().concat([b[i]]); });
  for (var c = 0; c < n; c++) {
    var piv = c; for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    var tmp = M[c]; M[c] = M[piv]; M[piv] = tmp; if (Math.abs(M[c][c]) < 1e-12) return null;
    for (var r2 = 0; r2 < n; r2++) if (r2 !== c) { var f = M[r2][c] / M[c][c]; for (var k = c; k <= n; k++) M[r2][k] -= f * M[c][k]; }
  }
  return M.map(function (r, i) { return r[n] / r[i]; });
}
// groups: lista de {times, events}
function logrank(groups) {
  var k = groups.length; if (k < 2) return null;
  var all = []; groups.forEach(function (g, gi) { g.times.forEach(function (t, i) { all.push({ t: t, e: g.events[i], g: gi }); }); });
  var ts = {}; all.forEach(function (r) { if (r.e) ts[r.t] = 1; });
  var times = Object.keys(ts).map(Number).sort(function (a, b) { return a - b; });
  var O = new Array(k).fill(0), E = new Array(k).fill(0), V = []; for (var a = 0; a < k; a++) V.push(new Array(k).fill(0));
  times.forEach(function (t) {
    var nj = new Array(k).fill(0), dj = new Array(k).fill(0), n = 0, d = 0;
    all.forEach(function (r) { if (r.t >= t) { nj[r.g]++; n++; } if (r.t === t && r.e) { dj[r.g]++; d++; } });
    for (var j = 0; j < k; j++) { O[j] += dj[j]; E[j] += d * nj[j] / n; }
    if (n > 1) { var f = d * (n - d) / (n - 1); for (var j2 = 0; j2 < k; j2++) for (var l = 0; l < k; l++) V[j2][l] += f * ((j2 === l ? nj[j2] / n : 0) - nj[j2] * nj[l] / (n * n)); }
  });
  var U = [], Vs = []; for (var j3 = 0; j3 < k - 1; j3++) { U.push(O[j3] - E[j3]); Vs.push(V[j3].slice(0, k - 1)); }
  var x = solve(Vs, U); if (!x) return { chi2: null, df: k - 1, p: null, O: O, E: E };
  var chi = 0; for (var q = 0; q < U.length; q++) chi += U[q] * x[q];
  return { chi2: chi, df: k - 1, p: chi2p(chi, k - 1), O: O, E: E };
}
function analyse(rows) {
  var names = [], by = {};
  rows.forEach(function (r) { if (!by[r.g]) { by[r.g] = { name: r.g, times: [], events: [] }; names.push(r.g); } by[r.g].times.push(r.t); by[r.g].events.push(r.e); });
  var groups = names.map(function (n) {
    var g = by[n]; g.steps = km(g.times, g.events); g.n = g.times.length; g.fail = g.events.reduce(function (a, b) { return a + b; }, 0);
    g.median = median(g.steps); g.maxT = Math.max.apply(null, g.times); g.medFollow = medFollow(g);
    return g;
  });
  return { groups: groups, lr: groups.length > 1 ? logrank(groups) : null };
}
// mediana do seguimento pelo método de Kaplan-Meier reverso (censura vira evento)
function medFollow(g) { var rev = km(g.times, g.events.map(function (e) { return e ? 0 : 1; })); return median(rev); }
function fmtP(p) { if (p === null || p === undefined) return 'n/d'; return p < 0.001 ? '< 0,001' : p.toFixed(3).replace('.', ','); }
