/* SHARE view — percentages only. Data: data/share.js (window.ALPHAMX_SHARE). No amounts / prices / fills / ledger. */
(function () {
  const d = window.ALPHAMX_SHARE, A = window.AMX;
  if (!d) { document.body.innerHTML = '<p style="padding:20px">缺少 data/share.js</p>'; return; }
  d.buckets.forEach(b => (A.BUCKET_COLORS[b.id] = b.color));
  const { esc, pct, modeBadge } = A, u = d.unified;

  const hero = `<section class="sec-nav">${A.secH("01", "净值概览", d.mode, "仅指数与百分比 · 不含金额", "nav")}
    ${A.navStripShare(d)}
    <div class="grid g4" style="margin-top:14px">
      <div class="card kpi"><div class="lab">当前权益 / 现金 ${modeBadge(d.mode)}</div><div class="val">${pct(u.equity_pct, 0)} / ${pct(u.cash_pct, 0)}</div><div class="foot">占统一净值</div></div>
      <div class="card kpi"><div class="lab">目标权益 / 现金</div><div class="val">${pct(u.target_equity_pct, 1)} / ${pct(u.target_cash_pct, 1)}</div><div class="foot">统一穿透权益硬顶 88% · 现金底每户 ≥2%（含现金等价）</div></div>
      <div class="card kpi"><div class="lab">A股 / 美股 占比</div><div class="val">${d.books.map(b => pct(b.share_of_unified_pct, 0)).join(" / ")}</div><div class="foot">折汇后 · 中间价口径</div></div>
      <div class="card kpi"><div class="lab">较本金（统一）</div><div class="val">${A.spct(u.vs_capital_pct, 2)}</div><div class="foot">分户见下方图例</div></div>
    </div>
    <div class="split" style="margin-top:14px">${d.books.map(b => `<span style="width:${b.share_of_unified_pct}%;background:${b.market === "A股" ? "#f5a524" : "#3ea6ff"}"></span>`).join("")}</div>
    <div class="legend">${d.books.map(b => `<span><i style="background:${b.market === "A股" ? "#f5a524" : "#3ea6ff"}"></i>${esc(b.label)}${b.subtitle ? " · " + esc(b.subtitle) : ""} ${pct(b.share_of_unified_pct)}</span>`).join("")}<span>两户现金分户管理，不跨境调拨</span></div>
    ${d.fx_constraint ? `<div class="note" style="margin-top:10px">🔒 ${esc(d.fx_constraint)}</div>` : ""}
  </section>`;

  const books = `<section class="sec-markets">${A.secH("02", "分户市场 · 目标权重", d.mode, "目标为建仓意向 · 仅百分比", "markets")}
    <div class="grid g2">${d.books.map(b => {
      const sub = b.subtitle ? ` · ${esc(b.subtitle)}` : "";
      const vp = b.vs_capital_pct;
      const cls = vp > 0 ? "pos" : vp < 0 ? "neg" : "";
      return `<div class="card market-card"><h3><span class="market-pill">${esc(b.label)}</span> ${modeBadge(b.mode)} <span class="sub">占统一 ${pct(b.share_of_unified_pct)}${sub} · 现金底 ≥${b.cash_floor_pct}%</span></h3>
        <div class="mini">较本金 <b class="num ${cls}">${A.spct(vp, 2)}</b> · 当前权益 ${pct(b.equity_pct, 1)} / 现金 ${pct(b.cash_pct, 1)}${b.cash_equivalents_pct > 0 ? `（其中现金等价 ${pct(b.cash_equivalents_pct, 1)}）` : ""}</div>
        ${A.weightsTablePct(b)}</div>`;
    }).join("")}</div></section>`;

  const buckets = `<section class="sec-themes">${A.secH("03", "主题穿透（四主题）", d.mode, "占统一净值 · 主题 ≠ 分户市场", "themes")}
    <div class="grid g2">
      <div class="card">${A.bucketsHTML(d)}</div>
      <div class="grid" style="gap:14px">
        <div class="card"><h3>主题占比对照</h3><div class="chart-box"><canvas id="cBuckets"></canvas></div></div>
        <div class="card"><h3>目标配置 ${modeBadge(d.mode)}</h3><div class="chart-box sm"><canvas id="cAlloc"></canvas></div></div>
      </div>
    </div>
    <div class="card" style="margin-top:14px"><h3>限额距离 ${modeBadge(d.mode)}</h3>${A.limitsHTML(d)}</div>
  </section>`;

  const rets = `<section class="sec-perf">${A.secH("04", "历史表现 / 回测示意", d.mode, "仅 % 收益与回撤 · 不含金额", "perf")}
    ${A.perfBanner(d)}
    ${A.returnsKPIs(d)}
    <div class="grid g2" style="margin-top:14px">
      <div class="card"><h3>相对净值指数（起点=100）& 回撤 ${modeBadge(d.mode)}</h3><div class="chart-box"><canvas id="cRet"></canvas></div><div class="mini">虚线为回撤阶梯档位。分享版仅展示百分比，不含绝对金额。</div></div>
      <div class="card"><h3>累计收益 % ${modeBadge(d.mode)}</h3><div class="chart-box"><canvas id="cCum"></canvas></div><div class="mini">累计收益 = 相对净值指数 − 100。尚无成交写入时曲线平置。</div></div>
    </div>
    <div class="card" style="margin-top:14px"><h3>回撤阶梯（仅展示）</h3>${A.ladderHTML(d)}</div>
  </section>`;

  const bench = A.benchSectionHTML(d, "share");

  const foot = `<footer>
    <p>分享版：仅显示收益、回撤、权重百分比与主题穿透；不含任何金额、价格、成交或台账明细。全部数据为<b>正式持仓</b>口径；指令由 Maxwell 人工同步执行，台不下单。估值日 ${esc(d.meta.as_of)}。</p>
    <div class="big-disc">「${esc(d.meta.disclaimer)}」 · 正式持仓</div>
  </footer>`;

  document.getElementById("app").innerHTML = A.banners(d, "share") + `<div class="wrap">${A.header(d, "分享版")}${hero}${books}${buckets}${rets}${bench}${foot}</div>`;
  A.bucketChart(document.getElementById("cBuckets"), d);
  A.allocChart(document.getElementById("cAlloc"), d);
  A.returnsChart(document.getElementById("cRet"), d);
  A.cumRetChart(document.getElementById("cCum"), d);
  A.mountBenchCharts(d);
})();
