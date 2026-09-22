import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
  Activity, AlertTriangle, BarChart2, Cpu, Settings, Clock,
  Bell, FileText, Home, Wifi, Power, Package, Wrench,
  CheckCircle, XCircle, AlertCircle, RefreshCw, ChevronRight,
  TrendingUp, Download, Filter, Calendar, X, ArrowUpRight, ArrowDownRight,
  Radio, Zap, Gauge, Eye,
} from "lucide-react";

/* ─────────────── Types ─────────────── */
type MachineStatus = "running" | "stopped" | "alarm" | "maintenance";
type View = "dashboard" | "machines" | "machine-detail" | "reports" | "alerts";

interface DI { label: string; state: boolean }
interface DO_ { label: string; state: boolean }

interface Machine {
  id: string; name: string; type: "inyeccion" | "ensamble" | "enlainadora" | "otro";
  adam6050: string; status: MachineStatus;
  oee: number; availability: number; performance: number; quality: number;
  uptime: number; downtime: number;
  partsProduced: number; partsTarget: number; defects: number;
  lastEvent: string; lastEventTime: string;
  di: DI[]; do_: DO_[];
  downtimeLog: { time: string; duration: number; reason: string }[];
}

interface Alert {
  id: string; machineId: string; machineName: string;
  type: "alarm" | "warning" | "info";
  message: string; time: string; acknowledged: boolean;
}

/* ─────────────── Mock Data ─────────────── */
const makeDI = (overrides: Partial<DI>[] = []): DI[] =>
  [
    "Puerta cerrada", "Molde cerrado", "Sensor presión", "Fin de ciclo",
    "Emergencia", "Temp OK", "Material OK", "Eyector avance",
    "Eyector retorno", "Robot lista", "Cinta OK", "Reset",
  ].map((label, i) => ({ label, state: overrides[i]?.state ?? Math.random() > 0.4 }));

const makeDO = (overrides: Partial<DO_>[] = []): DO_[] =>
  [
    "Motor principal", "Bomba hidráulica", "Calefactor zona 1",
    "Calefactor zona 2", "Señal robot", "Alarma sonora",
  ].map((label, i) => ({ label, state: overrides[i]?.state ?? Math.random() > 0.5 }));

const MACHINES: Machine[] = [
  {
    id: "INY-01", name: "Inyección #01", type: "inyeccion",
    adam6050: "192.168.1.110", status: "running",
    oee: 84.2, availability: 92.5, performance: 95.1, quality: 95.8,
    uptime: 412, downtime: 28, partsProduced: 3840, partsTarget: 4200, defects: 18,
    lastEvent: "Inicio de ciclo", lastEventTime: "14:32:11",
    di: makeDI([{state:true},{state:true},{state:true},{state:false},{state:false},{state:true},{state:true},{state:false},{state:true},{state:true},{state:true},{state:false}]),
    do_: makeDO([{state:true},{state:true},{state:true},{state:true},{state:false},{state:false}]),
    downtimeLog: [
      { time: "07:15", duration: 12, reason: "Cambio de molde" },
      { time: "10:44", duration: 8, reason: "Ajuste de material" },
      { time: "13:02", duration: 8, reason: "Mantenimiento preventivo" },
    ],
  },
  {
    id: "INY-02", name: "Inyección #02", type: "inyeccion",
    adam6050: "192.168.1.111", status: "alarm",
    oee: 61.3, availability: 78.0, performance: 88.2, quality: 89.0,
    uptime: 320, downtime: 120, partsProduced: 2700, partsTarget: 4000, defects: 54,
    lastEvent: "ALARMA: Temp. zona 2 alta", lastEventTime: "14:29:05",
    di: makeDI([{state:true},{state:false},{state:false},{state:false},{state:true},{state:false},{state:true},{state:false},{state:false},{state:false},{state:true},{state:true}]),
    do_: makeDO([{state:false},{state:true},{state:false},{state:false},{state:false},{state:true}]),
    downtimeLog: [
      { time: "06:30", duration: 45, reason: "Falla eléctrica" },
      { time: "11:15", duration: 35, reason: "Sobrecalentamiento" },
      { time: "14:28", duration: 40, reason: "Alarma activa" },
    ],
  },
  {
    id: "ENS-01", name: "Ensamble #01", type: "ensamble",
    adam6050: "192.168.1.112", status: "running",
    oee: 91.7, availability: 97.3, performance: 96.2, quality: 97.9,
    uptime: 435, downtime: 5, partsProduced: 5120, partsTarget: 5400, defects: 12,
    lastEvent: "Ciclo completado", lastEventTime: "14:33:02",
    di: makeDI(), do_: makeDO(),
    downtimeLog: [
      { time: "09:10", duration: 5, reason: "Abastecimiento de componentes" },
    ],
  },
  {
    id: "ENS-02", name: "Ensamble #02", type: "ensamble",
    adam6050: "192.168.1.113", status: "maintenance",
    oee: 0, availability: 0, performance: 0, quality: 0,
    uptime: 0, downtime: 440, partsProduced: 0, partsTarget: 4800, defects: 0,
    lastEvent: "Mantenimiento programado", lastEventTime: "06:00:00",
    di: makeDI(Array(12).fill({state: false})),
    do_: makeDO(Array(6).fill({state: false})),
    downtimeLog: [
      { time: "06:00", duration: 440, reason: "Mantenimiento programado" },
    ],
  },
  {
    id: "ENL-01", name: "Enlainadora #01", type: "enlainadora",
    adam6050: "192.168.1.114", status: "running",
    oee: 79.5, availability: 88.4, performance: 91.2, quality: 98.6,
    uptime: 395, downtime: 45, partsProduced: 8740, partsTarget: 9600, defects: 31,
    lastEvent: "Rollo en proceso", lastEventTime: "14:31:44",
    di: makeDI(), do_: makeDO(),
    downtimeLog: [
      { time: "08:20", duration: 18, reason: "Cambio de rollo" },
      { time: "11:40", duration: 15, reason: "Ajuste de tensión" },
      { time: "13:55", duration: 12, reason: "Limpieza de cabezal" },
    ],
  },
  {
    id: "ENL-02", name: "Enlainadora #02", type: "enlainadora",
    adam6050: "192.168.1.115", status: "stopped",
    oee: 0, availability: 42.0, performance: 0, quality: 0,
    uptime: 188, downtime: 252, partsProduced: 3100, partsTarget: 9200, defects: 8,
    lastEvent: "Paro por operador", lastEventTime: "11:18:33",
    di: makeDI(Array(12).fill({state: false})),
    do_: makeDO(Array(6).fill({state: false})),
    downtimeLog: [
      { time: "07:00", duration: 90, reason: "Sin material" },
      { time: "11:18", duration: 162, reason: "Paro operador" },
    ],
  },
];

