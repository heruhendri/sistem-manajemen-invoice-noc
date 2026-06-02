import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Wifi, 
  RefreshCw, 
  Zap, 
  Radio, 
  Cpu, 
  Database, 
  Activity, 
  ArrowUp, 
  ArrowDown, 
  Network,
  Maximize2,
  ListFilter,
  Play,
  Pause,
  CloudAlert
} from "lucide-react";
import { Client } from "../types";

interface TrafficPoint {
  time: string;
  tx: number; // Upload in Mbps
  rx: number; // Download in Mbps
}

interface TrafficMonitorProps {
  title?: string;
  isAdmin?: boolean;
  clientName?: string;
  clients?: Client[];
}

const INTERFACES = [
  { id: "ether1-wan", name: "ether1-WAN (Fiber Optic Trunk)", baseTx: 145, baseRx: 280, maxSpeed: 1000 },
  { id: "ether2-lan", name: "ether2-LAN-Core (Corporate Switch)", baseTx: 120, baseRx: 220, maxSpeed: 1000 },
  { id: "ether3-server", name: "ether3-ServerRoom (NOC Gateway)", baseTx: 340, baseRx: 450, maxSpeed: 10000 },
  { id: "wlan1-office", name: "wlan1-Office (Public Access Point)", baseTx: 15, baseRx: 48, maxSpeed: 300 },
  { id: "pppoe-out1", name: "pppoe-out1 (SLA Tunneled Link)", baseTx: 50, baseRx: 95, maxSpeed: 200 },
  { id: "sfp-plus1", name: "sfp-plus1 (Backbone 10G Uplink)", baseTx: 1150, baseRx: 2400, maxSpeed: 10000 },
];

