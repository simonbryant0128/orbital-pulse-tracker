"use client";

import { useMemo, useState } from "react";
import constellationsData from "@/content/constellations.json";
import eventsData from "@/content/events.json";
import metaData from "@/content/meta.json";
import programsData from "@/content/programs.json";

type EventTone = "positive" | "neutral" | "watch" | "alert";
type FilterGroup = "全部" | "發射部署" | "計畫進度" | "異常";

type TrackerEvent = {
  id: string;
  date: string;
  company: string;
  program: string;
  category: string;
  status: string;
  tone: EventTone;
  title: string;
  summary: string;
  sources: Array<{ label: string; url: string; type: string }>;
};

const events = eventsData.events as TrackerEvent[];
const companyOrder = [
  "全部",
  "SpaceX",
  "Rocket Lab",
  "Blue Origin",
  "Amazon Leo",
  "AST SpaceMobile",
] as const;

const groupOrder: FilterGroup[] = ["全部", "發射部署", "計畫進度", "異常"];

function displayDate(date: string) {
  const [, month, day] = date.split("-");
  return `${month}.${day}`;
}

function fullDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

function matchesGroup(event: TrackerEvent, group: FilterGroup) {
  if (group === "全部") return true;
  if (group === "異常") return event.tone === "alert";
  if (group === "發射部署") {
    return ["發射", "部署"].includes(event.category);
  }
  return ["合約", "測試", "里程碑", "時程"].includes(event.category);
}