const INITIAL_ALERTS: Alert[] = [
  { id: "A001", machineId: "INY-02", machineName: "Inyección #02", type: "alarm", message: "Temperatura zona 2 excede límite: 245°C (máx 230°C)", time: "14:29:05", acknowledged: false },
  { id: "A002", machineId: "ENL-02", machineName: "Enlainadora #02", type: "warning", message: "Máquina detenida por operador — tiempo muerto acumulado: 162 min", time: "11:18:33", acknowledged: false },
  { id: "A003", machineId: "INY-01", machineName: "Inyección #01", type: "info", message: "Eficiencia por debajo del objetivo (84.2% vs 90%)", time: "13:00:00", acknowledged: true },
  { id: "A004", machineId: "ENS-02", machineName: "Ensamble #02", type: "info", message: "Mantenimiento programado en progreso — estimado 18:00", time: "06:00:00", acknowledged: true },
];

const productionTrend = [
  { hora: "06:00", real: 820, objetivo: 900 },
  { hora: "07:00", real: 890, objetivo: 900 },
  { hora: "08:00", real: 760, objetivo: 900 },
  { hora: "09:00", real: 910, objetivo: 900 },
  { hora: "10:00", real: 880, objetivo: 900 },
  { hora: "11:00", real: 740, objetivo: 900 },
  { hora: "12:00", real: 850, objetivo: 900 },
  { hora: "13:00", real: 930, objetivo: 900 },
  { hora: "14:00", real: 870, objetivo: 900 },
];

const oeeHistory = [
  { dia: "Lun", INY01: 88, INY02: 72, ENS01: 93, ENL01: 81 },
  { dia: "Mar", INY01: 85, INY02: 68, ENS01: 91, ENL01: 79 },
  { dia: "Mié", INY01: 82, INY02: 64, ENS01: 94, ENL01: 83 },
  { dia: "Jue", INY01: 87, INY02: 70, ENS01: 92, ENL01: 77 },
  { dia: "Vie", INY01: 84, INY02: 61, ENS01: 92, ENL01: 80 },
];

const downtimeByReason = [
  { name: "Cambio de molde/rollo", value: 45, color: "#3B82F6" },
  { name: "Falla mecánica", value: 28, color: "#EF4444" },
  { name: "Sin material", value: 18, color: "#F59E0B" },
  { name: "Mantenimiento", value: 22, color: "#A855F7" },
  { name: "Paro operador", value: 12, color: "#6B7A8D" },
];

