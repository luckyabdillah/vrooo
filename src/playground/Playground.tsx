import { useEffect, useState } from 'react';
import { Logo } from '../components/Brand';
import { CityScene } from '../scene/CityScene';
import type { TimeOfDay } from '../scene/time';
import {
  defaultScenario,
  scenarioTotal,
  SimulationPair,
  validateScenario,
  type ControlMode,
  type Metrics,
  type Scenario,
} from '../simulation/engine';
import { createLayout, VEHICLE_SPECS, type IntersectionType, type VehicleKind } from '../simulation/layout';
import './playground.css';

const kinds: VehicleKind[] = ['car', 'motorcycle', 'bus', 'truck'];
const signalNames = { green: 'Hijau', yellow: 'Kuning', red: 'Merah' };
const seconds = (value: number) => `${value.toFixed(1)} dtk`;

function JunctionDiagram({ type }: { type: IntersectionType }) {
  const layout = createLayout(type);
  return (
    <svg className="junction-diagram" viewBox="0 0 260 220" aria-label={`Diagram simpang ${type}`} role="img">
      <rect x="10" y="10" width="240" height="200" rx="30" fill="#dce6d9" />
      {layout.approaches.map((a) => (
        <g key={a.id} transform={`translate(130 110) rotate(${(a.angle * 180) / Math.PI})`}>
          <path d="M0-22H105V22H0Z" fill="#52696d" />
          <path d="M35 0H101" stroke="#f0cb72" strokeWidth="1.5" strokeDasharray="7 5" />
          <path d="M50 -11H100 M50 11H100" stroke="#eef1e6" strokeWidth="1" strokeDasharray="6 8" />
          <path d="M29-17V17 M34-17V17 M39-17V17" stroke="#e9ede5" strokeWidth="2.5" />
          <rect x="61" y="4" width="13" height="6" rx="2" fill="#f2ca6c" />
          <rect x="81" y="15" width="10" height="5" rx="2" fill="#f6f5ec" />
        </g>
      ))}
      <circle cx="130" cy="110" r="22" fill="#52696d" />
    </svg>
  );
}

function CompareCard({ title, metric, running, adaptive }: { title: string; metric: Metrics; running: boolean; adaptive?: boolean }) {
  return (
    <article className={`compare-card ${adaptive ? 'compare-adaptive' : ''}`}>
      <div className="compare-card-heading">
        <span>{title}</span>
        <span className={`metric-state ${metric.done ? 'metric-done' : ''}`}>{metric.done ? 'Selesai' : running ? 'Berjalan' : 'Dijeda'}</span>
      </div>
      <strong>
        {metric.averageWait.toFixed(1)}
        <small>dtk / kendaraan</small>
      </strong>
      <p>Rata-rata waktu berhenti</p>
      <div className="compare-small">
        <span>
          Lewat{' '}
          <b>
            {metric.passed}/{metric.total}
          </b>
        </span>
        <span>
          Antre <b>{metric.queued}</b>
        </span>
        <span>
          Waktu <b>{seconds(metric.elapsed)}</b>
        </span>
      </div>
    </article>
  );
}

