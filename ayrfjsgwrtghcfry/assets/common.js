/* AlphaMx dashboard — shared renderers (percentage-only; safe for share view). */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = (v, d = 1) => (v == null || isNaN(v) ? "—" : (+v).toFixed(d) + "%");
  const spct = (v, d = 1) => (v > 0 ? "+" : "") + pct(v, d);
  const modeBadge = (m, extra = "") => {
    const cls = m === "live" ? "live" : (m === "mixed" ? "mixed" : "paper");
    const lab = m === "live" ? "实盘" : (m === "mixed" ? "分户" : "纸面");
    return `<span class="badge ${cls}">${lab}${extra}</span>`;
  };
  const stBadge = (s, txt) => `<span class="badge ${s}">${txt || ({ green: "安全", amber: "近线", red: "超限" }[s] || s)}</span>`;
  const BUCKET_COLORS = {};
  const themeShort = id => "主题 " + id;
  const isPlaceholder = d => (d.performance && d.performance.kind === "placeholder_flat_cash");

  function banners(d, view) {
    const m = d.mode_label, live = d.mode === "live", mixed = d.mode === "mixed";
    const aBook = d.books.find(b => b.market === "A股");
    const uBook = d.books.find(b => b.market === "美股");
    const disc = live ? "实盘数据" : (mixed ? "分户口径（按户标注纸面/实盘）" : "纸面口径");
    const mixNote = mixed
      ? `<span>按户标注 · <b>现金分户不混算</b></span>`
      : `<span>分户现金独立，<b>不混算</b></span>`;
    return `
    <div class="disclaimer">⚠ ${esc(d.meta.disclaimer)}<span class="sep">|</span>${disc}</div>
    <div class="modebar">
      <span>口径：<b>${m}</b> ${modeBadge(d.mode)}</span>
      <span>A股市场 ${modeBadge(aBook?.mode)} · 美股市场 ${modeBadge(uBook?.mode)}</span>
      ${mixNote}
      ${view === "share" ? `<span class="viewtag share">分享版 · 仅百分比</span>` : `<span class="viewtag private">私有版 · 含金额 · 勿外传</span>`}
    </div>`;
  }

  function header(d, subtitle) {
    const note = d.meta.status_note ? `<div class="status-note">${esc(d.meta.status_note)}</div>` : "";
    const title = d.meta.title || "AlphaMx 科技创新组合";
    const en = d.meta.title_en || "AlphaMx Science & Technology Innovation Portfolio";
    const viewBit = subtitle ? `<small class="view-sub">${esc(subtitle)}</small>` : "";
    return `<header class="top">
      <div><div class="brand">ALPHAMX</div>
        <h1>${esc(title)}${viewBit}</h1>
        <div class="title-en">${esc(en)}</div>
        ${note}</div>
      <div class="asof">估值日 <b class="num">${esc(d.meta.as_of)}</b> · Asia/Shanghai<br>${modeBadge(d.mode)}${(() => {
        const hasPos = (d.books || []).some(b => (b.positions && b.positions.length) || (b.current && b.current.length));
        return hasPos ? " 分户持仓已按台账盯市" : " 当前 100% 现金 → 目标权重为建仓意向";
      })()}</div>
    </header>`;
  }

  function secH(idx, title, mode, hint, kind) {
    const tag = kind === "nav" ? `<span class="sectag nav">净值</span>`
              : kind === "markets" ? `<span class="sectag markets">分户市场</span>`
              : kind === "themes" ? `<span class="sectag themes">主题穿透</span>`
              : kind === "perf" ? `<span class="sectag perf">历史表现</span>`
              : kind === "bench" ? `<span class="sectag bench">基准对比</span>`
              : "";
    return `<div class="sec-h">${tag}<span class="idx">${idx}</span><h2>${title}</h2>${mode ? modeBadge(mode) : ""}${hint ? `<span class="hint">${hint}</span>` : ""}</div>`;
  }

  function bucketsHTML(d) {
    const rows = d.buckets.map(b => {
      const scale = Math.max(b.hard_pct * 1.25, b.target_pct, b.current_pct);
      const pos = v => Math.min(100, v / scale * 100).toFixed(2) + "%";
      BUCKET_COLORS[b.id] = b.color;
      const displayName = b.name.startsWith("主题") ? b.name : `${themeShort(b.id)} · ${b.name}`;
      return `<div class="bucket">
        <div class="bh" style="margin-bottom:14px"><span class="bn"><span class="dot" style="background:${b.color}"></span>${esc(displayName)}</span>
          <span class="bm">${esc(b.members)}</span>
          <span class="bv">当前 <b>${pct(b.current_pct)}</b> · 目标 <b>${pct(b.target_pct)}</b></span></div>
        <div class="gauge">
          <div class="tgt" style="width:${pos(b.target_pct)};background:${b.color}"></div>
          <div class="cur" style="width:${pos(b.current_pct)};background:${b.color}"></div>
          <div class="mk noadd" style="left:${pos(b.no_add_pct)}"><span>${b.no_add_pct}</span></div>
          <div class="mk hard" style="left:${pos(b.hard_pct)}"><span>${b.hard_pct}</span></div>
        </div>
        <div class="bd" style="margin-top:20px"><span class="num" style="color:var(--dim)">刻度 0–${scale.toFixed(1)}%</span><span>不再加仓线 ${pct(b.no_add_pct)} · 硬顶 ${pct(b.hard_pct)}</span>
          <span>目标距不再加仓 <b class="num">${spct(b.target_to_no_add, 2)}</b></span>
          <span>目标距硬顶 <b class="num">${spct(b.target_to_hard, 2)}</b></span> ${stBadge(b.status, b.status === "amber" ? "目标贴近不再加仓线" : undefined)}</div>
      </div>`;
    }).join("");
    return `${rows}
      <div class="legend" style="margin-top:8px"><span><i style="background:#8b97ad"></i>实心细条 = 当前（尚无成交时为 0%）</span><span><i style="background:#8b97ad;opacity:.35"></i>半透明 = 目标</span>
      <span><i style="background:var(--amber)"></i>不再加仓线</span><span><i style="background:var(--red)"></i>硬顶</span></div>
      <div class="note">主题外（现金等）：当前 <b class="num">${pct(d.outside_buckets_current_pct)}</b> · 目标 <b class="num">${pct(d.outside_buckets_target_pct)}</b>。同主题中美只计一主题；超限在敞口所在市场削减，<b>不假设跨境移资</b>。主题 ≠ 分户市场。</div>`;
  }

  function bucketChart(canvas, d) {
    const labels = d.buckets.map(b => themeShort(b.id));
    return new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "当前", data: d.buckets.map(b => b.current_pct), backgroundColor: d.buckets.map(b => b.color), borderRadius: 4, order: 3 },
          { label: "目标", data: d.buckets.map(b => b.target_pct), backgroundColor: d.buckets.map(b => b.color + "66"), borderColor: d.buckets.map(b => b.color), borderWidth: 1, borderRadius: 4, order: 3 },
          { label: "不再加仓线", type: "line", data: d.buckets.map(b => b.no_add_pct), showLine: false, pointStyle: "line", pointRadius: 16, pointBorderWidth: 3, borderColor: "#f5a524", backgroundColor: "#f5a524", order: 1 },
          { label: "硬顶", type: "line", data: d.buckets.map(b => b.hard_pct), showLine: false, pointStyle: "line", pointRadius: 16, pointBorderWidth: 3, borderColor: "#ff5d6c", backgroundColor: "#ff5d6c", order: 0 },
        ],
      },
      options: chartOpts({ y: { ticks: { callback: v => v + "%" } } }, ctx => `${ctx.dataset.label}: ${(+ctx.raw).toFixed(2)}%`),
    });
  }

  function allocChart(canvas, d) {
    const parts = d.buckets.map(b => ({ l: b.name.startsWith("主题") ? b.name : themeShort(b.id) + " " + b.name, v: b.target_pct, c: b.color }));
    d.books.forEach(b => parts.push({ l: (b.label || b.market) + " 现金", v: +(b.target_cash_pct * b.share_of_unified_pct / 100).toFixed(2), c: b.market === "A股" ? "#4b5875" : "#33405a" }));
    return new Chart(canvas, {
      type: "doughnut",
      data: { labels: parts.map(p => p.l), datasets: [{ data: parts.map(p => p.v), backgroundColor: parts.map(p => p.c), borderColor: "#141b2a", borderWidth: 2 }] },
      options: { maintainAspectRatio: false, cutout: "62%", plugins: { legend: { position: "right", labels: { color: "#b8c3d8", boxWidth: 10, font: { size: 11 } } }, tooltip: { callbacks: { label: c => `${c.label}: ${(+c.raw).toFixed(2)}%` } } } },
    });
  }

  function chartOpts(scales = {}, label) {
    const grid = { color: "#1e2940" }, ticks = { color: "#8b97ad", font: { size: 11 } };
    return {
      maintainAspectRatio: false, responsive: true,
      plugins: { legend: { labels: { color: "#b8c3d8", boxWidth: 12, font: { size: 11 } } }, tooltip: label ? { callbacks: { label } } : {} },
      scales: { x: { grid, ticks }, y: Object.assign({ grid, ticks: Object.assign({}, ticks), beginAtZero: true }, scales.y || {}, { ticks: Object.assign({}, ticks, (scales.y || {}).ticks) }) },
    };
  }

  function limitsHTML(d) {
    const rows = d.limits.map(l => {
      const u = l.unit === "%" ? "%" : "";
      const f = v => (v == null ? "—" : l.unit === "%" ? (+v).toFixed(2) + "%" : v);
      const dirTxt = l.dir === "max" ? "≤" : "≥";
      return `<tr><td class="l">${esc(l.name)}${l.note ? `<div class="mini" style="margin:0">${esc(l.note)}</div>` : ""}</td>
        <td class="num">${f(l.current)}</td><td class="num">${f(l.target)}</td>
        <td class="num">${dirTxt} ${l.hard}${u}</td><td class="num">${l.no_add == null ? "—" : l.no_add + u}</td>
        <td class="num">${l.unit === "%" ? spct(l.dist_target, 2) : l.dist_target}</td><td>${stBadge(l.status)}</td></tr>`;
    }).join("");
    return `<div class="tbl-wrap"><table><thead><tr><th>限额（占统一净值，除注明）</th><th>当前</th><th>目标</th><th>硬线</th><th>不再加仓</th><th>目标余量</th><th>状态</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function ladderHTML(d) {
    const r = d.returns;
    return `<div class="ladder">${r.ladder.map(l => `<div class="rung ${l.triggered ? "hit" : "ok"}">
      <div class="lv">${l.level_pct}%</div><div>${l.triggered ? stBadge("red", "已触发") : stBadge("green", "未触发")}</div>
      <div class="ac">${esc(l.action)}</div></div>`).join("")}</div>`;
  }

  function perfBanner(d) {
    const p = d.performance || {};
    if (!p.label && !isPlaceholder(d)) return "";
    const lab = p.label || "正式账户 · 尚无成交写入";
    const meth = p.methodology || "两户均为正式持仓口径，尚无成交写入；净值按 100% 现金盯市。本段为占位曲线，非历史实绩。";
    return `<div class="perf-banner"><span class="perf-label">${esc(lab)}</span><span class="perf-meth">${esc(meth)}</span></div>`;
  }

  function returnsKPIs(d) {
    const r = d.returns;
    const cls = v => (v > 0 ? "pos" : v < 0 ? "neg" : "");
    return `<div class="grid g4">
      <div class="card kpi"><div class="lab">成立以来累计收益 ${modeBadge(d.mode)}</div><div class="val ${cls(r.since_inception_pct)}">${spct(r.since_inception_pct, 2)}</div><div class="foot">起点 ${esc(r.inception)} · 统一本金口径</div></div>
      <div class="card kpi"><div class="lab">当前回撤（相对高水位）</div><div class="val ${cls(r.current_dd_pct)}">${pct(r.current_dd_pct, 2)}</div><div class="foot">人民币统一净值高点 · 日收盘</div></div>
      <div class="card kpi"><div class="lab">最大回撤</div><div class="val ${cls(r.max_dd_pct)}">${pct(r.max_dd_pct, 2)}</div><div class="foot">自起点 · Max DD</div></div>
      <div class="card kpi"><div class="lab">回撤阶梯状态</div><div class="val">${stBadge(r.ladder_state, { green: "● 绿灯", amber: "● 黄灯", red: "● 红灯" }[r.ladder_state])}</div><div class="foot">距首档 −8% 尚余 ${(8 + r.current_dd_pct).toFixed(2)}pp</div></div>
    </div>`;
  }

  function returnsChart(canvas, d) {
    const s = d.returns.series;
    const one = s.length <= 1;
    const flat = isPlaceholder(d) || s.every(x => Math.abs(x.index - 100) < 1e-6);
    return new Chart(canvas, {
      type: "line",
      data: {
        labels: s.map(x => x.date),
        datasets: [
          { label: "相对净值指数（起点=100）", data: s.map(x => x.index), borderColor: "#f5a524", backgroundColor: "#f5a52433", pointRadius: one || flat ? 4 : 2, tension: .25, fill: true, yAxisID: "y" },
          { label: "回撤 %", data: s.map(x => x.dd_pct), borderColor: "#ff5d6c", backgroundColor: "#ff5d6c22", pointRadius: one ? 4 : 0, fill: true, yAxisID: "y1" },
        ],
      },
      options: (() => {
        const o = chartOpts({}, c => c.dataset.yAxisID === "y1" ? `回撤: ${(+c.raw).toFixed(2)}%` : `指数: ${(+c.raw).toFixed(2)}`);
        o.scales.y = { position: "left", min: flat ? 95 : undefined, max: flat ? 105 : undefined, grid: { color: "#1e2940" }, ticks: { color: "#8b97ad" } };
        o.scales.y1 = { position: "right", min: -30, max: 0, grid: { drawOnChartArea: false }, ticks: { color: "#ff8291", callback: v => v + "%" } };
        return o;
      })(),
      plugins: [{
        id: "ddlines", afterDraw(ch) {
          const y1 = ch.scales.y1, { left, right } = ch.chartArea, ctx = ch.ctx;
          ctx.save(); ctx.setLineDash([4, 4]); ctx.lineWidth = 1; ctx.font = "10px ui-monospace,monospace";
          d.returns.ladder.forEach(l => { const y = y1.getPixelForValue(l.level_pct); ctx.strokeStyle = "#ff5d6c88"; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); ctx.fillStyle = "#ff8291"; ctx.fillText(l.level_pct + "%", left + 4, y - 3); });
          ctx.restore();
        },
      }],
    });
  }

  function cumRetChart(canvas, d) {
    const s = d.returns.series;
    const flat = isPlaceholder(d) || s.every(x => Math.abs((x.cum_ret_pct ?? x.index - 100)) < 1e-6);
    return new Chart(canvas, {
      type: "line",
      data: {
        labels: s.map(x => x.date),
        datasets: [
          { label: "累计收益 %", data: s.map(x => x.cum_ret_pct ?? round3(x.index - 100)), borderColor: "#2ed3a1", backgroundColor: "#2ed3a133", pointRadius: flat ? 4 : 2, tension: .25, fill: true },
        ],
      },
      options: (() => {
        const o = chartOpts({ y: { ticks: { callback: v => v + "%" } } }, c => `累计收益: ${(+c.raw).toFixed(2)}%`);
        if (flat) { o.scales.y.min = -2; o.scales.y.max = 2; }
        return o;
      })(),
    });
  }

  function round3(x) { return Math.round(x * 1000) / 1000; }

  function weightsTablePct(b) {
    const rows = b.targets.map(t => `<tr><td><span class="dot" style="background:${BUCKET_COLORS[t.bucket] || "#888"}"></span>${esc(t.name)}<span class="code">${esc(t.code)}</span>${t.note ? ` <span class="badge grey">${esc(t.note)}</span>` : ""}</td>
      <td>${themeShort(t.bucket)}</td><td class="num">${pct(((b.current || []).find(c => c.code === t.code) || { w_book: 0 }).w_book, 1)}</td><td class="num">${pct(t.weight_pct, 1)}</td><td class="num">${pct(t.w_unified, 2)}</td></tr>`).join("");
    return `<div class="tbl-wrap"><table><thead><tr><th>标的</th><th>主题</th><th>当前</th><th>目标<br>占本市场</th><th>目标<br>占统一</th></tr></thead><tbody>${rows}
      <tr class="cash"><td>现金${b.cash_equivalents_pct > 0 ? `（含现金等价 ${pct(b.cash_equivalents_pct, 1)}）` : ""}</td><td>—</td><td class="num">${pct(b.cash_pct, 1)}</td><td class="num">${pct(b.target_cash_pct, 1)}</td><td class="num">${pct(b.target_cash_pct * b.share_of_unified_pct / 100, 2)}</td></tr>
      <tr class="total"><td>权益合计</td><td></td><td class="num">${pct(b.equity_pct, 1)}</td><td class="num">${pct(b.target_equity_pct, 1)}</td><td class="num">${pct(b.target_equity_pct * b.share_of_unified_pct / 100, 2)}</td></tr></tbody></table></div>`;
  }


  function sparklineSVG(values, {w = 120, h = 28, stroke = "#f5a524", fill = "#f5a52422"} = {}) {
    const nums = (values || []).map(Number).filter(v => !isNaN(v));
    if (nums.length < 2) return `<svg class="spark" width="${w}" height="${h}" aria-hidden="true"></svg>`;
    const min = Math.min(...nums), max = Math.max(...nums);
    const span = max - min || 1;
    const pad = 2;
    const pts = nums.map((v, i) => {
      const x = pad + i * (w - pad * 2) / (nums.length - 1);
      const y = h - pad - (v - min) / span * (h - pad * 2);
      return [x, y];
    });
    const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`;
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${area}" fill="${fill}"/><path d="${line}" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }

  function fmtIndex(v, d = 2) {
    return v == null || isNaN(v) ? "—" : (+v).toFixed(d);
  }

  /** Share-safe NAV KPI strip: index / day % / inception % / drawdown — no amounts. */
  function navStripShare(d) {
    const u = d.unified || {}, r = d.returns || {};
    const idx = u.nav_index ?? r.nav_index ?? (r.series && r.series.length ? r.series[r.series.length - 1].index : null);
    const day = u.day_change_pct ?? r.day_change_pct;
    const since = r.since_inception_pct;
    const dd = u.dd_pct ?? r.current_dd_pct;
    const cls = v => (v > 0 ? "pos" : v < 0 ? "neg" : "");
    const spark = sparklineSVG((r.series || []).map(s => s.index), { w: 140, h: 32 });
    const bookBits = (d.books || []).map(b => {
      const vp = b.vs_capital_pct;
      return `<span><i style="background:${b.market === "A股" ? "#f5a524" : "#3ea6ff"}"></i>${esc(b.label)} 较本金 <b class="num ${cls(vp)}">${spct(vp, 2)}</b></span>`;
    }).join("");
    return `<div class="nav-strip">
      <div class="card kpi nav-hero">
        <div class="lab">净值指数（起点=100）${modeBadge(d.mode)}</div>
        <div class="val big">${fmtIndex(idx)}</div>
        <div class="foot">估值日 ${esc(d.meta.as_of)} · 累计 ${spct(since, 2)}</div>
        <div class="spark-wrap">${spark}</div>
      </div>
      <div class="card kpi"><div class="lab">日涨跌</div><div class="val ${cls(day)}">${day == null ? "—" : spct(day, 2)}</div><div class="foot">相对上一估值日</div></div>
      <div class="card kpi"><div class="lab">成立以来</div><div class="val ${cls(since)}">${spct(since, 2)}</div><div class="foot">起点 ${esc(r.inception || "—")}</div></div>
      <div class="card kpi"><div class="lab">当前回撤</div><div class="val ${cls(dd)}">${pct(dd, 2)}</div><div class="foot">${stBadge(r.ladder_state, "阶梯" + ({ green: "绿灯", amber: "黄灯", red: "红灯" }[r.ladder_state] || ""))}</div></div>
    </div>
    <div class="legend" style="margin-top:10px">${bookBits}<span>分享版仅展示指数与百分比，不含金额</span></div>`;
  }


  const BENCH_COLORS = {
    portfolio: "#f5a524",
    BLEND_A_US: "#2ed3a1",
    CSI300: "#ff8291",
    CHINEXT: "#b48cff",
    SPX: "#3ea6ff",
    NDX: "#7aa2ff",
    A_book: "#e8b84a",
    US_book: "#5bb0ff",
  };

  function fmtNum(v, d = 2) {
    return v == null || isNaN(v) ? "—" : (+v).toFixed(d);
  }
  function fmtSigned(v, d = 2, suffix = "") {
    if (v == null || isNaN(v)) return "—";
    const s = (+v).toFixed(d) + suffix;
    return (+v > 0 ? "+" : "") + s;
  }
  function sampleBadge(m) {
    if (!m) return "";
    if (m.sample_insufficient || m.sample_note === "样本不足")
      return `<span class="badge amber">样本不足</span>`;
    return `<span class="badge green">样本可年化</span>`;
  }

  function metricsCard(m, title, minAnn) {
    if (!m) return "";
    const need = minAnn || 20;
    const insuff = m.sample_insufficient;
    const cell = (lab, val, foot) => `<div class="card kpi metric-cell"><div class="lab">${lab}</div><div class="val">${val}</div>${foot ? `<div class="foot">${foot}</div>` : ""}</div>`;
    const ann = insuff
      ? cell("年化收益", `<span class="muted">样本不足</span>`, `N=${m.n_returns} 日收益 · 需 ≥${need}`)
      : cell("年化收益", fmtSigned(m.ann_return_pct, 2, "%"), `N=${m.n_returns} · 交易日年化`);
    const vol = insuff
      ? cell("年化波动", `<span class="muted">样本不足</span>`, m.period_vol_pct != null ? `期内日波动 ${fmtNum(m.period_vol_pct, 3)}%` : "")
      : cell("年化波动", pct(m.ann_vol_pct, 2), "Std × √252");
    const sh = insuff
      ? cell("夏普比率", `<span class="muted">样本不足</span>`, esc(m.rf_note || "rf = 0"))
      : cell("夏普比率", fmtNum(m.sharpe, 2), esc(m.rf_note || "rf = 0"));
    const cal = insuff
      ? cell("卡玛比率", `<span class="muted">样本不足</span>`, "年化 / |最大回撤|")
      : cell("卡玛比率", fmtNum(m.calmar, 2), "年化 / |最大回撤|");
    return `<div class="metrics-block">
      <div class="metrics-h"><h3>${esc(title || m.label)}</h3>${sampleBadge(m)}<span class="hint">累计 ${fmtSigned(m.total_return_pct, 2, "%")} · 最大回撤 ${pct(m.max_dd_pct, 2)} · 胜率 ${m.win_rate_pct == null ? "—" : pct(m.win_rate_pct, 0)}</span></div>
      <div class="grid g4">${ann}${vol}${sh}${cal}</div>
    </div>`;
  }

  function relativeTable(b) {
    const rows = (b.relative || []).map(r => {
      const insuff = r.sample_note === "样本不足" || r.tracking_error_ann_pct == null;
      return `<tr>
        <td class="l">${esc(r.benchmark_label)}</td>
        <td class="num">${fmtSigned(r.excess_total_pct, 2, "%")}</td>
        <td class="num">${insuff ? '<span class="muted">样本不足</span>' : pct(r.tracking_error_ann_pct, 2)}</td>
        <td class="num">${r.up_capture == null ? '<span class="muted">样本不足</span>' : fmtNum(r.up_capture, 2)}</td>
        <td class="num">${r.down_capture == null ? '<span class="muted">样本不足</span>' : fmtNum(r.down_capture, 2)}</td>
        <td class="num">${r.n_paired_returns ?? "—"}</td>
      </tr>`;
    }).join("");
    return `<div class="tbl-wrap"><table><thead><tr>
      <th>基准</th><th>超额收益</th><th>跟踪误差（年化）</th><th>上行捕获</th><th>下行捕获</th><th>配对日数</th>
    </tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function benchNotes(b) {
    const notes = (b.notes || []).map(n => `<li>${esc(n)}</li>`).join("");
    const rf = b.risk_free || {};
    const w = (b.blend && b.blend.weights) || {};
    const blendLine = b.blend
      ? `<li>混合基准权重：A股本金 ${fmtNum(w.A, 1)}%（${esc(w.A_bench || "CSI300")}）+ 美股本金 ${fmtNum(w.US, 1)}%（${esc(w.US_bench || "SPX")}）</li>`
      : "";
    return `<ul class="bench-notes">${notes}${blendLine}<li>${esc(rf.label_zh || "无风险利率假设 = 0")}</li></ul>`;
  }

  function benchSectionHTML(d, view) {
    const b = d.benchmarks;
    if (!b || !b.available) {
      return `<section class="sec-bench">${secH("05", "基准对比 / 量化指标", d.mode, "暂无基准数据", "bench")}
        <div class="note">未加载 <code>data/benchmarks.json</code>。可通过妙想指数/美股接口或 <code>research/data/allweather/</code> 补齐后重新构建。</div>
      </section>`;
    }
    const blendLab = b.blend ? b.blend.label_zh : "混合基准";
    const srcBits = (b.benchmarks || []).map(x => `${esc(x.label_zh)}（${esc(x.code || x.id)}）`).join(" · ");
    return `<section class="sec-bench">${secH("05", "基准对比 / 量化指标", d.mode, "净值指数起点=100 · 相对收益与风险指标", "bench")}
      ${perfBanner(d)}
      <div class="grid g2">
        <div class="card"><h3>组合 vs 基准（净值指数） ${modeBadge(d.mode)}</h3>
          <div class="chart-box"><canvas id="cBench"></canvas></div>
          <div class="mini">统一净值指数 vs ${esc(blendLab)} / 沪深300 / 创业板指 / 标普500 / 纳指100。分享版与私有版均为指数（无金额）。</div>
        </div>
        <div class="card"><h3>超额指数差（组合 − 基准）</h3>
          <div class="chart-box"><canvas id="cExcess"></canvas></div>
          <div class="mini">纵轴为指数点差（两者均从 100 起）。正值 = 组合跑赢。样本短时波动解读需谨慎。</div>
        </div>
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><h3>分户曲线 · A股 vs 沪深300</h3>
          <div class="chart-box sm"><canvas id="cBookA"></canvas></div>
        </div>
        <div class="card"><h3>分户曲线 · 美股 vs 标普500</h3>
          <div class="chart-box sm"><canvas id="cBookUS"></canvas></div>
        </div>
      </div>
      <div class="card" style="margin-top:14px"><h3>相对收益 ${modeBadge(d.mode)}</h3>
        ${relativeTable(b)}
        <div class="mini">超额 = 组合累计 − 基准累计。跟踪误差 / 上下行捕获需足够配对日收益；当前不足时显示「样本不足」。</div>
      </div>
      <div class="card" style="margin-top:14px"><h3>量化指标面板 ${modeBadge(d.mode)}</h3>
        ${metricsCard((b.metrics || {}).portfolio, "统一组合", b.min_points_for_annualization)}
        ${b.blend ? metricsCard((b.metrics || {}).blend, b.blend.label_zh, b.min_points_for_annualization) : ""}
        <div class="grid g2" style="margin-top:10px">
          ${metricsCard((b.metrics || {}).book_A, "A股市场", b.min_points_for_annualization)}
          ${metricsCard((b.metrics || {}).book_US, "美股市场", b.min_points_for_annualization)}
        </div>
      </div>
      <div class="card" style="margin-top:14px"><h3>数据来源与口径</h3>
        ${benchNotes(b)}
        <div class="mini">基准序列：${srcBits}。公式见构建产物 <code>benchmarks.formulas</code>（年化 / 夏普 / 跟踪误差等）。${view === "share" ? "分享版仅指数与百分比。" : "私有版同为指数对比，不含基准点位金额化展示。"}</div>
      </div>
    </section>`;
  }

  function benchChart(canvas, d) {
    const b = d.benchmarks;
    if (!b || !b.available || !canvas) return null;
    const labels = b.dates || [];
    const ds = [
      { label: "组合", data: b.portfolio_index, borderColor: BENCH_COLORS.portfolio, backgroundColor: "#f5a52433", pointRadius: 3, tension: .25, fill: false, borderWidth: 2.5 },
    ];
    if (b.blend) ds.push({ label: b.blend.label_zh, data: b.blend.index, borderColor: BENCH_COLORS.BLEND_A_US, pointRadius: 2, tension: .25, fill: false, borderWidth: 2, borderDash: [6, 3] });
    (b.benchmarks || []).forEach(x => {
      ds.push({ label: x.label_zh, data: x.index, borderColor: BENCH_COLORS[x.id] || "#8b97ad", pointRadius: 0, tension: .25, fill: false, borderWidth: 1.5 });
    });
    return new Chart(canvas, {
      type: "line",
      data: { labels, datasets: ds },
      options: (() => {
        const o = chartOpts({}, c => `${c.dataset.label}: ${(+c.raw).toFixed(2)}`);
        o.scales.y.beginAtZero = false;
        return o;
      })(),
    });
  }

  function excessChart(canvas, d) {
    const b = d.benchmarks;
    if (!b || !b.available || !canvas) return null;
    const prefer = ["BLEND_A_US", "CSI300", "SPX"];
    const rels = (b.relative || []).filter(r => prefer.includes(r.benchmark_id));
    const use = rels.length ? rels : (b.relative || []).slice(0, 3);
    const ds = use.map(r => ({
      label: r.benchmark_label,
      data: r.excess_index_pts,
      borderColor: BENCH_COLORS[r.benchmark_id] || "#8b97ad",
      pointRadius: 2, tension: .25, fill: false, borderWidth: 1.8,
    }));
    return new Chart(canvas, {
      type: "line",
      data: { labels: b.dates || [], datasets: ds },
      options: (() => {
        const o = chartOpts({ y: { ticks: { callback: v => (v > 0 ? "+" : "") + v } } }, c => `${c.dataset.label}: ${fmtSigned(c.raw, 2)} pt`);
        o.scales.y.beginAtZero = false;
        return o;
      })(),
    });
  }

  function bookBenchChart(canvas, d, bookId) {
    const b = d.benchmarks;
    if (!b || !b.available || !canvas) return null;
    const pb = (b.per_book || []).find(x => x.book === bookId);
    if (!pb) return null;
    return new Chart(canvas, {
      type: "line",
      data: {
        labels: b.dates || [],
        datasets: [
          { label: pb.label_zh, data: pb.index, borderColor: bookId === "A" ? BENCH_COLORS.A_book : BENCH_COLORS.US_book, pointRadius: 3, tension: .25, fill: false, borderWidth: 2 },
          { label: pb.benchmark_label, data: pb.benchmark_index, borderColor: BENCH_COLORS[pb.benchmark_id] || "#8b97ad", pointRadius: 0, tension: .25, fill: false, borderWidth: 1.5, borderDash: [4, 3] },
        ],
      },
      options: (() => {
        const o = chartOpts({}, c => `${c.dataset.label}: ${(+c.raw).toFixed(2)}`);
        o.scales.y.beginAtZero = false;
        return o;
      })(),
    });
  }

  function mountBenchCharts(d) {
    window.AMX_BENCH_MIN = (d.benchmarks && d.benchmarks.min_points_for_annualization) || 20;
    benchChart(document.getElementById("cBench"), d);
    excessChart(document.getElementById("cExcess"), d);
    bookBenchChart(document.getElementById("cBookA"), d, "A");
    bookBenchChart(document.getElementById("cBookUS"), d, "US");
  }

  window.AMX = { $, esc, pct, spct, modeBadge, stBadge, banners, header, secH, bucketsHTML, bucketChart, allocChart, limitsHTML, ladderHTML, returnsKPIs, returnsChart, cumRetChart, perfBanner, weightsTablePct, sparklineSVG, fmtIndex, navStripShare, benchSectionHTML, mountBenchCharts, metricsCard, relativeTable, BENCH_COLORS, BUCKET_COLORS, themeShort, isPlaceholder };
})();
