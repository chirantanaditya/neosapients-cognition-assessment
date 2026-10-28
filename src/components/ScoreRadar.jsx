import {TrendingUp} from 'lucide-react';
import {createRoot} from 'react-dom/client';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import './score-radar.css';

let activeRoot = null;

function RadarTooltip({active, payload}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return <div className="radar-tooltip"><span>{item.pillar}</span><strong>{item.score}%</strong></div>;
}

export function ScoreRadar({pillars}) {
  const chartData = pillars.map((pillar) => ({
    pillar: pillar.name,
    score: pillar.pct,
    fullMark: 100,
  }));
  const strongest = chartData.reduce((best, item) => item.score > best.score ? item : best, chartData[0]);

  return (
    <article className="radar-card">
      <header className="radar-header">
        <div>
          <div className="radar-eyebrow">Your cognition profile</div>
          <h2>Three pillars of readiness</h2>
          <p>How Knowledge, Memory and Governance work together.</p>
        </div>
        <span className="radar-scale">0–100</span>
      </header>
      <div className="radar-chart" role="img" aria-label={chartData.map((item) => `${item.pillar}: ${item.score} percent`).join(', ')}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} outerRadius="67%" margin={{top: 8, right: 34, bottom: 8, left: 34}}>
            <PolarGrid gridType="polygon" stroke="#d9c8e4" radialLines strokeOpacity={0.7} />
            <PolarAngleAxis dataKey="pillar" tick={{fill: '#614671', fontSize: 12}} tickLine={false} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip cursor={false} content={<RadarTooltip />} />
            <Radar dataKey="score" stroke="#8d4fba" strokeWidth={2} fill="#a25afb" fillOpacity={0.32} dot={{r: 4, fill: '#392170', strokeWidth: 0}} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <footer className="radar-footer">
        <span><TrendingUp aria-hidden="true" size={15} /> Strongest pillar</span>
        <strong>{strongest.pillar} · {strongest.score}%</strong>
      </footer>
    </article>
  );
}

export function mountScoreRadar(element, pillars) {
  unmountScoreRadar();
  if (!element || !Array.isArray(pillars) || pillars.length !== 3) return;
  activeRoot = createRoot(element);
  activeRoot.render(<ScoreRadar pillars={pillars} />);
}

export function unmountScoreRadar() {
  if (!activeRoot) return;
  activeRoot.unmount();
  activeRoot = null;
}