export default function Home() {
  const [company, setCompany] = useState<(typeof companyOrder)[number]>("全部");
  const [group, setGroup] = useState<FilterGroup>("全部");
  const [visibleCount, setVisibleCount] = useState(7);

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          (company === "全部" || event.company === company) &&
          matchesGroup(event, group),
      ),
    [company, group],
  );

  const setCompanyFilter = (next: (typeof companyOrder)[number]) => {
    setCompany(next);
    setVisibleCount(7);
  };

  const setGroupFilter = (next: FilterGroup) => {
    setGroup(next);
    setVisibleCount(7);
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="回到頁首">
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>
            <strong>ORBITAL PULSE</strong>
            <small>軌道脈動</small>
          </span>
        </a>
        <nav aria-label="主要導覽">
          <a href="#constellations">星系</a>
          <a href="#programs">計畫</a>
          <a href="#events">事件</a>
          <a href="#data">資料</a>
        </nav>
        <div className="verified-pill">
          <span aria-hidden="true" />
          已核對 {metaData.lastVerified.replaceAll("-", ".")}
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">2026 · LAUNCH &amp; LEO INTELLIGENCE</p>
          <h1>
            從發射臺到低軌，
            <span>一次看懂太空競賽。</span>
          </h1>
          <p className="hero-intro">
            追蹤 SpaceX、Rocket Lab、Blue Origin、Amazon Leo 與 AST
            SpaceMobile 的發射、部署、異常與關鍵里程碑。
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#events">
              查看近期事件 <span aria-hidden="true">↘</span>
            </a>
            <a className="text-action" href="#data">
              了解資料流程
            </a>
          </div>
        </div>

        <aside className="signal-card" aria-label="本期警戒">
          <div className="signal-topline">
            <span className="signal-label">SIGNAL / 本期警戒</span>
            <span className="signal-code">NG · 36</span>
          </div>
          <div className="signal-orbit" aria-hidden="true">
            <span className="signal-core" />
            <span className="signal-dot" />
          </div>
          <p className="signal-kicker">BLUE ORIGIN · NEW GLENN</p>
          <h2>LC-36 重建中</h2>
          <p>熱火測試異常後改採新整合流程，目標仍為 2026 年底前復飛。</p>
          <div className="signal-footer">
            <span className="tone-dot alert" />
            <strong>復飛路徑：Phase 3 / 5</strong>
            <a
              href="https://www.blueorigin.com/news/new-glenn-return-to-flight"
              target="_blank"
              rel="noreferrer"
            >
              官方來源 ↗
            </a>
          </div>
        </aside>

        <div className="hero-meta">
          <div>
            <strong>{events.length}</strong>
            <span>已發布事件</span>
          </div>
          <div>
            <strong>{constellationsData.items.length}</strong>
            <span>追蹤星系</span>
          </div>
          <div>
            <strong>5</strong>
            <span>核心公司</span>
          </div>
          <p>Asia / Taipei · GitHub versioned data</p>
        </div>
      </section>

      <section className="section constellation-section" id="constellations">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">CONSTELLATION SNAPSHOT</p>
            <h2>低軌星系公開檢查點</h2>
          </div>
          <p>
            數字來自各來源最近可驗證的公開資料；星系間的來源日期與統計口徑不同。
          </p>
        </div>

        <div className="metric-grid">
          {constellationsData.items.map((item, index) => {
            const growth = item.current - item.baseline;
            return (
              <article className={`metric-card accent-${item.accent}`} key={item.id}>
                <div className="metric-head">
                  <span>0{index + 1}</span>
                  <span>{item.currentAsOf.replaceAll("-", ".")}</span>
                </div>
                <p className="metric-company">{item.company}</p>
                <h3>{item.name}</h3>
                <div className="metric-number">{item.displayValue}</div>
                <p className="metric-label">{item.metric}</p>
                <div className="growth-row">
                  <div className="growth-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(14, Math.min(100, 45 + growth / 18))}%` }} />
                  </div>
                  <strong>+{growth.toLocaleString("en-US")}{item.displayValue.includes("+") ? "+" : ""}</strong>
                </div>
                <p className="baseline-copy">
                  對比 {item.baselineAsOf.replaceAll("-", ".")}：
                  {item.baseline.toLocaleString("en-US")}
                </p>
                <a href={item.source} target="_blank" rel="noreferrer">
                  開啟資料來源 ↗
                </a>
              </article>
            );
          })}
        </div>

        <div className="breakdown-grid">
          {constellationsData.items.map((item) => {
            const total = item.breakdown.reduce((sum, row) => sum + row.value, 0);
            return (
              <article className="breakdown-card" key={`${item.id}-breakdown`}>
                <div className="breakdown-title">
                  <div>
                    <p>{item.name}</p>
                    <h3>{item.breakdownLabel}</h3>
                  </div>
                  <span>{total.toLocaleString("en-US")}</span>
                </div>
                <div className="segment-bar" aria-hidden="true">
                  {item.breakdown.map((row, rowIndex) => (
                    <span
                      key={row.label}
                      className={`segment segment-${rowIndex + 1}`}
                      style={{ width: `${(row.value / total) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="breakdown-list">
                  {item.breakdown.map((row, rowIndex) => (
                    <div key={row.label}>
                      <span className={`legend legend-${rowIndex + 1}`} />
                      <span>{row.label}</span>
                      <strong>{row.value.toLocaleString("en-US")}</strong>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section program-section" id="programs">
        <div className="section-heading split-heading">
          <div>
            <p className="eyebrow">PROGRAM PULSE</p>
            <h2>三大火箭計畫脈動</h2>
          </div>
          <p>把原表單中的里程碑、時程變更與異常，轉換成可快速判讀的計畫狀態。</p>
        </div>

        <div className="program-grid">
          {programsData.items.map((program, index) => (
            <article className="program-card" key={program.id}>
              <div className="program-index">P{index + 1}</div>
              <div className="program-heading">
                <div>
                  <p>{program.company}</p>
                  <h3>{program.name}</h3>
                </div>
                <span className={`status-chip ${program.statusTone}`}>
                  {program.status}
                </span>
              </div>
              <p className="program-vehicle">{program.vehicle}</p>
              <h4>{program.headline}</h4>
              <p className="program-detail">{program.detail}</p>
              <div className="program-progress">
                <div>
                  <span>公開計畫進度</span>
                  <strong>{program.progress}%</strong>
                </div>
                <div className="progress-track" aria-hidden="true">
                  <span style={{ width: `${program.progress}%` }} />
                </div>
              </div>
              <div className="program-next">
                <span>NEXT</span>
                <strong>{program.next}</strong>
              </div>
              <a href={program.source} target="_blank" rel="noreferrer">
                查看依據 ↗
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="section event-section" id="events">
        <div className="section-heading event-heading">
          <div>
            <p className="eyebrow">VERIFIED EVENT STREAM</p>
            <h2>近期事件流</h2>
          </div>
          <div className="event-count">
            <strong>{filteredEvents.length}</strong>
            <span>符合條件</span>
          </div>
        </div>

        <div className="filters" aria-label="事件篩選">
          <div className="filter-row">
            <span>公司</span>
            <div>
              {companyOrder.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={company === item}
                  onClick={() => setCompanyFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-row">
            <span>類型</span>
            <div>
              {groupOrder.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={group === item}
                  onClick={() => setGroupFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="event-list" aria-live="polite">
          {filteredEvents.slice(0, visibleCount).map((event) => (
            <article className={`event-card tone-${event.tone}`} key={event.id}>
              <time dateTime={event.date}>
                <strong>{displayDate(event.date)}</strong>
                <span>{event.date.slice(0, 4)}</span>
              </time>
              <div className="event-line" aria-hidden="true">
                <span />
              </div>
              <div className="event-company">
                <p>{event.company}</p>
                <span>{event.program}</span>
              </div>
              <div className="event-body">
                <div className="event-tags">
                  <span>{event.category}</span>
                  <span className={`event-status ${event.tone}`}>{event.status}</span>
                </div>
                <h3>{event.title}</h3>
                <p>{event.summary}</p>
                <div className="source-links">
                  {event.sources.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                      {source.label} · {source.type} ↗
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
          {filteredEvents.length === 0 && (
            <div className="empty-state">
              <strong>目前沒有符合條件的事件</strong>
              <p>請調整公司或事件類型篩選。</p>
            </div>
          )}
        </div>

        {visibleCount < filteredEvents.length && (
          <button
            type="button"
            className="load-more"
            onClick={() => setVisibleCount((count) => count + 6)}
          >
            載入更多事件 <span aria-hidden="true">↓</span>
          </button>
        )}
      </section>

      <section className="section data-section" id="data">
        <div className="data-intro">
          <p className="eyebrow">GITHUB-NATIVE DATA</p>
          <h2>每一次更新，都留得下來。</h2>
          <p>
            GitHub 的正式分支保存網站內容與歷史版本。公開資訊與原表單只負責送出候選更新，通過檢查後才會發布。
          </p>
          <div className="data-policies">
            <span>穩定事件 ID</span>
            <span>原始來源連結</span>
            <span>可回復版本</span>
            <span>更新日期與口徑</span>
          </div>
          <a
            className="github-action"
            href={metaData.repositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            查看 GitHub 資料庫 <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="pipeline" aria-label="資料更新流程">
          <div className="pipeline-step">
            <span>01</span>
            <div>
              <strong>公開來源／表單</strong>
              <p>公司、監管機構與既有表單提供候選內容。</p>
            </div>
          </div>
          <div className="pipeline-arrow" aria-hidden="true">↓</div>
          <div className="pipeline-step">
            <span>02</span>
            <div>
              <strong>GitHub 待審變更</strong>
              <p>檢查重複 ID、日期、欄位與來源網址。</p>
            </div>
          </div>
          <div className="pipeline-arrow" aria-hidden="true">↓</div>
          <div className="pipeline-step active">
            <span>03</span>
            <div>
              <strong>正式資料發布</strong>
              <p>合併後網站更新，歷史修改完整保留。</p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <div>
            <strong>ORBITAL PULSE</strong>
            <p>Rocket &amp; LEO intelligence, verified in public.</p>
          </div>
        </div>
        <p className="footer-note">
          資料僅供研究與產業追蹤；發射排程、在軌數與計畫目標可能隨官方資訊更新。
        </p>
        <div className="footer-meta">
          <span>Last verified {fullDate(metaData.lastVerified)}</span>
          <a href="#top">回到頁首 ↑</a>
        </div>
      </footer>
    </main>
  );
}