export default function Playground() {
  const [type, setType] = useState<IntersectionType | null>(null);
  const [scenario, setScenario] = useState<Scenario>(() => defaultScenario(4));
  const [simulation, setSimulation] = useState<SimulationPair | null>(null);
  const [metrics, setMetrics] = useState<{ adaptive: Metrics; fixed: Metrics } | null>(null);
  const [view, setView] = useState<ControlMode>('adaptive');
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState<TimeOfDay>('day');
  const [camera, setCamera] = useState<'overview' | 'top'>('overview');
  const layout = createLayout(scenario.type);
  const total = scenarioTotal(scenario);
  const error = validateScenario(scenario);
  useEffect(() => {
    document.title = 'Playground — Trafflow';
    if (!simulation) return;
    const update = () => {
      setMetrics({ adaptive: simulation.adaptive.metrics(), fixed: simulation.fixed.metrics() });
      setRunning(simulation.running);
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [simulation]);

  function choose(nextType: IntersectionType) {
    setType(nextType);
    setScenario(defaultScenario(nextType));
    window.scrollTo({ top: 0 });
  }
  function setCount(id: string, kind: VehicleKind, count: number) {
    setScenario((current) => ({ ...current, counts: { ...current.counts, [id]: { ...current.counts[id], [kind]: count } } }));
  }
  function start() {
    if (error) return;
    const pair = new SimulationPair(scenario);
    pair.running = true;
    pair.speed = speed;
    setSimulation(pair);
    setMetrics({ adaptive: pair.adaptive.metrics(), fixed: pair.fixed.metrics() });
    setView('adaptive');
    setRunning(true);
    window.scrollTo({ top: 0 });
  }
  function togglePlay() {
    if (simulation) {
      simulation.running = !simulation.running;
      setRunning(simulation.running);
    }
  }
  function changeSpeed(value: number) {
    setSpeed(value);
    if (simulation) simulation.speed = value;
  }
  function preset(balanced: boolean) {
    setScenario((current) => ({
      ...current,
      counts: Object.fromEntries(
        layout.approaches.map((a, i) => [
          a.id,
          { car: balanced ? 6 : i === 0 ? 18 : 2, motorcycle: balanced ? 4 : i === 0 ? 10 : 1, bus: 1, truck: balanced ? 1 : 0 },
        ]),
      ),
    }));
  }
  const finished = Boolean(metrics?.adaptive.done && metrics?.fixed.done);
  const improvement =
    metrics && metrics.fixed.averageWait > 0 ? ((metrics.fixed.averageWait - metrics.adaptive.averageWait) / metrics.fixed.averageWait) * 100 : null;
  const shown = metrics?.[view];

  return (
    <div className="playground-page">
      <header className="lab-header">
        <div className="lab-container lab-header-inner">
          <Logo dark />
          <nav aria-label="Navigasi Playground">
            <a href="/">Home</a>
            <a href="/playground" aria-current="page">
              Playground
            </a>
          </nav>
          <span className="lab-label">TRAFFIC SIMULATION LAB</span>
        </div>
      </header>
      <main className="lab-container lab-main">
        <div className="lab-steps" aria-label="Tahap simulasi">
          <span className={!type ? 'current' : ''}>01 Pilih simpang</span>
          <i>→</i>
          <span className={type && !simulation ? 'current' : ''}>02 Atur kendaraan</span>
          <i>→</i>
          <span className={simulation ? 'current' : ''}>03 Simulasikan</span>
        </div>
        {!type ? (
          <>
            <div className="lab-intro">
              <p className="section-kicker">PLAYGROUND / TRAFFLOW</p>
              <h1>
                Atur arusnya.
                <br />
                <em>Lihat perbedaannya.</em>
              </h1>
              <p>Bangun skenario lalu bandingkan waktu tunggu lampu adaptif dengan lampu konvensional. Mulai dengan memilih bentuk persimpangan.</p>
            </div>
            <div className="junction-options">
              {([3, 4, 5] as const).map((choice) => (
                <button className="junction-option" key={choice} onClick={() => choose(choice)}>
                  <JunctionDiagram type={choice} />
                  <span className="junction-card-meta">{choice} ARAH · 2 LAJUR MASUK / ARAH</span>
                  <span className="junction-title">
                    Simpang {choice}
                    <span>↗</span>
                  </span>
                  <p>
                    {choice === 3
                      ? 'Persimpangan berbentuk T.'
                      : choice === 4
                        ? 'Persimpangan silang empat arah.'
                        : 'Empat arah dengan cabang timur laut.'}
                  </p>
                </button>
              ))}
            </div>
            <p className="lab-bottom-note">Satu arah hijau pada satu waktu. Setiap skenario menggunakan kondisi awal yang sama untuk kedua mode.</p>
          </>
        ) : !simulation ? (
          <>
            <div className="lab-section-heading">
              <div>
                <p className="section-kicker">SKENARIO SIMPANG {type}</p>
                <h1>
                  Berapa banyak
                  <br />
                  <em>kendaraan yang datang?</em>
                </h1>
              </div>
              <button className="lab-text-button" onClick={() => setType(null)}>
                ← Ganti persimpangan
              </button>
            </div>
            <div className="scenario-layout">
              <div>
                <div className="scenario-presets">
                  <span>Isi cepat</span>
                  <button onClick={() => preset(true)}>Arus seimbang</button>
                  <button onClick={() => preset(false)}>Padat dari satu arah</button>
                  <button
                    onClick={() =>
                      setScenario((s) => ({
                        ...s,
                        counts: Object.fromEntries(layout.approaches.map((a) => [a.id, { car: 0, motorcycle: 0, bus: 0, truck: 0 }])),
                      }))
                    }
                  >
                    Kosongkan
                  </button>
                </div>
                <div className="approach-forms">
                  {layout.approaches.map((a, index) => (
                    <fieldset className="approach-form" key={a.id}>
                      <legend>
                        <span className="approach-number">{String(index + 1).padStart(2, '0')}</span>Dari {a.name}
                        <small>{kinds.reduce((sum, kind) => sum + scenario.counts[a.id][kind], 0)} kendaraan</small>
                      </legend>
                      <div className="vehicle-inputs">
                        {kinds.map((kind) => (
                          <label key={kind}>
                            <span>{VEHICLE_SPECS[kind].label}</span>
                            <input
                              type="number"
                              min="0"
                              max="40"
                              step="1"
                              inputMode="numeric"
                              aria-label={`${VEHICLE_SPECS[kind].label} dari ${a.name}`}
                              value={scenario.counts[a.id][kind]}
                              onChange={(event) => setCount(a.id, kind, Number(event.target.value))}
                            />
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </div>
              <aside className="scenario-summary">
                <JunctionDiagram type={type} />
                <div className="scenario-total">
                  <strong>{total}</strong>
                  <span>
                    kendaraan
                    <br />
                    dalam skenario
                  </span>
                </div>
                <label className="fixed-duration">
                  Hijau konvensional per arah
                  <div>
                    <input
                      type="number"
                      min="8"
                      max="60"
                      step="1"
                      value={scenario.fixedGreen}
                      aria-label="Durasi hijau konvensional"
                      onChange={(event) => setScenario((s) => ({ ...s, fixedGreen: Number(event.target.value) }))}
                    />
                    <span>detik</span>
                  </div>
                </label>
                <p>Semua kendaraan mulai dalam antrean pada detik 0 dan dibagi ke dua lajur. Kendaraan di luar jangkauan kamera tetap dihitung.</p>
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                <button className="button button-primary play-button" onClick={start} disabled={Boolean(error)}>
                  ▶ Play simulasi
                </button>
              </aside>
            </div>
          </>
        ) : (
          metrics && (
            <>
              <div className="simulation-heading">
                <div>
                  <p className="section-kicker">
                    SIMPANG {type} / {total} KENDARAAN
                  </p>
                  <h1>{finished ? 'Hasil perbandingan.' : 'Satu skenario. Dua pendekatan.'}</h1>
                </div>
                <button
                  className="lab-text-button"
                  onClick={() => {
                    simulation.running = false;
                    setSimulation(null);
                  }}
                >
                  ← Edit skenario
                </button>
              </div>
              <div className="simulation-layout">
                <div className="simulation-main">
                  <div className="simulation-stage">
                    <CityScene simulation={simulation} view={view} timeOverride={time} cameraPreset={camera} />
                    <div className="scene-toolbar">
                      <div className="mode-switch" aria-label="Mode yang ditampilkan">
                        <button aria-pressed={view === 'adaptive'} onClick={() => setView('adaptive')}>
                          Adaptif
                        </button>
                        <button aria-pressed={view === 'fixed'} onClick={() => setView('fixed')}>
                          Konvensional
                        </button>
                      </div>
                      <div className="scene-options">
                        <select aria-label="Sudut kamera" value={camera} onChange={(e) => setCamera(e.target.value as 'overview' | 'top')}>
                          <option value="overview">Aerial</option>
                          <option value="top">Dari atas</option>
                        </select>
                        <select aria-label="Pencahayaan" value={time} onChange={(e) => setTime(e.target.value as TimeOfDay)}>
                          <option value="day">Siang</option>
                          <option value="night">Malam</option>
                        </select>
                      </div>
                    </div>
                    <div className="scene-phase">
                      <span className={`status-dot ${shown?.done ? 'red' : shown?.phase}`} />
                      <span>
                        {shown?.done
                          ? 'Semua kendaraan selesai'
                          : shown?.phase === 'all-red'
                            ? 'Semua merah · menunggu area kosong'
                            : `${shown?.phase === 'green' ? 'Hijau' : 'Kuning'} · ${shown?.active} · ${Math.ceil(shown?.phaseRemaining ?? 0)} dtk`}
                      </span>
                    </div>
                    <span className="camera-hint">Geser untuk memutar · scroll untuk zoom</span>
                  </div>
                  <div className="simulation-controls">
                    <div>
                      <button className="button button-primary" onClick={togglePlay} disabled={finished}>
                        {running ? 'Ⅱ Jeda' : '▶ Lanjut'}
                      </button>
                      <button className="reset-button" onClick={start}>
                        ↻ Ulangi
                      </button>
                    </div>
                    <label>
                      Kecepatan
                      <select aria-label="Kecepatan simulasi" value={speed} onChange={(e) => changeSpeed(Number(e.target.value))}>
                        {[0.5, 1, 2, 4].map((n) => (
                          <option key={n} value={n}>
                            {n}×
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="approach-status">
                    {shown?.approaches.map((a) => (
                      <div key={a.id}>
                        <strong>{a.name}</strong>
                        <span className={`signal-tag signal-${a.signal}`}>{signalNames[a.signal]}</span>
                        <small>
                          {a.queued} antre · {a.remaining} belum masuk
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
                <aside className="comparison-panel">
                  <div className="comparison-heading">
                    <h2>Waktu tunggu</h2>
                    <span>{finished ? 'HASIL AKHIR' : 'SEMENTARA'}</span>
                  </div>
                  <CompareCard title="Trafflow adaptif" metric={metrics.adaptive} running={running} adaptive />
                  <CompareCard title="Konvensional" metric={metrics.fixed} running={running} />
                  <div className={`efficiency-result ${finished ? 'is-final' : ''}`} role="status">
                    <span>{finished ? 'Perbandingan selesai' : 'Selisih sementara'}</span>
                    <strong>{improvement === null ? '—' : `${Math.abs(improvement).toFixed(1)}%`}</strong>
                    <p>
                      {improvement === null
                        ? 'Menunggu data waktu tunggu.'
                        : Math.abs(improvement) < 0.05
                          ? 'Waktu tunggu kedua mode setara.'
                          : `Waktu tunggu adaptif ${improvement >= 0 ? 'lebih singkat' : 'lebih lama'} dibandingkan konvensional.`}
                    </p>
                  </div>
                  <div className="wait-bars" aria-label="Perbandingan rata-rata waktu tunggu">
                    {(['adaptive', 'fixed'] as const).map((mode) => (
                      <div key={mode}>
                        <span>
                          {mode === 'adaptive' ? 'Adaptif' : 'Konvensional'}
                          <b>{seconds(metrics[mode].averageWait)}</b>
                        </span>
                        <div>
                          <i
                            style={{
                              width: `${(metrics[mode].averageWait / Math.max(1, metrics.adaptive.averageWait, metrics.fixed.averageWait)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>
              </div>
              <details className="method-note">
                <summary>Cara menghitung efektivitas dan asumsi simulasi</summary>
                <p>
                  Kedua mode menjalankan kendaraan, rute, kecepatan, dan kondisi awal yang sama. Waktu tunggu adalah akumulasi detik saat kecepatan
                  kendaraan kurang dari 0,1 unit/detik, dibagi seluruh {total} kendaraan. Antrean yang masih berada di luar layar ikut dihitung.
                </p>
                <p>
                  Efektivitas = (waktu tunggu konvensional − waktu tunggu adaptif) ÷ waktu tunggu konvensional × 100%. Nilai selama simulasi masih
                  sementara; hasil akhir tersedia setelah kedua mode selesai. Nilai negatif berarti adaptif lebih lambat pada skenario tersebut.
                </p>
                <p>
                  Adaptif mengikuti urutan arah, melewati arah kosong, dan menentukan hijau 8–26 detik sesuai beban antrean. Konvensional memberi
                  setiap arah hijau tetap {scenario.fixedGreen} detik. Keduanya memakai kuning 3 detik dan semua-merah minimal 2 detik, diperpanjang
                  hingga kendaraan terakhir keluar dari area konflik. Rute menuju arah paling berseberangan yang tersedia, tanpa pindah lajur. Ini
                  model edukasi, bukan pengukuran kinerja lalu lintas nyata.
                </p>
              </details>
            </>
          )
        )}
      </main>
      <footer className="lab-footer lab-container">
        <span>Trafflow · PBL Project</span>
        <a href="/">← Kembali ke Home</a>
      </footer>
    </div>
  );
}
