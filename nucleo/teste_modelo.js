var fs = require('fs'); eval(fs.readFileSync('modelo.js', 'utf8') + ';global.X={parseData,km,at,median,logrank,chi2p,analyse,parseDate};');
var Q = global.X, ok = true;
function chk(n, c, d) { console.log((c ? 'OK  ' : 'FAIL') + ' ' + n + (d ? ' ' + d : '')); if (!c) ok = false; }
function near(a, b, e) { return Math.abs(a - b) <= e; }
// Freireich (6-MP): tempos em semanas, 1 = recaída
var mp = [[6,1],[6,1],[6,1],[6,0],[7,1],[9,0],[10,1],[10,0],[11,0],[13,1],[16,1],[17,0],[19,0],[20,0],[22,1],[23,1],[25,0],[32,0],[32,0],[34,0],[35,0]];
var pl = [1,1,2,2,3,4,4,5,5,8,8,8,8,11,11,12,12,15,17,22,23];
var t1 = mp.map(function (r) { return r[0]; }), e1 = mp.map(function (r) { return r[1]; });
var s = Q.km(t1, e1);
chk('KM em 6 = 0,857', near(Q.at(s, 6).s, 0.857, 0.001), Q.at(s, 6).s.toFixed(4));
chk('KM em 7 = 0,807', near(Q.at(s, 7).s, 0.807, 0.001));
chk('KM em 10 = 0,753', near(Q.at(s, 10).s, 0.753, 0.001));
chk('KM em 13 = 0,690', near(Q.at(s, 13).s, 0.690, 0.001));
chk('KM em 23 = 0,448', near(Q.at(s, 23).s, 0.448, 0.001));
chk('mediana 6-MP = 23', Q.median(s) === 23);
var ci = Q.at(s, 23); chk('IC contém a estimativa e fica em [0,1]', ci.lo < ci.s && ci.s < ci.hi && ci.lo >= 0 && ci.hi <= 1, ci.lo.toFixed(3) + ' a ' + ci.hi.toFixed(3));
var lr = Q.logrank([{ times: t1, events: e1 }, { times: pl, events: pl.map(function () { return 1; }) }]);
chk('log-rank qui-quadrado ≈ 16,8 (6-MP x placebo)', near(lr.chi2, 16.79, 0.1), lr.chi2.toFixed(3));
chk('log-rank p ≈ 4e-5', lr.p < 1e-4 && lr.p > 1e-5, lr.p);
chk('chi2p(3,84; 1) ≈ 0,05', near(Q.chi2p(3.841, 1), 0.05, 0.001));
chk('chi2p(5,991; 2) ≈ 0,05', near(Q.chi2p(5.991, 2), 0.05, 0.001));
chk('três grupos iguais dão p alto', Q.logrank([{ times: [1,2,3,4,5], events: [1,1,1,1,0] }, { times: [1,2,3,4,5], events: [1,1,1,1,0] }, { times: [1,2,3,4,5], events: [1,1,1,1,0] }]).p > 0.9);
var d = Q.parseData('grupo;inicio;fim;falha\nA;2020-01-15;2022-01-15;0\nA;15/03/2020;15/09/2021;1\nB;2020-05-01;;0', Date.UTC(2023, 0, 1));
chk('parse: 3 linhas válidas, 24 meses', d.rows.length === 3 && near(d.rows[0].t, 24, 0.1), JSON.stringify(d.rows.map(function (r) { return r.t.toFixed(1); })));
chk('parse: fim vazio usa data da análise', near(d.rows[2].t, 32.1, 0.2), d.rows[2].t.toFixed(1));
var bad = Q.parseData('A;2020-02-30;2021-01-01;0\nA;2021-01-01;2020-01-01;1\nA;x;y;talvez', Date.UTC(2023, 0, 1));
chk('parse: 3 erros reportados e nenhuma linha', bad.errors.length === 3 && bad.rows.length === 0, bad.errors.join(' | '));
var m = Q.parseData('A;0;12;1\nA;0;18,5;0', 0);
chk('parse: tempo direto em meses', m.rows.length === 2 && m.rows[1].t === 18.5);
var a = Q.analyse(d.rows); chk('analyse: 2 grupos', a.groups.length === 2 && a.lr !== null);
process.exit(ok ? 0 : 1);