export default function TrafficMonitor({ title = "Live Traffic Monitor", isAdmin = false, clientName = "", clients = [] }: TrafficMonitorProps) {
  const [selectedPortId, setSelectedPortId] = useState<string>("ether1-wan");
  const [selectedClientMonitorId, setSelectedClientMonitorId] = useState<string>("all");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [stressTestMode, setStressTestMode] = useState<boolean>(false);
  const [points, setPoints] = useState<TrafficPoint[]>([]);
  const [cpuLoad, setCpuLoad] = useState<number>(14);
  const [activeSockets, setActiveSockets] = useState<number>(430);
  const [historySize] = useState<number>(20);
  const timeCounterRef = useRef<number>(0);

  // High-performance custom alerting parameters
  const [alertThresholdMbps, setAlertThresholdMbps] = useState<number>(250);
  const [lastNotificationTimestamp, setLastNotificationTimestamp] = useState<string | null>(null);
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(false);

  // Find active selected client 
  const activeClient = useMemo(() => {
    if (selectedClientMonitorId === "all") return null;
    return clients.find(c => c.id === selectedClientMonitorId) || null;
  }, [selectedClientMonitorId, clients]);

  // Compute targeted custom stats depending on plan fee and SLA limits
  const baseBandwidthTx = useMemo(() => {
    const defaultTx = INTERFACES.find(inf => inf.id === selectedPortId)?.baseTx || 120;
    if (activeClient) {
      // Scale bandwidth based on plan billing fee 
      return Math.max(12, Math.round(activeClient.monthlyFee / 18000));
    }
    return defaultTx;
  }, [selectedPortId, activeClient]);

  const baseBandwidthRx = useMemo(() => {
    const defaultRx = INTERFACES.find(inf => inf.id === selectedPortId)?.baseRx || 220;
    if (activeClient) {
      // Scale bandwidth based on plan billing fee 
      return Math.max(25, Math.round(activeClient.monthlyFee / 11000));
    }
    return defaultRx;
  }, [selectedPortId, activeClient]);

  // Get active interface characteristics
  const activeInterface = useMemo(() => {
    return INTERFACES.find(inf => inf.id === selectedPortId) || INTERFACES[0];
  }, [selectedPortId]);

  // Seed initial points to avoid empty chart
  useEffect(() => {
    const initialPoints: TrafficPoint[] = [];
    const baseTx = baseBandwidthTx;
    const baseRx = baseBandwidthRx;

    for (let i = 19; i >= 0; i--) {
      const now = new Date();
      now.setSeconds(now.getSeconds() - i);
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      const valModifier = 0.85 + Math.random() * 0.3; // fluctuates between 85% to 115%
      
      initialPoints.push({
        time: timeStr,
        tx: Number((baseTx * valModifier).toFixed(1)),
        rx: Number((baseRx * valModifier).toFixed(1))
      });
    }
    setPoints(initialPoints);
    timeCounterRef.current = 19;
  }, [selectedPortId, baseBandwidthTx, baseBandwidthRx]);

  // Handle live updates interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setPoints(prevPoints => {
        const nextPoints = [...prevPoints];
        
        // Base values scaled to selection
        let targetTx = baseBandwidthTx;
        let targetRx = baseBandwidthRx;

        if (stressTestMode) {
          // Send traffic shooting up
          targetTx = selectedPortId === "sfp-plus1" ? 4200 : targetTx * 3.5;
          targetRx = selectedPortId === "sfp-plus1" ? 8500 : targetRx * 3.2;
        }

        // Add some random noise fluctuations
        const noiseTx = (Math.random() - 0.5) * (targetTx * 0.15);
        const noiseRx = (Math.random() - 0.5) * (targetRx * 0.15);

        const currentTx = Math.max(0.1, Number((targetTx + noiseTx).toFixed(1)));
        const currentRx = Math.max(0.1, Number((targetRx + noiseRx).toFixed(1)));

        // Time label
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        nextPoints.push({
          time: timeStr,
          tx: currentTx,
          rx: currentRx
        });

        if (nextPoints.length > historySize) {
          nextPoints.shift();
        }

        return nextPoints;
      });

      // Fluctuate stats based on load
      setCpuLoad(prev => {
        const baseCpu = stressTestMode ? 82 : (activeClient ? 18 : 12);
        const fluct = Math.floor((Math.random() - 0.5) * 8);
        return Math.max(2, Math.min(99, baseCpu + fluct));
      });

      setActiveSockets(prev => {
        const baseSock = stressTestMode ? 1950 : (activeClient ? 210 : 350);
        const fluct = Math.floor((Math.random() - 0.5) * 40);
        return Math.max(10, baseSock + fluct);
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, stressTestMode, baseBandwidthTx, baseBandwidthRx, selectedPortId, historySize, activeClient]);

  // Compute live statistics
  const currentStat = useMemo(() => {
    if (points.length === 0) return { tx: 0, rx: 0 };
    return points[points.length - 1];
  }, [points]);

  // Model automatic client sub-network connection table
  const simulatedIpConnections = useMemo(() => {
    const clientSubnet = activeClient 
      ? `192.168.${activeClient.id.replace(/\D/g, "") || "18"}` 
      : "10.0.8";

    // Distribute rates based on current upload/download readings
    const rxRate = currentStat.rx;
    const txRate = currentStat.tx;

    const items = [
      { ip: `${clientSubnet}.102`, name: "Core LAN Gateway Switch", tx: txRate * 0.45, rx: rxRate * 0.42, protocol: "HTTPS (TCP/443)", origin: "SGP Main Cloud Server", state: "Established" },
      { ip: `${clientSubnet}.45`, name: "DRC Storage Backups", tx: txRate * 0.35, rx: rxRate * 0.33, protocol: "SFTP (TCP/22)", origin: "Batam Disaster Center", state: "Established" },
      { ip: `${clientSubnet}.18`, name: "Central office-wlan AP", tx: txRate * 0.12, rx: rxRate * 0.15, protocol: "DNS Query (UDP/53)", origin: "Cloudflare Core IP", state: "Active" },
      { ip: `${clientSubnet}.250`, name: "CCTV/DVR Controller IP-Cam", tx: txRate * 0.05, rx: rxRate * 0.08, protocol: "RTSP Video Stream", origin: "NOC Monitor Display", state: "Active" },
      { ip: `${clientSubnet}.89`, name: "Winbox Admin Master PC", tx: txRate * 0.03, rx: rxRate * 0.02, protocol: "Mikrotik API (TCP/8291)", origin: "Admin PC Desk #4", state: "Established" },
    ];

    if (stressTestMode) {
      items.unshift({
        ip: `${clientSubnet}.22`,
        name: "💀 DDoS Threat Vector Probe / Stresser",
        tx: txRate * 4.5,
        rx: rxRate * 5.2,
        protocol: "UDP Flood Port 80",
        origin: "External Botnet Block",
        state: "Flooding"
      });
    }

    return items;
  }, [currentStat, activeClient, stressTestMode]);

  const maxPointValue = useMemo(() => {
    let highest = 20; // minimal ceiling
    points.forEach(p => {
      if (p.tx > highest) highest = p.tx;
      if (p.rx > highest) highest = p.rx;
    });
    return highest * 1.15; // 15% margin
  }, [points]);

  // Format dynamic display unit (Mbps or Gbps for SFP+)
  const formatBandwidthUnit = (valueInMbps: number) => {
    if (valueInMbps >= 1000) {
      return `${(valueInMbps / 1000).toFixed(2)} Gbps`;
    }
    return `${valueInMbps.toLocaleString([], { maximumFractionDigits: 1 })} Mbps`;
  };

  // Generate SVG polygon coordinates
  const svgWidth = 500;
  const svgHeight = 160;
  const paddingLeft = 45;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;

  const chartInnerWidth = svgWidth - paddingLeft - paddingRight;
  const chartInnerHeight = svgHeight - paddingTop - paddingBottom;

  const pointsCoordinates = useMemo(() => {
    if (points.length < 2) return { txPath: "", rxPath: "", txPoly: "", rxPoly: "", xs: [] };

    const xs: number[] = [];
    const txYs: number[] = [];
    const rxYs: number[] = [];

    points.forEach((p, index) => {
      const x = paddingLeft + (index / (points.length - 1)) * chartInnerWidth;
      const txY = svgHeight - paddingBottom - (p.tx / maxPointValue) * chartInnerHeight;
      const rxY = svgHeight - paddingBottom - (p.rx / maxPointValue) * chartInnerHeight;

      xs.push(x);
      txYs.push(txY);
      rxYs.push(rxY);
    });

    // Make smooth poly paths
    const txPath = txYs.map((y, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${y}`).join(" ");
    const rxPath = rxYs.map((y, i) => `${i === 0 ? "M" : "L"} ${xs[i]} ${y}`).join(" ");

    // Polygons (for gradient area fills)
    const txPoly = `${txPath} L ${xs[xs.length - 1]} ${svgHeight - paddingBottom} L ${xs[0]} ${svgHeight - paddingBottom} Z`;
    const rxPoly = `${rxPath} L ${xs[xs.length - 1]} ${svgHeight - paddingBottom} L ${xs[0]} ${svgHeight - paddingBottom} Z`;

    return { txPath, rxPath, txPoly, rxPoly, xs };
  }, [points, maxPointValue]);

  // Handle port click notification toast simulator info 
  const handlePortChange = (id: string) => {
    setSelectedPortId(id);
    setStressTestMode(false);
  };

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-md p-5 space-y-4 text-slate-800 dark:text-slate-100" id="live-traffic-monitor-card">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3" id="traffic-monitor-hdr">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl flex items-center justify-center animate-pulse" id="traffic-icon-glow">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
              {activeClient ? (
                <span>
                  🏢 Router Client: <strong className="text-blue-600 dark:text-blue-400">{activeClient.company}</strong> | 💻 Model: <strong className="text-slate-700 dark:text-slate-300">CCR2004-1G-12S+</strong>
                </span>
              ) : clientName ? (
                `Pelanggan: ${clientName}`
              ) : (
                "Monitoring Pusat Core Backbone (Global Link)"
              )}
            </p>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Pause simulation button */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 px-3 text-[10px] font-bold uppercase rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
              isPlaying 
                ? "bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3" /> Pause Live
              </>
            ) : (
              <>
                <Play className="w-3" /> Resume Live
              </>
            )}
          </button>

          {/* Stress simulation button */}
          <button
            type="button"
            onClick={() => setStressTestMode(!stressTestMode)}
            className={`p-2 px-3 text-[10px] font-extrabold uppercase rounded-lg border cursor-pointer transition-all flex items-center gap-1 shadow-xs ${
              stressTestMode 
                ? "bg-rose-600 text-white border-transparent animate-bounce" 
                : "bg-amber-500 hover:bg-amber-600 text-white border-transparent"
            }`}
          >
            <Zap className="w-3" />
            {stressTestMode ? "Stress Active" : "Simulasi Stress"}
          </button>
        </div>
      </div>

      {/* Selector and Warnings */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Router Company Selector: Rendered only if clients list fits */}
        {isAdmin && clients && clients.length > 0 ? (
          <div className="col-span-1 md:col-span-3 space-y-1">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
              🏢 Pilih Router Klien:
            </label>
            <select
              value={selectedClientMonitorId}
              onChange={(e) => {
                setSelectedClientMonitorId(e.target.value);
                setStressTestMode(false);
                setIsAlertDismissed(false);
              }}
              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2 font-bold focus:outline-blue-500 cursor-pointer text-ellipsis overflow-hidden"
              id="router-company-selector"
            >
              <option value="all">🌐 Router Core Backbone (Global)</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  🏢 {c.company} ({c.id})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Interface Switcher Dropdown */}
        <div className={`${isAdmin && clients && clients.length > 0 ? "col-span-1 md:col-span-3" : "col-span-1 md:col-span-6"} space-y-1`}>
          <label className="block text-[10px] font-bold text-slate-505 dark:text-slate-400 uppercase tracking-widest font-mono">
            🔌 INTERFACE MIKROTIK:
          </label>
          <div className="relative">
            <select
              value={selectedPortId}
              onChange={(e) => {
                handlePortChange(e.target.value);
                setIsAlertDismissed(false);
              }}
              className="w-full text-xs bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg p-2 px-3 font-semibold focus:outline-blue-500 cursor-pointer"
              id="traffic-port-selector"
            >
              {INTERFACES.map(inf => (
                <option key={inf.id} value={inf.id}>
                  {inf.name} (Max: {inf.maxSpeed >= 1000 ? `${inf.maxSpeed/1000}Gbps` : `${inf.maxSpeed}Mbps`})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alarm Threshold Setup Input */}
        <div className="col-span-1 md:col-span-3 space-y-1" id="threshold-setup-wrapper">
          <label className="block text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest font-mono flex items-center justify-between">
            <span>🚨 BATAS ALARM:</span>
            <span className="text-red-600 dark:text-red-400 font-extrabold">{alertThresholdMbps} Mbps</span>
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="range"
              min="10"
              max={activeInterface.maxSpeed}
              step="10"
              value={alertThresholdMbps}
              onChange={(e) => {
                setAlertThresholdMbps(Number(e.target.value));
                setIsAlertDismissed(false);
              }}
              className="grow h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              id="alert-threshold-slider"
            />
            <input
              type="number"
              value={alertThresholdMbps}
              onChange={(e) => {
                setAlertThresholdMbps(Math.max(1, Number(e.target.value)));
                setIsAlertDismissed(false);
              }}
              className="w-16 text-[10px] p-1 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded font-extrabold text-right focus:outline-red-500"
              placeholder="Mbps"
            />
          </div>
        </div>

        {/* Live Counters */}
        <div className="col-span-1 md:col-span-3 grid grid-cols-2 gap-2 text-center font-mono">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
            <span className="block text-[8px] text-emerald-600 dark:text-emerald-400 font-bold uppercase flex items-center justify-center gap-0.5">
              <ArrowDown className="w-2" /> TX (Download)
            </span>
            <span className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {formatBandwidthUnit(currentStat.rx)}
            </span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-100 dark:border-blue-900/50">
            <span className="block text-[8px] text-blue-600 dark:text-blue-400 font-bold uppercase flex items-center justify-center gap-0.5">
              <ArrowUp className="w-2" /> RX (Upload)
            </span>
            <span className="text-xs font-bold font-mono text-blue-700 dark:text-blue-300">
              {formatBandwidthUnit(currentStat.tx)}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Threshold Exceeded Heavy Warning Overlay */}
      {(() => {
        const isTxExceeded = currentStat.tx > alertThresholdMbps;
        const isRxExceeded = currentStat.rx > alertThresholdMbps;
        const isExceeded = isTxExceeded || isRxExceeded;

        if (isExceeded && !isAlertDismissed) {
          return (
            <div className="bg-rose-50/90 dark:bg-rose-950/25 border-l-4 border-rose-600 p-3.5 rounded-r-xl flex items-start gap-4 animate-in duration-300 slide-in-from-top-2" id="alert-threshold-heavy">
              <CloudAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="grow space-y-1">
                <h4 className="text-[11px] font-black text-rose-900 dark:text-rose-300 uppercase tracking-wider">
                  🚨 LIVE WARNING ALARM: TRAFIK INTERNET MELEBIHI TOLERANSI REGULER
                </h4>
                <p className="text-[11px] text-rose-700 dark:text-rose-400/95 leading-normal">
                  Rata-rata link pada <strong className="font-extrabold underline">{activeInterface.name}</strong> menembus{" "}
                  <span className="font-mono bg-rose-100 dark:bg-[#3f2127] px-1.5 py-0.5 rounded font-black text-rose-950 dark:text-rose-100">
                    {isRxExceeded ? formatBandwidthUnit(currentStat.rx) : formatBandwidthUnit(currentStat.tx)}
                  </span>{" "}
                  (Melebihi parameter setelan admin: <strong className="font-mono">{alertThresholdMbps} Mbps</strong>).
                </p>
                <div className="flex gap-4 text-[10px] text-slate-500 font-medium">
                  <span>Server Node / Router: {activeClient ? activeClient.company : "Core NOC Backbone"}</span>
                  <span className="text-red-600">Ambang Batas Alarm Terlampaui</span>
                </div>
              </div>
              <button
                onClick={() => setIsAlertDismissed(true)}
                className="text-[10px] font-bold px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg border border-slate-205 shadow-xs cursor-pointer"
              >
                Tutup Sementara
              </button>
            </div>
          );
        }
        return null;
      })()}

      {/* Warning on limits exceeded */}
      {stressTestMode && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-150 p-2.5 rounded-xl flex items-center gap-2 animate-pulse text-xs text-rose-800 dark:text-rose-300">
          <CloudAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>
            <strong>PERINGATAN STRESS TEST:</strong> Trafik menembus kapasitas optimal! Latency SLA Monitoring berisiko terganggu pada loop utama router client.
          </span>
        </div>
      )}

      {/* SVG Real-time Oscilloscope Line Chart (Draw itself manually for React 19 absolute compatibility) */}
      <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-850 relative overflow-hidden" id="traffic-oscilloscope">
        
        {/* Real-time background grids */}
        <div className="absolute top-2.5 right-3.5 bg-slate-200 dark:bg-slate-800 text-[8px] font-mono p-1 rounded font-bold uppercase select-none opacity-80">
          Winbox Live Graph Output
        </div>

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="auto" className="overflow-visible" id="traffic-chart-svg">
          <defs>
            {/* Gradients for fills */}
            <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="rxGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
            </linearGradient>
            <pattern id="dotPattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.5" fill="#94a3b8" opacity="0.3" />
            </pattern>
          </defs>

          {/* Grid backgrounds */}
          <rect x={paddingLeft} y={paddingTop} width={chartInnerWidth} height={chartInnerHeight} fill="url(#dotPattern)" rx="4" />

          {/* Grid lines horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = paddingTop + ratio * chartInnerHeight;
            const value = maxPointValue * (1 - ratio);
            return (
              <g key={index} opacity="0.8">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={svgWidth - paddingRight} 
                  y2={y} 
                  stroke="#cbd5e1" 
                  strokeWidth="0.5" 
                  strokeDasharray="2,3" 
                  className="dark:stroke-slate-800"
                />
                <text 
                  x={paddingLeft - 6} 
                  y={y + 3} 
                  fontSize="8" 
                  textAnchor="end" 
                  fontWeight="bold"
                  fill="#64748b" 
                  className="font-mono dark:fill-slate-450"
                >
                  {value >= 1000 ? `${(value/1000).toFixed(1)}G` : `${Math.round(value)}M`}
                </text>
              </g>
            );
          })}

          {/* Grid Lines Verticals */}
          {pointsCoordinates.xs.map((x, idx) => {
            if (idx % 4 !== 0) return null;
            return (
              <line
                key={`v-${idx}`}
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={svgHeight - paddingBottom}
                stroke="#cbd5e1"
                strokeWidth="0.5"
                strokeDasharray="2,2"
                className="dark:stroke-slate-800"
              />
            );
          })}

          {/* Area paths */}
          {pointsCoordinates.txPoly && (
            <polygon points={pointsCoordinates.txPoly} fill="url(#txGradient)" className="transition-all duration-300" />
          )}
          {pointsCoordinates.rxPoly && (
            <polygon points={pointsCoordinates.rxPoly} fill="url(#rxGradient)" className="transition-all duration-300" />
          )}

          {/* Line paths */}
          {pointsCoordinates.txPath && (
            <path 
              d={pointsCoordinates.txPath} 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="2" 
              strokeLinecap="round" 
              className="transition-all duration-300"
            />
          )}
          {pointsCoordinates.rxPath && (
            <path 
              d={pointsCoordinates.rxPath} 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="2" 
              strokeLinecap="round" 
              className="transition-all duration-300"
            />
          )}

          {/* Tooltip Dot Hover Visual (last points) */}
          {points.length > 0 && (
            <g>
              <circle cx={pointsCoordinates.xs[pointsCoordinates.xs.length - 1]} cy={svgHeight - paddingBottom - (points[points?.length - 1].tx / maxPointValue) * chartInnerHeight} r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <circle cx={pointsCoordinates.xs[pointsCoordinates.xs.length - 1]} cy={svgHeight - paddingBottom - (points[points?.length - 1].rx / maxPointValue) * chartInnerHeight} r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {/* X Axis labels */}
          {points.map((p, idx) => {
            if (idx % 5 !== 0) return null;
            const x = pointsCoordinates.xs[idx];
            return (
              <text
                key={`lbl-${idx}`}
                x={x}
                y={svgHeight - paddingBottom + 13}
                fontSize="7.5"
                textAnchor="middle"
                fontWeight="bold"
                fill="#64748b"
                className="font-mono"
              >
                {p.time}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Diagnostics Panel Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs" id="diagnostics-panel">
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 text-amber-500" /> Beban CPU Router
          </span>
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-100">{cpuLoad}%</span>
            <div className="w-16 h-1 w bg-slate-200 dark:bg-slate-750 rounded-full overflow-hidden">
              <div 
                className={`h-full ${cpuLoad > 60 ? "bg-rose-500" : "bg-emerald-500"}`} 
                style={{ width: `${cpuLoad}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Network className="w-3 text-blue-500" /> TCP Sockets Aktif
          </span>
          <span className="text-sm font-extrabold font-mono text-slate-850 dark:text-slate-100">{activeSockets} Conn</span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Database className="w-3 text-indigo-500" /> Paket Terbuang (Drop)
          </span>
          <span className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
            {stressTestMode ? "0.08%" : "0.00%"}
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
          <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Radio className="w-3 text-purple-500" /> Ping Jitter SLA
          </span>
          <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-slate-100">
            {stressTestMode ? "5.4 ms" : "0.8 ms"}
          </span>
        </div>
      </div>

    </div>
  );
}
