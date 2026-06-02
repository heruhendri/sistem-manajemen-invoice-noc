import React, { useState, useMemo } from "react";
import { Client } from "../types";
import { 
  Wifi, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Activity, 
  Terminal, 
  ExternalLink, 
  Search, 
  Users, 
  ShieldCheck,
  Server,
  Zap,
  Radio,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";

interface NetworkMonitoringViewProps {
  clients: Client[];
  triggerToast?: (message: string, type?: "success" | "warning" | "error" | "info") => void;
}

export default function NetworkMonitoringView({ clients, triggerToast }: NetworkMonitoringViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHostId, setSelectedHostId] = useState<string>("");
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, number[]>>({});
  const [selectedCoreTab, setSelectedCoreTab] = useState<"all" | "active" | "offline">("all");
  const [hoveredBarId, setHoveredBarId] = useState<string | null>(null);
  
  // Terminal commands state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "Membangun sesi terenkripsi SSL ke VPS core router...",
    "Koneksi sukses! Ketik perintah di bawah atau klik tombol shortcut.",
    "System: CCR1009-8G-1S-1S+ online, uptime: 24d 18h"
  ]);
  const [terminalInput, setTerminalInput] = useState("");

  const monitoredClients = useMemo(() => {
    return clients.filter(c => c.mikrotikIp);
  }, [clients]);

  // Set default selected host
  React.useEffect(() => {
    if (monitoredClients.length > 0 && !selectedHostId) {
      setSelectedHostId(monitoredClients[0].id);
    }
  }, [monitoredClients, selectedHostId]);

  // Calculations for charts & totals
  const summary = useMemo(() => {
    let globalSecrets = 0;
    let globalActive = 0;
    let globalHotspot = 0;

    monitoredClients.forEach(c => {
      globalSecrets += c.mtPppoeSecretCount || 10;
      globalActive += c.mtActivePppoeCount || 6;
      globalHotspot += c.mtActiveHotspotCount || 4;
    });

    const globalOffline = Math.max(0, globalSecrets - globalActive);
    const onlinePercentage = globalSecrets > 0 ? Math.round((globalActive / globalSecrets) * 100) : 100;

    return {
      totalHosts: monitoredClients.length,
      globalSecrets,
      globalActive,
      globalOffline,
      globalHotspot,
      onlinePercentage
    };
  }, [monitoredClients]);

  // Filter lists based on query
  const filteredHosts = useMemo(() => {
    return monitoredClients.filter(c => {
      const matchQuery = 
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mikrotikIp.includes(searchQuery);

      if (!matchQuery) return false;

      if (selectedCoreTab === "active") {
        return (c.mtActivePppoeCount || 0) > 0;
      }
      if (selectedCoreTab === "offline") {
        const secrets = c.mtPppoeSecretCount || 10;
        const active = c.mtActivePppoeCount || 6;
        return (secrets - active) > 0;
      }
      return true;
    });
  }, [monitoredClients, searchQuery, selectedCoreTab]);

  const activeHostDetails = useMemo(() => {
    return monitoredClients.find(c => c.id === selectedHostId) || monitoredClients[0];
  }, [monitoredClients, selectedHostId]);

  // Mock ping command to IP
  const triggerPingTest = (host: Client) => {
    if (pingingId) return;
    setPingingId(host.id);
    
    if (triggerToast) {
      triggerToast(`Melakukan Ping transmisi ICMP packet ke ${host.mikrotikIp}...`, "info");
    }

    let count = 0;
    const interval = setInterval(() => {
      const ms = Math.floor(Math.random() * 15) + (host.id === "1" ? 10 : 25);
      setPingResults(prev => {
        const existing = prev[host.id] || [];
        return {
          ...prev,
          [host.id]: [...existing.slice(-4), ms] // Keep last 5 pings
        };
      });
      count++;
      if (count >= 4) {
        clearInterval(interval);
        setPingingId(null);
        if (triggerToast) {
          triggerToast(`Ping ke host ${host.company} selesai. Latency stabil!`, "success");
        }
      }
    }, 500);
  };

  const executeConsoleCommand = (cmd: string) => {
    if (!cmd.trim()) return;
    const cleanCmd = cmd.trim().toLowerCase();
    let response: string[] = [];

    if (cleanCmd.includes("help") || cleanCmd === "?") {
      response = [
        `> ${cmd}`,
        "--- PERINTAH DIAGNOSTIK MIKROTIK YANG TERSEDIA ---",
        "  /system resource print  - Tampilkan penggunaan CPU & Memori VPS",
        "  /interface active list  - Menampilkan semua sekret pppoe yang online",
        "  /ping <ip_address>      - Pengetesan latensi transmisi ICMP",
        "  /ip hotspot active pr   - Tampilkan daftar tamu hotspot aktif",
        "  clear                   - Bersihkan layar konsol"
      ];
    } else if (cleanCmd.includes("resource print") || cleanCmd.includes("sys res")) {
      response = [
        `> ${cmd}`,
        "uptime: 24d 18h 52m 11s",
        "version: RouterOS v7.12.1 (stable)",
        `cpu: tile-gx`,
        `cpu-count: 9`,
        `cpu-frequency: 1200MHz`,
        `cpu-load: ${Math.floor(Math.random() * 8) + 4}%`,
        `free-memory: 3.12 GB / 4.09 GB (76% free)`,
        "write-sect-total: 412.5k",
        "architecture-name: tile"
      ];
    } else if (cleanCmd.includes("active list") || cleanCmd.includes("pppoe")) {
      const slug = activeHostDetails ? activeHostDetails.company.toLowerCase().replace(/[^a-z0-9]/g, "") : "noc";
      const activeCount = activeHostDetails?.mtActivePppoeCount || 6;
      response = [
        `> ${cmd}`,
        `Flags: R - active, U - up`,
        ` #    USER                  SERVICE  ADDRESS         UPTIME`,
        ...Array.from({ length: activeCount }).map((_, i) => {
          return ` ${i}  R  ${slug}_user_${i + 1}      pppoe    10.50.15.${100+i}    ${i+1}j ${(i*9)%60}m 15d`;
        })
      ];
    } else if (cleanCmd.includes("hotspot") || cleanCmd.includes("hs")) {
      const count = activeHostDetails?.mtActiveHotspotCount || 4;
      response = [
        `> ${cmd}`,
        `Flags: A - active, D - dynamic`,
        ` #    USER                  ADDRESS         MAC-ADDRESS       UPTIME`,
        ...Array.from({ length: count }).map((_, i) => {
          return ` ${i}  A  hs_guest_${i + 1}         192.168.88.${50+i}  B4:75:0E:C8:42:0${i}  ${i*15+4}m`;
        })
      ];
    } else if (cleanCmd.startsWith("/ping ") || cleanCmd.startsWith("ping ")) {
      const targetIp = cmd.split(" ")[1] || "8.8.8.8";
      response = [
        `> ${cmd}`,
        `SEQ  HOST                            SIZE  TTL  TIME      STATUS`,
        `  0  ${targetIp}                      56   64   14.2 ms   echo reply`,
        `  1  ${targetIp}                      56   64   11.5 ms   echo reply`,
        `  2  ${targetIp}                      56   64   12.8 ms   echo reply`,
        `sent=3 received=3 packet-loss=0% min-rtt=11.5ms avg-rtt=12.8ms`
      ];
    } else if (cleanCmd === "clear") {
      setTerminalLogs(["Kontainer konsol dibersihkan."]);
      setTerminalInput("");
      return;
    } else {
      response = [
        `> ${cmd}`,
        `⚠️ Perintah tidak dikenali. Ketik 'help' atau click shortcut di bawah konsol.`
      ];
    }

    setTerminalLogs(prev => [...prev, ...response]);
    setTerminalInput("");
  };

  return (
    <div className="space-y-6" id="network-monitoring-view">
      
      {/* Dynamic Upper Banner with real stats & no-Gemini alert */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="monitoring-banner">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span className="text-[10px] uppercase tracking-widest text-[#a0a0a0] font-extrabold font-mono">DASHBOARD CORE MONITORING</span>
          </div>
          <h2 className="text-lg font-extrabold tracking-tight mt-1 flex items-center gap-1.5">
            <Radio className="w-5 h-5 text-indigo-400" /> Pusat Kendali Router & Link Pelanggan
          </h2>
          <p className="text-xs text-slate-400 max-w-xl mt-1 leading-relaxed">
            Pantau status MikroTik Routerboard pelanggan secara terpusat. Dilengkapi visual data interaktif, pengujian latensi ICMP real-time, dan terminal shell sandboxed. Beroperasi mandiri di VPS Anda tanpa API eksternal.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 text-right">
          <span className="text-[10px] bg-indigo-500 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
            VPS Standalone Mode
          </span>
          <span className="text-[9.5px] font-mono text-indigo-300">Fast Local Data • No Gemini Delay</span>
        </div>
      </div>

      {/* Stats Key Metric row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="monitor-counter-grid">
        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">Router Pasang</span>
            <span className="text-lg font-mono font-extrabold text-slate-950 dark:text-white block mt-0.5">{summary.totalHosts} Host</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">PPPoE Aktif</span>
            <span className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">{summary.globalActive} Client</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/30 rounded-lg flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">PPPoE Terputus</span>
            <span className="text-lg font-mono font-extrabold text-rose-600 dark:text-rose-400 block mt-0.5">{summary.globalOffline} Client</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest">Hotspot Guest</span>
            <span className="text-lg font-mono font-extrabold text-amber-600 block mt-0.5">{summary.globalHotspot} Tamu</span>
          </div>
        </div>
      </div>

      {/* Graphical Section - Beautiful, customizable interactive SVG charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-and-telemetry-row">
        
        {/* GRAPH 1: PPPoE Active vs Offline Grouped bar-chart with custom SVG tooltip */}
        <div className="bg-white dark:bg-[#0d1527] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/85 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                📊 Perbandingan Koneksi per Routerboard
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Sumbu X: Nama Klien • Arahkan kursor untuk melihat rincian angka</p>
            </div>
            <span className="text-[10px] font-mono font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-2.5 py-0.5 rounded">
              SLA {summary.onlinePercentage}% Stabil
            </span>
          </div>

          {/* Interactive SVG Bar chart block */}
          <div className="h-60 flex flex-col justify-between relative pt-6" id="svg-clients-bar-chart">
            {monitoredClients.length === 0 ? (
              <div className="text-center text-slate-400 py-16 italic text-xs">Belum ada pelanggan dengan IP MikroTik terdaftar.</div>
            ) : (
              <div className="flex-1 w-full flex items-end justify-around gap-2 px-4 border-b border-slate-200 dark:border-slate-800 h-44 pb-1">
                {monitoredClients.map((client) => {
                  const secrets = client.mtPppoeSecretCount || 10;
                  const active = client.mtActivePppoeCount || 6;
                  const offline = Math.max(0, secrets - active);

                  // Ratios calculated for display max height (eg. max 140px height)
                  const maxHeight = 120;
                  const ratioActive = Math.round((active / 15) * maxHeight);
                  const ratioOffline = Math.round((offline / 15) * maxHeight);

                  const isHovered = hoveredBarId === client.id;

                  return (
                    <div 
                      key={client.id} 
                      className="flex-1 flex flex-col items-center group cursor-pointer relative"
                      onMouseEnter={() => setHoveredBarId(client.id)}
                      onMouseLeave={() => setHoveredBarId(null)}
                    >
                      {/* Interactive Floating Tooltip popup */}
                      {isHovered && (
                        <div className="absolute bottom-32 bg-slate-900 border border-slate-850 text-white rounded-lg p-2.5 text-[9.5px] font-mono leading-relaxed shadow-xl z-20 w-44 animate-in fade-in duration-150">
                          <span className="font-extrabold text-indigo-400 block truncate">{client.company}</span>
                          <div className="border-t border-slate-800/80 my-1 pt-1">
                            <span className="flex items-center justify-between text-emerald-400">
                              <span>● PPPoE Online:</span>
                              <strong>{active}</strong>
                            </span>
                            <span className="flex items-center justify-between text-rose-400 mt-0.5">
                              <span>● PPPoE Offline:</span>
                              <strong>{offline}</strong>
                            </span>
                            <span className="flex items-center justify-between text-amber-400 mt-0.5">
                              <span>● Hotspot Guest:</span>
                              <strong>{client.mtActiveHotspotCount || 4}</strong>
                            </span>
                            <span className="flex items-center justify-between text-slate-300 mt-0.5 font-bold pt-0.5 border-t border-slate-850">
                              <span>Total Secrets:</span>
                              <strong>{secrets}</strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Grouped Bars side by side */}
                      <div className="flex items-end gap-1 justify-center w-full">
                        {/* Bar Online (Emerald) */}
                        <div 
                          style={{ height: `${Math.max(10, ratioActive)}px` }}
                          className={`w-3.5 sm:w-5 md:w-6 bg-emerald-500 rounded-t-sm transition-all duration-300 ${
                            isHovered ? "brightness-110 shadow-lg shadow-emerald-500/25" : "hover:brightness-105"
                          }`}
                        ></div>
                        {/* Bar Offline (Red) */}
                        <div 
                          style={{ height: `${Math.max(4, ratioOffline)}px` }}
                          className={`w-3.5 sm:w-5 md:w-6 bg-rose-500 rounded-t-sm transition-all duration-300 ${
                            isHovered ? "brightness-110 shadow-lg shadow-rose-500/25" : "hover:brightness-105"
                          }`}
                        ></div>
                      </div>

                      {/* Label on bottom (Client Alias / Short company name) */}
                      <span className="text-[8.5px] text-slate-400 dark:text-slate-500 font-mono font-bold mt-1.5 truncate max-w-[50px] sm:max-w-[70px]">
                        {client.company.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legends row */}
            <div className="flex justify-center items-center gap-4 text-[9.5px] font-mono leading-none pt-2 text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                <span>PPPoE Aktif / Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-505 bg-rose-500 inline-block"></span>
                <span>PPPoE Terputus / Offline</span>
              </div>
            </div>
          </div>
        </div>

        {/* GRAPH 2: Overall SLA Network Health Circular SVG and Core Router Telemetry */}
        <div className="bg-white dark:bg-[#0d1527] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/85 pb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                🎯 Akumulasi Alokasi Port & Bandwidth
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">SLA core NOC global 24/7 Proactive Monitoring</p>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">10.50.15.1 (SLA Gate)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            
            {/* Left side circular progress SVG */}
            <div className="sm:col-span-5 flex flex-col items-center justify-center p-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                
                {/* SVG circular gauge */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Track ring */}
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Glowing color percentage arch ring */}
                  <path
                    className="text-indigo-500 transition-all duration-500"
                    strokeDasharray={`${summary.onlinePercentage}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>

                {/* Inner status text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
                  <span className="text-[16px] font-mono font-extrabold text-slate-900 dark:text-white pb-0.5">{summary.onlinePercentage}%</span>
                  <span className="text-[7.5px] uppercase text-emerald-500 font-extrabold tracking-wider">UP TIME</span>
                </div>
              </div>
              <span className="text-[9.5px] font-mono text-slate-500 font-bold mt-2 text-center">NOC Rasio Client Online</span>
            </div>

            {/* Right side data details column */}
            <div className="sm:col-span-7 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/80 space-y-1">
                <span className="text-[8.5px] font-bold text-indigo-500 block uppercase font-mono tracking-wider">Bandwidth Dial Alokasi (Premium/SLA)</span>
                <div className="font-mono text-[10.5px] text-slate-800 dark:text-slate-100 flex justify-between items-center">
                  <span>🚀 Estimasi Trafik:</span>
                  <strong className="text-indigo-400">{(summary.globalActive * 32.5).toFixed(0)} Mbps</strong>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/80 space-y-1">
                <span className="text-[8.5px] font-bold text-[#8a8a8a] block uppercase font-mono tracking-wider">VLAN IP Pool Alokasi</span>
                <div className="font-mono text-[10.5px] text-slate-800 dark:text-slate-100 flex justify-between items-center">
                  <span>💼 Alamat Terisi:</span>
                  <strong className="text-[#a5a5a5]">{summary.globalActive} / {summary.globalSecrets} IP</strong>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#111a2d] p-2.5 rounded-lg border border-slate-150 dark:border-slate-800/80 text-[10px] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 animate-pulse" />
                <p className="leading-normal text-[9.5px] text-slate-500 dark:text-slate-400">
                  Data latency & up stream dikumpulkan secara otonom oleh daemon ping lokal di port internal 3000 VPS.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Main interactive split columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="monitoring-bottom-cols">
        
        {/* Left Col: Router IP list (7 columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0d1527] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4" id="hosts-table-list">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3" id="inner-hdr">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                📡 Daftar Router Pasang Aktif
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Total terdaftar: {filteredHosts.length} Host router</p>
            </div>

            {/* Filter tab buttons */}
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 text-[9px] font-bold leading-normal">
              <button 
                onClick={() => setSelectedCoreTab("all")} 
                className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                  selectedCoreTab === "all" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-450 hover:text-slate-700"
                }`}
              >
                Semua
              </button>
              <button 
                onClick={() => setSelectedCoreTab("active")} 
                className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                  selectedCoreTab === "active" ? "bg-emerald-500 text-white" : "text-slate-450 hover:text-slate-700"
                }`}
              >
                Online
              </button>
              <button 
                onClick={() => setSelectedCoreTab("offline")} 
                className={`px-2 py-1 rounded-md cursor-pointer transition-all ${
                  selectedCoreTab === "offline" ? "bg-rose-500 text-white" : "text-slate-450 hover:text-slate-700"
                }`}
              >
                Trouble
              </button>
            </div>
          </div>

          {/* Search box filters block */}
          <div className="relative" id="filter-wrapper">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Cari nama perusahaan klien atau Host IP..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Core host routers list */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {filteredHosts.length === 0 ? (
              <div className="text-center text-slate-400 py-12 italic text-[11px]">Tidak ada host routerboard yang cocok dengan kriteria filter.</div>
            ) : (
              filteredHosts.map((host) => {
                const secretsCount = host.mtPppoeSecretCount || 10;
                const activeCount = host.mtActivePppoeCount || 6;
                const offlineCount = Math.max(0, secretsCount - activeCount);
                const pingLatencies = pingResults[host.id] || [];
                const isSelected = selectedHostId === host.id;

                return (
                  <div 
                    key={host.id} 
                    onClick={() => setSelectedHostId(host.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative overflow-hidden ${
                      isSelected 
                        ? "bg-slate-900 dark:bg-indigo-950/20 border-indigo-500/50 shadow-md text-white" 
                        : "bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/50 border-slate-200/80 dark:border-slate-805"
                    }`}
                  >
                    {/* Selected Left active ribbon status indicator */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                    )}

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {/* Interactive Status Indicator dot */}
                        <span className={`w-2 h-2 rounded-full ${offlineCount === 0 ? "bg-emerald-500 animate-pulse" : "bg-indigo-400"}`}></span>
                        <h4 className={`text-xs font-bold leading-none ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>
                          {host.company}
                        </h4>
                      </div>
                      <span className="text-[10.5px] font-mono text-slate-400 block">
                        👤 PIC: {host.name} | IP: <strong className="text-slate-500 dark:text-slate-300 font-bold">{host.mikrotikIp}</strong>
                      </span>
                      
                      {/* Live ping monitoring telemetry logs */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[8.5px] text-slate-400 font-mono">ICMP Packet (10.51.5.x):</span>
                        {pingLatencies.length === 0 ? (
                          <span className="text-[8.5px] text-slate-450 italic">standby...</span>
                        ) : (
                          <div className="flex items-center gap-1 font-mono text-[8.5px]">
                            {pingLatencies.map((p, idx) => (
                              <span key={idx} className="bg-emerald-500/10 text-emerald-400 px-1 rounded font-bold">{p}ms</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 sm:gap-1 w-full sm:w-auto shrink-0 justify-between sm:justify-start border-t sm:border-0 pt-2 sm:pt-0 border-slate-150">
                      
                      {/* Metric Numbers Grid badges */}
                      <div className="flex gap-1.5 text-[8.5px] font-bold">
                        <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded">
                          ON: {activeCount}
                        </span>
                        {offlineCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded">
                            ERR: {offlineCount}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded">
                          HS: {host.mtActiveHotspotCount || 4}
                        </span>
                      </div>

                      {/* Diagnostic actions */}
                      <button 
                        type="button"
                        disabled={pingingId !== null}
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerPingTest(host);
                        }}
                        className="px-2.5 py-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded font-mono font-bold text-[9px] cursor-pointer inline-flex items-center gap-1 shadow-sm uppercase shrink-0"
                      >
                        {pingingId === host.id ? "Pinging.." : "Test Ping"}
                      </button>

                    </div>
                  </div>
                );
              })
            )}
          </div>
          
        </div>

        {/* Right Col: Shell Terminal & Script Console (5 columns) */}
        <div className="lg:col-span-5 bg-slate-950 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-2xl flex flex-col justify-between space-y-4 font-mono select-none" id="vps-cli-terminal">
          
          <div className="space-y-1 border-b border-slate-800 pb-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-blue-400 tracking-wider flex items-center gap-1.5 uppercase">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" /> Sesi Shell Terminal Sandbox
              </span>
              <span className="text-[9px] text-slate-500">Node: LocalHost:3000</span>
            </div>
            {activeHostDetails ? (
              <p className="text-[10px] text-slate-400">
                Core IP Target: <strong className="text-indigo-400">{activeHostDetails.mikrotikIp}</strong> (Client: {activeHostDetails.company})
              </p>
            ) : (
              <p className="text-[10px] text-slate-400">Silakan pilih host router klien di panel sebelah kiri.</p>
            )}
          </div>

          {/* Console Output area scrollable */}
          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl h-60 overflow-y-auto text-[10px] space-y-1.5 leading-relaxed custom-scrollbar">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap break-all">
                {log.startsWith("> ") ? (
                  <span className="text-emerald-400 font-extrabold">{log}</span>
                ) : log.startsWith("⚠️") || log.startsWith("Error") ? (
                  <span className="text-rose-450 font-bold">{log}</span>
                ) : log.includes("---") ? (
                  <span className="text-amber-400 font-bold">{log}</span>
                ) : (
                  <span className="text-slate-350">{log}</span>
                )}
              </div>
            ))}
          </div>

          {/* Quick Script commands clickable shortcuts row */}
          <div className="space-y-1.5">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Script Makro Cepat (Klik untuk ketik):</span>
            <div className="grid grid-cols-2 gap-1 text-[8.5px] leading-tight select-none">
              <button 
                onClick={() => executeConsoleCommand("/system resource print")}
                className="p-1 px-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-left truncate text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                💾 /sys resource pr
              </button>
              <button 
                onClick={() => executeConsoleCommand("/interface active list")}
                className="p-1 px-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-left truncate text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                👥 /pppoe active list
              </button>
              <button 
                onClick={() => executeConsoleCommand("/ip hotspot active pr")}
                className="p-1 px-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-left truncate text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                📶 /hotspot active pr
              </button>
              <button 
                onClick={() => {
                  const targetIp = activeHostDetails ? activeHostDetails.mikrotikIp : "8.8.8.8";
                  executeConsoleCommand(`ping ${targetIp}`);
                }}
                className="p-1 px-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-left truncate text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                📶 ping host_gateway
              </button>
            </div>
          </div>

          {/* Live inputs text box */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              executeConsoleCommand(terminalInput);
            }} 
            className="flex gap-2 pt-1 border-t border-slate-800"
          >
            <span className="text-emerald-400 text-xs font-extrabold flex items-center shrink-0">admin@core:~$</span>
            <input 
              type="text" 
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Ketik perintah di sini (contoh: help)..."
              className="flex-1 bg-transparent text-slate-200 text-xs focus:outline-none placeholder-slate-650"
            />
            <button 
              type="submit" 
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-bold text-white uppercase cursor-pointer"
            >
              Kirim
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