/* ─────────────── Helpers ─────────────── */
const STATUS_COLOR: Record<MachineStatus, string> = {
  running: "#22C55E",
  stopped: "#F59E0B",
  alarm: "#EF4444",
  maintenance: "#3B82F6",
};
const STATUS_LABEL: Record<MachineStatus, string> = {
  running: "En operación",
  stopped: "Detenida",
  alarm: "ALARMA",
  maintenance: "Mantenimiento",
};
const TYPE_LABEL: Record<Machine["type"], string> = {
  inyeccion: "Inyección",
  ensamble: "Ensamble",
  enlainadora: "Enlainadora",
  otro: "Otro",
};

function useDateTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

/* ─────────────── Sub-components ─────────────── */

function OEERing({ value, size = 72, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = value >= 85 ? "#22C55E" : value >= 65 ? "#F59E0B" : "#EF4444";
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

function StatusDot({ status }: { status: MachineStatus }) {
  return (
    <span className="relative flex items-center gap-1.5">
      {status === "running" && (
        <span className="absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75 animate-ping"
          style={{ backgroundColor: STATUS_COLOR[status] }} />
      )}
      <span className="inline-flex h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: STATUS_COLOR[status] }} />
    </span>
  );
}

function KpiCard({ label, value, unit, sub, trend }: {
  label: string; value: string | number; unit?: string; sub?: string; trend?: "up" | "down" | null;
}) {
  return (
    <div className="bg-card border border-border rounded p-5 flex flex-col gap-3">
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{label}</span>
      <div className="flex items-end gap-1.5">
        <span className="font-mono text-3xl font-bold text-foreground leading-none">{value}</span>
        {unit && <span className="text-muted-foreground text-sm mb-0.5">{unit}</span>}
        {trend && (
          <span className={`ml-auto mb-0.5 flex items-center gap-0.5 text-xs font-mono ${trend === "up" ? "text-green-400" : "text-red-400"}`}>
            {trend === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          </span>
        )}
      </div>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function MachineCard({ machine, onClick }: { machine: Machine; onClick: () => void }) {
  const oeeColor = machine.oee >= 85 ? "#22C55E" : machine.oee >= 65 ? "#F59E0B" : machine.oee > 0 ? "#EF4444" : "#6B7A8D";
  return (
    <button
      onClick={onClick}
      className="bg-card border border-border rounded p-4 text-left hover:border-primary/40 hover:bg-secondary/40 transition-all duration-150 group w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <StatusDot status={machine.status} />
            <span className="text-xs font-mono text-muted-foreground">{machine.id}</span>
          </div>
          <h3 className="font-semibold text-sm text-foreground">{machine.name}</h3>
          <span className="text-xs text-muted-foreground">{TYPE_LABEL[machine.type]}</span>
        </div>
        <div className="relative" style={{ width: 52, height: 52 }}>
          <OEERing value={machine.oee} size={52} stroke={5} />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold" style={{ color: oeeColor }}>
            {machine.oee > 0 ? `${machine.oee.toFixed(0)}%` : "—"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { l: "DISP", v: machine.availability },
          { l: "REND", v: machine.performance },
          { l: "CAL", v: machine.quality },
        ].map(({ l, v }) => (
          <div key={l} className="bg-muted/60 rounded p-2">
            <div className="text-[10px] text-muted-foreground mb-1">{l}</div>
            <div className="font-mono text-xs font-bold text-foreground">
              {v > 0 ? `${v.toFixed(1)}%` : "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground font-mono">
          <Package size={11} />
          <span>{machine.partsProduced.toLocaleString()} / {machine.partsTarget.toLocaleString()} pzs</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="font-mono text-[10px] truncate max-w-[100px]">{machine.lastEventTime}</span>
          <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: STATUS_COLOR[machine.status] }}>
          <span>●</span>
          <span>{STATUS_LABEL[machine.status]}</span>
          {machine.status === "alarm" && <AlertTriangle size={10} />}
        </div>
      </div>
    </button>
  );
}

/* ─────────────── Views ─────────────── */

function DashboardView({ machines, alerts, onSelectMachine }: {
  machines: Machine[]; alerts: Alert[]; onSelectMachine: (m: Machine) => void;
}) {
  const now = useDateTime();
  const running = machines.filter(m => m.status === "running").length;
  const alarmCount = machines.filter(m => m.status === "alarm").length;
  const unacked = alerts.filter(a => !a.acknowledged).length;

  const totalProduced = machines.reduce((s, m) => s + m.partsProduced, 0);
  const totalTarget = machines.reduce((s, m) => s + m.partsTarget, 0);
  const avgOee = machines.filter(m => m.status !== "maintenance").reduce((s, m, _, a) => s + m.oee / a.length, 0);
  const totalDowntime = machines.reduce((s, m) => s + m.downtime, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card border border-border rounded px-3 py-2 text-xs font-mono">
        <div className="text-muted-foreground mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value.toLocaleString()}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Panel de Control</h1>
          <p className="text-sm text-muted-foreground capitalize">{fmtDate(now)}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-bold text-foreground tracking-widest">{fmtTime(now)}</div>
          <div className="flex items-center gap-1.5 justify-end mt-1">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-muted-foreground font-mono">ADAM-6050 × 6 conectados</span>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="OEE Promedio" value={avgOee.toFixed(1)} unit="%" sub="Maquinaria activa" trend="down" />
        <KpiCard label="Piezas Producidas" value={totalProduced.toLocaleString()} unit="pzs"
          sub={`Objetivo: ${totalTarget.toLocaleString()}`} trend="up" />
        <KpiCard label="Tiempo Muerto" value={totalDowntime} unit="min" sub="Acumulado hoy" trend="down" />
        <KpiCard label="Alarmas Activas" value={unacked} unit=""
          sub={`${running} máq. en operación`} trend={unacked > 0 ? "up" : null} />
      </div>

      {/* Machine grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Estado de Maquinaria</h2>
          <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
            {(["running","stopped","alarm","maintenance"] as MachineStatus[]).map(s => (
              <span key={s} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
                {STATUS_LABEL[s]}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {machines.map(m => (
            <MachineCard key={m.id} machine={m} onClick={() => onSelectMachine(m)} />
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Production trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Producción por Hora — Hoy</h3>
            <span className="text-[11px] font-mono text-muted-foreground">pzs/hr promedio</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={productionTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF5C00" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FF5C00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hora" tick={{ fill: "#6B7A8D", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#6B7A8D", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="objetivo" stroke="#1A2338" fill="none" strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Objetivo" />
              <Area type="monotone" dataKey="real" stroke="#FF5C00" fill="url(#prodGrad)" strokeWidth={2} dot={false} name="Real" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Downtime by reason */}
        <div className="bg-card border border-border rounded p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tiempo Muerto por Causa</h3>
          <div className="flex justify-center">
            <PieChart width={140} height={140}>
              <Pie data={downtimeByReason} cx={65} cy={65} innerRadius={42} outerRadius={62}
                dataKey="value" paddingAngle={3}>
                {downtimeByReason.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="space-y-2 mt-2">
            {downtimeByReason.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                <span className="font-mono text-foreground">{d.value} min</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent alerts */}
      <div className="bg-card border border-border rounded">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Eventos Recientes</h3>
          {unacked > 0 && (
            <span className="text-[11px] font-mono bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
              {unacked} sin atender
            </span>
          )}
        </div>
        <div className="divide-y divide-border">
          {alerts.slice(0, 5).map(a => {
            const color = a.type === "alarm" ? "#EF4444" : a.type === "warning" ? "#F59E0B" : "#3B82F6";
            const Icon = a.type === "alarm" ? XCircle : a.type === "warning" ? AlertTriangle : AlertCircle;
            return (
              <div key={a.id} className={`flex items-start gap-3 px-4 py-3 ${!a.acknowledged ? "bg-muted/30" : ""}`}>
                <Icon size={14} style={{ color }} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground truncate">{a.machineName}</span>
                    {!a.acknowledged && (
                      <span className="text-[10px] font-mono bg-red-500/20 text-red-400 px-1.5 rounded">NUEVO</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{a.message}</p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground flex-shrink-0">{a.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MachineDetailView({ machine, onBack }: { machine: Machine; onBack: () => void }) {
  const [tab, setTab] = useState<"io" | "downtime" | "history">("io");

  const oeeColor = machine.oee >= 85 ? "#22C55E" : machine.oee >= 65 ? "#F59E0B" : machine.oee > 0 ? "#EF4444" : "#6B7A8D";
  const hourlyData = [
    { hora: "06", pzs: 420 }, { hora: "07", pzs: 460 }, { hora: "08", pzs: 380 },
    { hora: "09", pzs: 490 }, { hora: "10", pzs: 445 }, { hora: "11", pzs: 370 },
    { hora: "12", pzs: 430 }, { hora: "13", pzs: 510 }, { hora: "14", pzs: 335 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
          ← Volver
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm text-foreground font-medium">{machine.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusDot status={machine.status} />
            <span className="font-mono text-xs text-muted-foreground">{machine.id}</span>
            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
              ADAM-6050 @ {machine.adam6050}
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground">{machine.name}</h1>
          <p className="text-sm" style={{ color: STATUS_COLOR[machine.status] }}>
            {STATUS_LABEL[machine.status]}
          </p>
        </div>
        <div className="relative" style={{ width: 96, height: 96 }}>
          <OEERing value={machine.oee} size={96} stroke={8} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-bold leading-none" style={{ color: oeeColor }}>
              {machine.oee > 0 ? `${machine.oee.toFixed(1)}` : "—"}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">OEE %</span>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { l: "Disponibilidad", v: machine.availability, u: "%" },
          { l: "Rendimiento", v: machine.performance, u: "%" },
          { l: "Calidad", v: machine.quality, u: "%" },
          { l: "Piezas hoy", v: machine.partsProduced.toLocaleString(), u: "pzs" },
          { l: "Tiempo muerto", v: machine.downtime, u: "min" },
        ].map(({ l, v, u }) => (
          <div key={l} className="bg-card border border-border rounded p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{l}</div>
            <div className="font-mono text-lg font-bold text-foreground">{typeof v === "number" && v > 0 ? v : v === 0 ? "0" : v}{u && <span className="text-xs text-muted-foreground ml-0.5">{u}</span>}</div>
          </div>
        ))}
      </div>

      {/* Hourly bar chart */}
      <div className="bg-card border border-border rounded p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Piezas por Hora — Hoy</h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={hourlyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="hora" tick={{ fill: "#6B7A8D", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#6B7A8D", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#0F1724", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, fontSize: 11, fontFamily: "JetBrains Mono", color: "#D8E0EA" }}
              cursor={{ fill: "rgba(255,92,0,0.08)" }}
            />
            <Bar dataKey="pzs" fill="#FF5C00" radius={[2, 2, 0, 0]} maxBarSize={32} name="Piezas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabs */}
      <div className="bg-card border border-border rounded">
        <div className="flex border-b border-border">
          {([["io", "I/O Digital (ADAM-6050)"], ["downtime", "Registro de Paros"], ["history", "OEE Semanal"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-3 text-xs font-medium transition-colors ${tab === k
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === "io" && (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
                Entradas Digitales — DI0–DI11
              </h4>
              <div className="space-y-1.5">
                {machine.di.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-3 bg-muted/40 rounded">
                    <span className="font-mono text-[10px] text-muted-foreground w-8">DI{i}</span>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${d.state ? "bg-green-400" : "bg-red-500/60"}`} />
                    <span className="text-xs text-foreground flex-1">{d.label}</span>
                    <span className={`font-mono text-[10px] ${d.state ? "text-green-400" : "text-muted-foreground"}`}>
                      {d.state ? "ON" : "OFF"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
                Salidas Digitales — DO0–DO5
              </h4>
              <div className="space-y-1.5">
                {machine.do_.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-3 bg-muted/40 rounded">
                    <span className="font-mono text-[10px] text-muted-foreground w-8">DO{i}</span>
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${d.state ? "bg-orange-400" : "bg-muted-foreground/30"}`} />
                    <span className="text-xs text-foreground flex-1">{d.label}</span>
                    <span className={`font-mono text-[10px] ${d.state ? "text-orange-400" : "text-muted-foreground"}`}>
                      {d.state ? "ON" : "OFF"}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted/30 rounded border border-border">
                <div className="text-[10px] text-muted-foreground mb-1 font-mono uppercase tracking-wider">Módulo ADAM-6050</div>
                <div className="font-mono text-xs text-foreground">{machine.adam6050}:502</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] text-green-400 font-mono">Modbus TCP — Conectado</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "downtime" && (
          <div className="p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Hora", "Duración (min)", "Causa", "Impacto OEE"].map(h => (
                    <th key={h} className="pb-3 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {machine.downtimeLog.map((row, i) => {
                  const oeeImpact = ((row.duration / 440) * 100).toFixed(1);
                  return (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-mono text-xs text-foreground">{row.time}</td>
                      <td className="py-3 font-mono text-xs text-foreground">{row.duration}</td>
                      <td className="py-3 text-xs text-muted-foreground">{row.reason}</td>
                      <td className="py-3">
                        <span className="font-mono text-xs text-red-400">−{oeeImpact}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td className="pt-3 text-xs font-semibold text-foreground">Total</td>
                  <td className="pt-3 font-mono text-xs font-bold text-red-400">
                    {machine.downtimeLog.reduce((s, r) => s + r.duration, 0)} min
                  </td>
                  <td />
                  <td className="pt-3 font-mono text-xs text-red-400">
                    −{((machine.downtimeLog.reduce((s, r) => s + r.duration, 0) / 440) * 100).toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {tab === "history" && (
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={oeeHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="dia" tick={{ fill: "#6B7A8D", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
                <YAxis domain={[50, 100]} tick={{ fill: "#6B7A8D", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0F1724", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, fontSize: 11, fontFamily: "JetBrains Mono", color: "#D8E0EA" }}
                />
                <Line type="monotone" dataKey="INY01" stroke="#FF5C00" strokeWidth={2} dot={{ fill: "#FF5C00", r: 3 }} name="Inyección #01" />
                <Line type="monotone" dataKey="INY02" stroke="#EF4444" strokeWidth={2} dot={{ fill: "#EF4444", r: 3 }} name="Inyección #02" />
                <Line type="monotone" dataKey="ENS01" stroke="#22C55E" strokeWidth={2} dot={{ fill: "#22C55E", r: 3 }} name="Ensamble #01" />
                <Line type="monotone" dataKey="ENL01" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#3B82F6", r: 3 }} name="Enlainadora #01" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function MachinesView({ machines, onSelectMachine }: { machines: Machine[]; onSelectMachine: (m: Machine) => void }) {
  const [filter, setFilter] = useState<Machine["type"] | "all">("all");
  const filtered = filter === "all" ? machines : machines.filter(m => m.type === filter);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Maquinaria</h1>
        <div className="flex gap-2">
          {([["all", "Todas"], ["inyeccion", "Inyección"], ["ensamble", "Ensamble"], ["enlainadora", "Enlainadora"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${filter === v
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(m => (
          <MachineCard key={m.id} machine={m} onClick={() => onSelectMachine(m)} />
        ))}
      </div>

      {/* Summary table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Resumen de Maquinaria</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Máquina", "ADAM-6050 IP", "Estado", "OEE", "Disponib.", "Rend.", "Calidad", "Piezas", "T. Muerto"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {machines.map(m => (
                <tr key={m.id} onClick={() => onSelectMachine(m)}
                  className="hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusDot status={m.status} />
                      <div>
                        <div className="text-xs font-semibold text-foreground">{m.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{m.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.adam6050}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono" style={{ color: STATUS_COLOR[m.status] }}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-bold" style={{
                    color: m.oee >= 85 ? "#22C55E" : m.oee >= 65 ? "#F59E0B" : m.oee > 0 ? "#EF4444" : "#6B7A8D"
                  }}>
                    {m.oee > 0 ? `${m.oee.toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{m.availability > 0 ? `${m.availability.toFixed(1)}%` : "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{m.performance > 0 ? `${m.performance.toFixed(1)}%` : "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{m.quality > 0 ? `${m.quality.toFixed(1)}%` : "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{m.partsProduced.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: m.downtime > 60 ? "#EF4444" : "#D8E0EA" }}>
                    {m.downtime} min
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ReportsView({ machines }: { machines: Machine[] }) {
  const [period, setPeriod] = useState<"hoy" | "semana" | "mes">("semana");

  const weeklyOEE = [
    { machine: "Inyección #01", lun: 88, mar: 85, mié: 82, jue: 87, vie: 84, prom: 85.2 },
    { machine: "Inyección #02", lun: 72, mar: 68, mié: 64, jue: 70, vie: 61, prom: 67.0 },
    { machine: "Ensamble #01", lun: 93, mar: 91, mié: 94, jue: 92, vie: 92, prom: 92.4 },
    { machine: "Ensamble #02", lun: 89, mar: 91, mié: 0, jue: 90, vie: 0, prom: 54.0 },
    { machine: "Enlainadora #01", lun: 81, mar: 79, mié: 83, jue: 77, vie: 80, prom: 80.0 },
    { machine: "Enlainadora #02", lun: 74, mar: 71, mié: 68, jue: 72, vie: 42, prom: 65.4 },
  ];

  const efficiencyData = weeklyOEE.map(r => ({
    name: r.machine.replace("Inyección", "INY").replace("Ensamble", "ENS").replace("Enlainadora", "ENL").replace(" #", "-"),
    oee: r.prom,
    objetivo: 85,
  }));

  const dias = ["lun", "mar", "mié", "jue", "vie"] as const;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Reportes de Producción</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-muted rounded p-1">
            {([["hoy", "Hoy"], ["semana", "Semana"], ["mes", "Mes"]] as const).map(([v, l]) => (
              <button key={v} onClick={() => setPeriod(v)}
                className={`px-3 py-1 text-xs rounded transition-colors ${period === v ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {l}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted px-3 py-2 rounded">
            <Download size={12} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "OEE Promedio Planta", v: "74.2", u: "%", note: "Objetivo: 85%" },
          { l: "Total Piezas", v: "22,800", u: "", note: "Objetivo: 28,200" },
          { l: "Tiempo Muerto Total", v: "853", u: "min", note: "Esta semana" },
          { l: "Tasa de Defectos", v: "0.88", u: "%", note: "123 piezas rechazadas" },
        ].map(({ l, v, u, note }) => (
          <div key={l} className="bg-card border border-border rounded p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{l}</div>
            <div className="font-mono text-2xl font-bold text-foreground">{v}<span className="text-sm text-muted-foreground ml-1">{u}</span></div>
            <div className="text-[11px] text-muted-foreground mt-1">{note}</div>
          </div>
        ))}
      </div>

      {/* OEE por máquina - bar chart */}
      <div className="bg-card border border-border rounded p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">OEE por Máquina — Semana actual</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={efficiencyData} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: "#6B7A8D", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#6B7A8D", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#0F1724", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, fontSize: 11, fontFamily: "JetBrains Mono", color: "#D8E0EA" }}
              cursor={{ fill: "rgba(255,92,0,0.06)" }}
            />
            <Bar dataKey="objetivo" fill="rgba(255,255,255,0.06)" radius={[2, 2, 0, 0]} maxBarSize={32} name="Objetivo" />
            <Bar dataKey="oee" radius={[2, 2, 0, 0]} maxBarSize={32} name="OEE %">
              {efficiencyData.map((e, i) => (
                <Cell key={i} fill={e.oee >= 85 ? "#22C55E" : e.oee >= 65 ? "#F59E0B" : "#EF4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed OEE table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">OEE Diario por Máquina</h3>
          <span className="text-[11px] font-mono text-muted-foreground">Semana 37 — Sep 2026</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Máquina</th>
                {["Lun", "Mar", "Mié", "Jue", "Vie"].map(d => (
                  <th key={d} className="px-4 py-2.5 text-center text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{d}</th>
                ))}
                <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {weeklyOEE.map(row => (
                <tr key={row.machine} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-semibold text-foreground">{row.machine}</td>
                  {dias.map(d => {
                    const v = row[d];
                    const color = v === 0 ? "#6B7A8D" : v >= 85 ? "#22C55E" : v >= 65 ? "#F59E0B" : "#EF4444";
                    return (
                      <td key={d} className="px-4 py-3 text-center font-mono text-xs" style={{ color }}>
                        {v === 0 ? "—" : `${v}%`}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-xs font-bold"
                      style={{ color: row.prom >= 85 ? "#22C55E" : row.prom >= 65 ? "#F59E0B" : "#EF4444" }}>
                      {row.prom.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Downtime report */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tiempo Muerto por Máquina</h3>
          <div className="space-y-3">
            {machines.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-32 flex-shrink-0">{m.name}</span>
                <div className="flex-1 bg-muted/40 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min((m.downtime / 440) * 100, 100)}%`, background: m.downtime > 120 ? "#EF4444" : m.downtime > 60 ? "#F59E0B" : "#22C55E" }} />
                </div>
                <span className="font-mono text-xs text-muted-foreground w-16 text-right">{m.downtime} min</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tiempo Muerto por Causa</h3>
          <div className="space-y-2">
            {downtimeByReason.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-muted-foreground flex-1">{d.name}</span>
                <div className="w-24 bg-muted/40 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(d.value / 125) * 100}%`, background: d.color }} />
                </div>
                <span className="font-mono text-xs text-foreground w-12 text-right">{d.value} min</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertsView({ alerts, onAcknowledge }: { alerts: Alert[]; onAcknowledge: (id: string) => void }) {
  const unacked = alerts.filter(a => !a.acknowledged);
  const acked = alerts.filter(a => a.acknowledged);

  const AlertRow = ({ a }: { a: Alert }) => {
    const color = a.type === "alarm" ? "#EF4444" : a.type === "warning" ? "#F59E0B" : "#3B82F6";
    const Icon = a.type === "alarm" ? XCircle : a.type === "warning" ? AlertTriangle : AlertCircle;
    const bg = a.type === "alarm" ? "rgba(239,68,68,0.06)" : a.type === "warning" ? "rgba(245,158,11,0.06)" : "transparent";
    return (
      <div className="flex items-start gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
        style={{ background: !a.acknowledged ? bg : undefined }}>
        <Icon size={16} style={{ color }} className="flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-foreground">{a.machineName}</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: `${color}20`, color }}>
              {a.type.toUpperCase()}
            </span>
            {!a.acknowledged && (
              <span className="text-[10px] font-mono bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">NUEVO</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{a.message}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-mono text-[11px] text-muted-foreground">{a.time}</span>
            <span className="font-mono text-[11px] text-muted-foreground">·</span>
            <span className="font-mono text-[11px] text-muted-foreground">{a.machineId}</span>
          </div>
        </div>
        {!a.acknowledged && (
          <button onClick={() => onAcknowledge(a.id)}
            className="flex-shrink-0 text-xs px-3 py-1.5 bg-muted hover:bg-secondary text-muted-foreground hover:text-foreground rounded transition-colors">
            Atender
          </button>
        )}
        {a.acknowledged && (
          <CheckCircle size={14} className="flex-shrink-0 text-green-400 mt-0.5" />
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Alarmas y Eventos</h1>
        <span className="font-mono text-xs text-muted-foreground">{unacked.length} sin atender</span>
      </div>

      {unacked.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-wider text-red-400 font-medium mb-3">Activas</h2>
          <div className="bg-card border border-red-500/20 rounded overflow-hidden">
            {unacked.map(a => <AlertRow key={a.id} a={a} />)}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Historial</h2>
        <div className="bg-card border border-border rounded overflow-hidden">
          {acked.map(a => <AlertRow key={a.id} a={a} />)}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: "Alarmas hoy", v: alerts.filter(a => a.type === "alarm").length, color: "#EF4444" },
          { l: "Advertencias", v: alerts.filter(a => a.type === "warning").length, color: "#F59E0B" },
          { l: "Informativos", v: alerts.filter(a => a.type === "info").length, color: "#3B82F6" },
        ].map(({ l, v, color }) => (
          <div key={l} className="bg-card border border-border rounded p-4 text-center">
            <div className="font-mono text-3xl font-bold mb-1" style={{ color }}>{v}</div>
            <div className="text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────── Sidebar ─────────────── */
function Sidebar({ view, setView, alertCount }: {
  view: View; setView: (v: View) => void; alertCount: number;
}) {
  const navItems: { id: View; label: string; Icon: any }[] = [
    { id: "dashboard", label: "Panel", Icon: Home },
    { id: "machines", label: "Maquinaria", Icon: Cpu },
    { id: "reports", label: "Reportes", Icon: BarChart2 },
    { id: "alerts", label: "Alarmas", Icon: Bell },
  ];

  return (
    <aside className="w-56 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground leading-tight">MES Control</div>
            <div className="font-mono text-[10px] text-muted-foreground">ADAM-6050 Sistema</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ id, label, Icon }) => {
          const active = view === id || (view === "machine-detail" && id === "machines");
          return (
            <button key={id} onClick={() => setView(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors relative
                ${active
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}>
              <Icon size={15} />
              {label}
              {id === "alerts" && alertCount > 0 && (
                <span className="ml-auto font-mono text-[10px] bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] font-mono text-muted-foreground">Red industrial OK</span>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground space-y-0.5">
          <div>Servidor: 192.168.1.100</div>
          <div>Protocolo: Modbus TCP</div>
          <div>Intervalo: 500 ms</div>
        </div>
      </div>
    </aside>
  );
}

/* ─────────────── App ─────────────── */
export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [machines] = useState<Machine[]>(MACHINES);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const handleSelectMachine = useCallback((m: Machine) => {
    setSelectedMachine(m);
    setView("machine-detail");
  }, []);

  const handleAcknowledge = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const unackedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Sidebar view={view} setView={setView} alertCount={unackedCount} />

      <main className="flex-1 overflow-y-auto">
        {view === "dashboard" && (
          <DashboardView machines={machines} alerts={alerts} onSelectMachine={handleSelectMachine} />
        )}
        {view === "machines" && (
          <MachinesView machines={machines} onSelectMachine={handleSelectMachine} />
        )}
        {view === "machine-detail" && selectedMachine && (
          <MachineDetailView machine={selectedMachine} onBack={() => setView("machines")} />
        )}
        {view === "reports" && (
          <ReportsView machines={machines} />
        )}
        {view === "alerts" && (
          <AlertsView alerts={alerts} onAcknowledge={handleAcknowledge} />
        )}
      </main>
    </div>
  );
}
