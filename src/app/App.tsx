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

/* ─────────────── Tipos ─────────────── */
type MachineStatus = "running" | "stopped" | "alarm" | "maintenance" | "unknown";
type View = "dashboard" | "machines" | "machine-detail" | "reports" | "alerts";

interface DI { label: string; state: boolean }
interface DO_ { label: string; state: boolean }

interface Machine {
  id: string; number: string; name: string; brand: string; model: string; area: string; location: string;
  type: "inyeccion" | "ensamble" | "enlainadora" | "otro";
  adamAddress: string; status: MachineStatus;
  oee: number | null; availability: number | null; performance: number | null; quality: number | null;
  uptime: number | null; downtime: number | null;
  partsProduced: number | null; partsTarget: number | null; defects: number | null;
  lastEvent: string; lastEventTime: string;
  di: DI[]; do_: DO_[];
  downtimeLog: { time: string; duration: number; reason: string }[];
  raw: Record<string, unknown>;
}
//Interfaz para el apartado de alertas //
interface Alert {
  id: string; machineId: string; machineName: string;
  type: "alarm" | "warning" | "info";
  message: string; time: string; acknowledged: boolean;
}

const normalizeColumn = (column: string) => column.toLowerCase().replace(/[^a-z0-9]/g, "");

function readColumn(row: Record<string, unknown>, aliases: string[]) {
  const names = new Set(aliases.map(normalizeColumn));
  return Object.entries(row).find(([column]) => names.has(normalizeColumn(column)))?.[1];
}

function readText(row: Record<string, unknown>, aliases: string[], fallback = "") {
  const value = readColumn(row, aliases);
  if (value === null || value === undefined) return fallback;
  return value instanceof Date ? value.toLocaleString("es-MX") : String(value).trim() || fallback;
}

function readNumber(row: Record<string, unknown>, aliases: string[]) {
  const value = readColumn(row, aliases);
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function readBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  return ["1", "true", "yes", "si", "on"].includes(String(value).toLowerCase());
}

function parseStatus(value: string): MachineStatus {
  const status = normalizeColumn(value);
  if (/alarma|alarm|fault|error/.test(status)) return "alarm";
  if (/manten|maintenance/.test(status)) return "maintenance";
  if (/deten|paro|stopped|stop|inactiv/.test(status)) return "stopped";
  if (/oper|running|activo|active|produccion/.test(status)) return "running";
  return "unknown";
}

function parseMachineType(value: string): Machine["type"] {
  const type = normalizeColumn(value);
  if (type.includes("inyecc")) return "inyeccion";
  if (type.includes("ensambl")) return "ensamble";
  if (type.includes("enlain")) return "enlainadora";
  return "otro";
}

function readDowntimeLog(row: Record<string, unknown>) {
  let value = readColumn(row, ["downtimeLog", "paros", "tiemposMuertos"]);
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return []; }
  }
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    const duration = readNumber(entry, ["duration", "duracion", "minutos"]);
    if (duration === null) return [];
    return [{
      time: readText(entry, ["time", "hora", "fecha"]),
      duration,
      reason: readText(entry, ["reason", "causa", "motivo"], "Sin causa"),
    }];
  });
}

function mapMachine(row: Record<string, unknown>, index: number): Machine {
  const id = readText(row, ["id", "machineId", "maquinaId", "numero", "codigo", "clave"], `SQL-${index + 1}`);
  const number = readText(row, ["numeroMaquina", "codigo", "numero"]);
  const name = readText(row, ["name", "nombre", "maquina", "descripcion"], id);
  const typeText = readText(row, ["type", "tipo", "categoria"], name);
  const digitalInputs = Object.entries(row).filter(([key]) => /^DI_?\d+$/i.test(key));
  const digitalOutputs = Object.entries(row).filter(([key]) => /^DO_?\d+$/i.test(key));
  const toSignals = (signals: [string, unknown][]) => signals.map(([label, value]) => ({ label, state: readBoolean(value) }));

  return {
    id,
    number,
    name,
    brand: readText(row, ["marca", "brand"]),
    model: readText(row, ["modelo", "model"]),
    area: readText(row, ["area"]),
    location: readText(row, ["ubicacion", "location"]),
    type: parseMachineType(typeText),
    adamAddress: readText(row, ["adam6050", "ip", "ipAddress", "direccionIp"]),
    status: parseStatus(readText(row, ["status", "estado", "estatus", "state"])),
    oee: readNumber(row, ["oee", "oeePercent"]),
    availability: readNumber(row, ["availability", "disponibilidad"]),
    performance: readNumber(row, ["performance", "rendimiento"]),
    quality: readNumber(row, ["quality", "calidad"]),
    uptime: readNumber(row, ["uptime", "tiempoActivo"]),
    downtime: readNumber(row, ["downtime", "tiempoMuerto"]),
    partsProduced: readNumber(row, ["partsProduced", "piezasProducidas", "piezasHoy"]),
    partsTarget: readNumber(row, ["partsTarget", "objetivoPiezas", "metaPiezas"]),
    defects: readNumber(row, ["defects", "defectos"]),
    lastEvent: readText(row, ["lastEvent", "ultimoEvento", "evento"]),
    lastEventTime: readText(row, ["lastEventTime", "horaEvento", "fechaActualizacion", "fechaLectura", "updatedAt"]),
    di: toSignals(digitalInputs),
    do_: toSignals(digitalOutputs),
    downtimeLog: readDowntimeLog(row),
    raw: row,
  };
}

function sumMetrics(values: (number | null)[]) {
  const available = values.filter((value): value is number => value !== null);
  return available.length ? available.reduce((sum, value) => sum + value, 0) : null;
}

function averageMetrics(values: (number | null)[]) {
  const available = values.filter((value): value is number => value !== null);
  return available.length ? available.reduce((sum, value) => sum + value, 0) / available.length : null;
}

function formatMetric(value: number | null, decimals = 0) {
  return value === null ? "—" : value.toLocaleString("es-MX", { maximumFractionDigits: decimals });
}

function formatDatabaseValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (value instanceof Date) return value.toLocaleString("es-MX");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function groupDowntime(machines: Machine[]) {
  const totals = new Map<string, number>();
  machines.flatMap(machine => machine.downtimeLog).forEach(entry => {
    totals.set(entry.reason, (totals.get(entry.reason) ?? 0) + entry.duration);
  });
  const colors = ["#3B82F6", "#EF4444", "#F59E0B", "#22C55E", "#6B7A8D"];
  return [...totals].map(([name, value], index) => ({ name, value, color: colors[index % colors.length] }));
}

/* ───────────────  Definición de colores de operación de maquina  ─────────────── */
const STATUS_COLOR: Record<MachineStatus, string> = {
  running: "#22C55E",
  stopped: "#F59E0B",
  alarm: "#EF4444",
  maintenance: "#3B82F6",
  unknown: "#6B7A8D",
};

{/*Estados de las maquinas*/}

const STATUS_LABEL: Record<MachineStatus, string> = {
  running: "EN OPERACIÓN",
  stopped: "DETENIDA",
  alarm: "ALARMA",
  maintenance: "MANTENIMIENTO",
  unknown: "SIN DATO",
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

/* ─────────────── Sub-componentes de la parte general en oeee ─────────────── */

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
  const oee = machine.oee ?? 0;
  const oeeColor = oee >= 85 ? "#22C55E" : oee >= 65 ? "#F59E0B" : oee > 0 ? "#EF4444" : "#6B7A8D";
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
          <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            <p className="truncate">{machine.number || machine.id} · {machine.brand || "Marca sin registrar"} {machine.model}</p>
            <p className="truncate">{machine.area || "Área sin registrar"} · {machine.location || "Ubicación sin registrar"}</p>
            <p className="truncate">ADAM-5060: {machine.adamAddress || "Sin configurar"}</p>
          </div>
        </div>
        <div className="relative" style={{ width: 52, height: 52 }}>
          <OEERing value={oee} size={52} stroke={5} />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold" style={{ color: oeeColor }}>
            {machine.oee !== null ? `${machine.oee.toFixed(0)}%` : "—"}
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
              {v !== null ? `${v.toFixed(1)}%` : "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground font-mono">
          <Package size={11} />
          <span>{formatMetric(machine.partsProduced)} / {formatMetric(machine.partsTarget)} pzs</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="font-mono text-[10px] truncate max-w-[100px]">{machine.lastEventTime || "—"}</span>
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

/* ─────────────── Vistas en sidebar  ─────────────── */

function DashboardView({ machines, alerts, onSelectMachine }: {
  machines: Machine[]; alerts: Alert[]; onSelectMachine: (m: Machine) => void;
}) {
  const now = useDateTime();
  const running = machines.filter(m => m.status === "running").length;
  const alarmCount = machines.filter(m => m.status === "alarm").length;
  const unacked = alerts.filter(a => !a.acknowledged).length;

  const totalProduced = sumMetrics(machines.map(m => m.partsProduced));
  const totalTarget = sumMetrics(machines.map(m => m.partsTarget));
  const avgOee = averageMetrics(machines.filter(m => m.status !== "maintenance").map(m => m.oee));
  const downtimeByReason = groupDowntime(machines);

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
    <div className="p-4 space-y-6 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Panel de Control</h1>
          <p className="text-sm text-muted-foreground capitalize">{fmtDate(now)}</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-xl font-bold text-foreground sm:text-2xl">{fmtTime(now)}</div>
          <div className="flex items-center gap-1.5 justify-end mt-1">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-muted-foreground font-mono">{machines.length} máquinas recibidas</span>
          </div>
        </div>
      </div>

      {/* Rendimiento total */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <KpiCard label="OEE Promedio" value={formatMetric(avgOee, 1)} unit="%" sub="Maquinaria activa" />

        <KpiCard label="Piezas Producidas" value={formatMetric(totalProduced)} unit="pzs"
        /*se quita la parte de tiempo muerto  */

          sub={`Objetivo: ${formatMetric(totalTarget)}`} />
        <KpiCard label="Alarmas Activas" value={unacked} unit=""
          sub={`${running} máq. en operación`} trend={unacked > 0 ? "up" : null} />
      </div>

      {/* Parte de estado de la maquinaria */}
      <div>
        <div className="mb-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Estado de Maquinaria</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-muted-foreground sm:text-[11px]">
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

      {/* Gráficas de producción y tiempo muerto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Producción por Hora */}
        <div className="lg:col-span-2 bg-card border border-border rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Producción por Hora — Hoy</h3>
            <span className="text-[11px] font-mono text-muted-foreground">pzs/hr promedio</span>
          </div>

          {/*Si la base de datos no esta conectada de manera correcta se muetra el siguiente mensaje */}

          <p className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            La tabla Maquinas no contiene historial de producción por hora.
          </p>
        </div>

        {/* Tiempo muerto por causa  */}
        <div className="bg-card border border-border rounded p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Paros </h3>
          <br />
          <h4 className="text-sm font-semibold text-foreground mb-2">Paros preventivos</h4>
          {downtimeByReason.length > 0 ? <div className="flex justify-center">
            <PieChart width={140} height={140}>
              <Pie data={downtimeByReason} cx={65} cy={65} innerRadius={42} outerRadius={62}
                dataKey="value" paddingAngle={3}>
                {downtimeByReason.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
            </PieChart>
          </div> : <p className="py-8 text-center text-xs text-muted-foreground">Sin registros de paros en la base de datos.</p>}
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

      {/* Alentar Recientes */}
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
          {alerts.length === 0 && <p className="px-4 py-5 text-sm text-muted-foreground">La API de máquinas no incluye alertas.</p>}
        </div>
      </div>
    </div>
  );
}

function MachineDetailView({ machine, onBack }: { machine: Machine; onBack: () => void }) {
  const [tab, setTab] = useState<"io" | "downtime" | "history">("io");

  const oee = machine.oee ?? 0;
  const oeeColor = oee >= 85 ? "#22C55E" : oee >= 65 ? "#F59E0B" : oee > 0 ? "#EF4444" : "#6B7A8D";

  return (
    <div className="p-4 space-y-6 sm:p-6">
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
            / {machine.adamAddress}
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground">{machine.name}</h1>
          <p className="text-sm" style={{ color: STATUS_COLOR[machine.status] }}>
            {STATUS_LABEL[machine.status]}
          </p>
        </div>
        <div className="relative" style={{ width: 96, height: 96 }}>
          <OEERing value={machine.oee ?? 0} size={96} stroke={8} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xl font-bold leading-none" style={{ color: oeeColor }}>
              {machine.oee === null ? "—" : machine.oee.toFixed(1)}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">OEE %</span>
          </div>
        </div>
      </div>
       

      {/* Indicador de rendimiento */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { l: "Rendimiento", v: machine.performance, u: "%" },
          { l: "Calidad", v: machine.quality, u: "%" },
          { l: "Piezas", v: machine.partsProduced, u: "pzs" },
        ].map(({ l, v, u }) => (
          <div key={l} className="bg-card border border-border rounded p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{l}</div>
            <div className="font-mono text-lg font-bold text-foreground">{formatMetric(v, 1)}{u && <span className="text-xs text-muted-foreground ml-0.5">{u}</span>}</div>
          </div>
        ))}
      </div>

      <section className="bg-card border border-border rounded p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Datos recibidos de SQL Server</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-3">
          {Object.entries(machine.raw).map(([column, value]) => (
            <div key={column} className="min-w-0">
              <dt className="text-[10px] uppercase text-muted-foreground">{column}</dt>
              <dd className="break-words text-sm text-foreground">{formatDatabaseValue(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Estadisticas de piezas por hora */}
      <div className="bg-card border border-border rounded p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Piezas por Hora — Hoy</h3>
        <p className="flex h-[140px] items-center justify-center text-sm text-muted-foreground">
          La tabla Maquinas no contiene historial por hora.
        </p>
      </div>

      {/* Tabla de registro de paros */}
      <div className="bg-card border border-border rounded">
        <div className="flex border-b border-border">
          {([["io", "I/O Digital"], ["downtime", "Registro de Paros"], ["history", "OEE Semanal"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-3 text-xs font-medium transition-colors ${tab === k
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Parte de entradas y salidas digitales del modulo ADAM 5060*/}

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
                <div className="text-[10px] text-muted-foreground mb-1 font-mono uppercase tracking-wider">Controlador ADAM-5000/TCP</div>
                <div className="font-mono text-xs text-foreground">{machine.adamAddress || "IP sin configurar"}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-mono">ADAM-5060 · Estados en SQL</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* DATOS DE TIEMPO, DURACIÓN DE LOS PAROS Y LA CAUSA O RAZON POR LA QUE LA MAQUINA PAROS*/}
        {tab === "downtime" && (
          <div className="p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Hora", "Duración (min)", "Causa"].map(h => (
                    <th key={h} className="pb-3 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {machine.downtimeLog.map((row, i) => {
                  return (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-mono text-xs text-foreground">{row.time}</td>
                      <td className="py-3 font-mono text-xs text-foreground">{row.duration}</td>
                      <td className="py-3 text-xs text-muted-foreground">{row.reason}</td>
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
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {tab === "history" && (
          <div className="p-5">
            <p className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              La tabla Maquinas no contiene historial de OEE.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
{/*Parte de arriba de dashboard en donde se muestrasel tipo de maquinas*/}
function MachinesView({ machines, onSelectMachine, onAddMachine }: {
  machines: Machine[];
  onSelectMachine: (m: Machine) => void;
  onAddMachine: (m: Machine) => Promise<void>;
}) {
  const [filter, setFilter] = useState<Machine["type"] | "all">("all");
  const filtered = filter === "all" ? machines : machines.filter(m => m.type === filter);
  return (
    <div className="p-4 space-y-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Maquinaria</h1>
         <h2 className="text-xl font-bold text-foreground "></h2>
        <div className="flex gap-2">
          {([["all", "Todas"], ["inyeccion", "Inyección"], ["ensamble", "Ensamble"], ["enlainadora", "Enlainadora" ] ] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${filter === v
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
          <AgregarMaquina onAddMachine={onAddMachine} />
        </div>
      </div>
         
          
      
{/*ALERTA DE QUE NO HAY MAQUINAS REGISTRADAS SIN LA BASE DE DATOS*/}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(m => (
          <MachineCard key={m.id} machine={m} onClick={() => onSelectMachine(m)} />
        ))}
      </div>
      {filtered.length === 0 && <p className="text-sm text-muted-foreground">No hay máquinas devueltas por la base de datos.</p>}
      {/* Resumen de maquinaria  */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Resumen de Maquinaria</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Máquina", "Marca / Modelo", "Área", "Ubicación", "ADAM-5060", "Estado", "OEE", "Disponib.", "Rend.", "Calidad", "Piezas", "T. Muerto"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium whitespace-nowra0p">{h}</th>
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
                        <div className="font-mono text-[10px] text-muted-foreground">{m.number || m.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground">{[m.brand, m.model].filter(Boolean).join(" ") || "Sin registrar"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{m.area || "Sin registrar"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{m.location || "Sin registrar"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.adamAddress || "Sin configurar"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono" style={{ color: STATUS_COLOR[m.status] }}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-bold" style={{
                    color: (m.oee ?? 0) >= 85 ? "#22C55E" : (m.oee ?? 0) >= 65 ? "#F59E0B" : (m.oee ?? 0) > 0 ? "#EF4444" : "#6B7A8D"
                  }}>
                    {m.oee === null ? "—" : `${m.oee.toFixed(1)}%`}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{m.availability === null ? "—" : `${formatMetric(m.availability, 1)}%`}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{m.performance === null ? "—" : `${formatMetric(m.performance, 1)}%`}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{m.quality === null ? "—" : `${formatMetric(m.quality, 1)}%`}</td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{formatMetric(m.partsProduced)}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: (m.downtime ?? 0) > 60 ? "#EF4444" : "#D8E0EA" }}>
                    {formatMetric(m.downtime)} min
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
  const averageOee = averageMetrics(machines.map(machine => machine.oee));
  const totalProduced = sumMetrics(machines.map(machine => machine.partsProduced));
  const totalDefects = sumMetrics(machines.map(machine => machine.defects));
  const downtimeByReason = groupDowntime(machines);
  const efficiencyData = machines.flatMap(machine => machine.oee === null ? [] : [{ name: machine.name, oee: machine.oee }]);
  const maxDowntime = Math.max(...machines.map(machine => machine.downtime ?? 0), 1);
  const maxDowntimeReason = Math.max(...downtimeByReason.map(entry => entry.value), 1);

  return (
    <div className="p-4 space-y-6 sm:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Reportes de Producción</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: "OEE actual promedio", v: formatMetric(averageOee, 1), u: "%" },
          { l: "Piezas reportadas", v: formatMetric(totalProduced), u: "" },
          { l: "Defectos reportados", v: formatMetric(totalDefects), u: "" },
        ].map(({ l, v, u }) => (
          <div key={l} className="bg-card border border-border rounded p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{l}</div>
            <div className="font-mono text-2xl font-bold text-foreground">{v}<span className="text-sm text-muted-foreground ml-1">{u}</span></div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">OEE actual por máquina</h3>
        {efficiencyData.length > 0 ? <ResponsiveContainer width="100%" height={200}>
          <BarChart data={efficiencyData} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: "#6B7A8D", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#6B7A8D", fontSize: 10, fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#0F1724", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 4, fontSize: 11, fontFamily: "JetBrains Mono", color: "#D8E0EA" }}
              cursor={{ fill: "rgba(255,92,0,0.06)" }}
            />
            <Bar dataKey="oee" radius={[2, 2, 0, 0]} maxBarSize={32} name="OEE %">
              {efficiencyData.map((e, i) => (
                <Cell key={i} fill={e.oee >= 85 ? "#22C55E" : e.oee >= 65 ? "#F59E0B" : "#EF4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer> : <p className="py-8 text-center text-sm text-muted-foreground">La tabla no contiene valores de OEE.</p>}
      </div>

{/* Datos actuales que se tienen de las maquinas dentro de la base de datos */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Datos actuales por máquina</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Máquina</th>
                <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium">OEE</th>
                <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Piezas</th>
                <th className="px-4 py-2.5 text-right text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Paro (min)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {machines.map(machine => (
                <tr key={machine.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-xs font-semibold text-foreground">{machine.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{machine.oee === null ? "—" : `${formatMetric(machine.oee, 1)}%`}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{formatMetric(machine.partsProduced)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{formatMetric(machine.downtime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parte del reporte */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tiempo muerto actual</h3>
          <div className="space-y-3">
            {machines.map(m => (
              <div key={m.id} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-32 flex-shrink-0">{m.name}</span>
                <div className="flex-1 bg-muted/40 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(((m.downtime ?? 0) / maxDowntime) * 100, 100)}%`, background: (m.downtime ?? 0) > 0 ? "#F59E0B" : "#6B7A8D" }} />
                </div>
                  <span className="font-mono text-xs text-muted-foreground w-16 text-right">{formatMetric(m.downtime)} min</span>
              </div>
            ))}
          </div>
        </div>

                  <div className="bg-card border border-border rounded p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Paro por Causa </h3>
          {downtimeByReason.length > 0 ? <div className="space-y-2">
            {downtimeByReason.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                <span className="text-xs text-muted-foreground flex-1">{d.name}</span>
                <div className="w-24 bg-muted/40 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(d.value / maxDowntimeReason) * 100}%`, background: d.color }} />
                </div>
                <span className="font-mono text-xs text-foreground w-12 text-right">{d.value} min</span>
              </div>
            ))}
          </div> : <p className="text-sm text-muted-foreground">La tabla no contiene registros de paros por causa.</p>}
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
    <div className="p-4 space-y-5 sm:p-6">
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

      {/*ALARMAS, ADVERTEBCIAS O INFORMATIVOS DE LAS MAQUINAS*/}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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

function MenshenLogo({ variant }: { variant: "desktop" | "mobile" }) {
  const titleId = `menshen-logo-title-${variant}`;
  const filterId = `menshen-logo-filter-${variant}`;

  return (
    <svg role="img" aria-labelledby={titleId} viewBox="0 0 180 180" className={variant === "desktop" ? "h-12 w-12" : "h-9 w-9"}>
      <title id={titleId}>Logo MENSHEN</title>
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 -0.34016 -1.14432 -0.11552 0 1.6" />
        </filter>
      </defs>
      <image
        href="https://feedingfreely.eu/wp-content/uploads/2021/04/menshen-packaging-usa-squarelogo-1541588341734.png"
        width="180"
        height="180"
        filter={`url(#${filterId})`}
      />
    </svg>
  );
}

/* ─────────────── Sidebar del lado derecho ─────────────── */
function Sidebar({ view, setView, alertCount, databaseConnected }: {
  view: View; setView: (v: View) => void; alertCount: number; databaseConnected: boolean;
}) {
  const navItems: { id: View; label: string; Icon: any }[] = [

    { id: "dashboard", label: "Panel", Icon: Home },
    { id: "machines", label: "Maquinaria", Icon: Cpu },
    { id: "reports", label: "Reportes", Icon: BarChart2 },
    { id: "alerts", label: "Alarmas", Icon: Bell },
  ];

  return (
    <>
    <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      {/* Logo */}
      <div className="flex min-h-20 items-center justify-center border-b border-sidebar-border px-5">
        <MenshenLogo variant="desktop" />
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
          <span className={`w-1.5 h-1.5 rounded-full ${databaseConnected ? "bg-green-400" : "bg-amber-400"}`} />
          <span className="text-[11px] font-mono text-muted-foreground">{databaseConnected ? "SQL Server conectado" : "SQL Server sin conexión"}</span>
        </div>
        <div className="font-mono text-[10px] text-muted-foreground space-y-0.5">
          <div>Fuente: base de datos</div>
          <div>Actualización: 15 s</div>
        </div>
      </div>
    </aside>
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 md:hidden">
      <MenshenLogo variant="mobile" />
      <div className="flex min-w-0 items-center gap-2" title={databaseConnected ? "SQL Server conectado" : "SQL Server sin conexión"}>
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${databaseConnected ? "bg-green-400" : "bg-amber-400"}`} />
        <span className="max-w-48 truncate text-xs text-muted-foreground">{databaseConnected ? "SQL Server conectado" : "SQL sin conexión"}</span>
      </div>
    </header>
    <nav aria-label="Navegación principal" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-sidebar-border bg-sidebar px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
      {navItems.map(({ id, label, Icon }) => {
        const active = view === id || (view === "machine-detail" && id === "machines");
        return (
          <button
            key={id}
            onClick={() => setView(id)}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-16 flex-col items-center justify-center gap-1 ${active ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon size={18} />
            <span className="text-[10px]">{label}</span>
            {id === "alerts" && alertCount > 0 && <span className="absolute right-1/4 top-1 h-4 min-w-4 rounded-full bg-red-500 px-1 text-[10px] leading-4 text-white">{alertCount}</span>}
          </button>
        );
      })}
    </nav>
    </>
  );
}


 interface Maquina {
  nombre: string;
  numero: string;
  tipo: string;
  otroTipo: string;
  marca: string;
  modelo: string;
  area: string;
  ubicacion: string;
  estado: string;
  comunicacion: string;
  ip: string;
  puerto: string;
  sensores: string;
  descripcion: string;
}
function AgregarMaquina({ onAddMachine }: { onAddMachine: (m: Machine) => Promise<void> }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const [maquina, setMaquina] = useState<Maquina>({
    nombre: "",
    numero: "",
    tipo: "",
    otroTipo: "",
    marca: "",
    modelo: "",
    area: "",
    ubicacion: "",
    estado: "Operativa",
    comunicacion: "",
    ip: "",
    puerto: "",
    sensores: "",
    descripcion: "",
  });
  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  setMaquina((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  const guardarMaquina = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setGuardando(true);
    setErrorGuardar(null);

    const tipoNormalizado: Machine["type"] =
      maquina.tipo === "Inyección"
        ? "inyeccion"
        : maquina.tipo === "Ensamble"
          ? "ensamble"
          : maquina.tipo === "Enlainadora"
            ? "enlainadora"
            : "otro";

    const nuevaMaquina: Machine = {
      id: maquina.numero.trim() || `MAQ-${Date.now().toString().slice(-4)}`,
      number: maquina.numero.trim(),
      name: maquina.nombre.trim(),
      brand: maquina.marca.trim(),
      model: maquina.modelo.trim(),
      area: maquina.area.trim(),
      location: maquina.ubicacion.trim(),
      type: tipoNormalizado,
      adamAddress: maquina.ip.trim(),
      status:
        maquina.estado === "Detenida"
          ? "stopped"
          : maquina.estado === "Mantenimiento"
            ? "maintenance"
            : maquina.estado === "Fuera de servicio"
              ? "stopped"
              : "running",
      oee: null,
      availability: null,
      performance: null,
      quality: null,
      uptime: null,
      downtime: null,
      partsProduced: null,
      partsTarget: null,
      defects: null,
      lastEvent: "Máquina registrada",
      lastEventTime: new Date().toLocaleTimeString("es-MX"),
      di: [],
      do_: [],
      downtimeLog: [],
      raw: {
        numero: maquina.numero.trim(),
        nombre: maquina.nombre.trim(),
        tipo: maquina.tipo,
        marca: maquina.marca,
        modelo: maquina.modelo,
        area: maquina.area,
        ubicacion: maquina.ubicacion,
        estado: maquina.estado,
        comunicacion: maquina.comunicacion,
        ip: maquina.ip,
        puerto: maquina.puerto,
        sensores: maquina.sensores,
        descripcion: maquina.descripcion,
      },
    };

    try {
      await onAddMachine(nuevaMaquina);
      setMaquina({
        nombre: "",
        numero: "",
        tipo: "",
        otroTipo: "",
        marca: "",
        modelo: "",
        area: "",
        ubicacion: "",
        estado: "Operativa",
        comunicacion: "",
        ip: "",
        puerto: "",
        sensores: "",
        descripcion: "",
      });
      setMostrarFormulario(false);
    } catch (error) {
      setErrorGuardar(error instanceof Error ? error.message : "No se pudo guardar la máquina.");
    } finally {
      setGuardando(false);
    }
  };

  return (
  

    <>
      {/* BOTÓN AGREGAR MÁQUINA */}
      <button
        onClick={() => setMostrarFormulario(true)}
        className="px-3 py-1.5 text-xs rounded bg-indigo-500 text-white hover:bg-purple-500"
      >
        Agregar Máquina
      </button>

      {/* MODAL */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-grid /50 p-4">

          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-xl shadow-xl">

            {/* ENCABEZADO */}
            <div className="flex items-center justify-between px-6 py-4 border-b">

              <div>
                <h2 className="text-xl font-bold text-while-100">
                  Agregar Máquina
                </h2>
                   <br />
                <p className="text-sm text-whiel-500">
                  Registra la información de la maquinaria
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="text-gray-400 hover:text-red-500 text-xl"
              >
                ✕
              </button>

            </div>

            {/* FORMULARIO */}
            <form onSubmit={guardarMaquina} className="p-4 space-y-6 sm:p-6">

              {/* INFORMACIÓN GENERAL */}
              <section>

                <h3 className="mb-4 text-sm font-semibold text-gray-300">
                  Información general
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* NOMBRE */}
                  <div>
                    <label className="text-sm text-gray-300">
                      Nombre de la máquina
                    </label>

                    <input
                      type="text"
                      name="nombre"
                      value={maquina.nombre}
                      onChange={handleChange}
                      placeholder="Ej. Máquina de Inyección 01"
                      required
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-slate-900"
                    />
                  </div>

                  {/* ID */}
                  <div>
                    <label className="text-sm text-gray-300">
                      Número / ID
                    </label>

                    <input
                      type="text"
                      name="numero"
                      value={maquina.numero}
                      onChange={handleChange}
                      placeholder="Ej. MAQ-001"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>

                  {/* TIPO */}
                  <div>
                    <label className="text-sm text-black-300">
                      Tipo de máquina
                    </label>

                    <select
                      name="tipo"
                      value={maquina.tipo}
                      onChange={handleChange}
                      required
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-slate-900"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Inyección">Inyección</option>
                      <option value="Ensamble">Ensamble</option>
                      <option value="Enlainadora">Enlainadora</option>
                      <option value="CNC">CNC</option>
                      <option value="Prensa">Prensa</option>
                      <option value="Empacadora">Empacadora</option>
                      <option value="Transportadora">Transportadora</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  {/* OTROS */}
                  {maquina.tipo === "Otros" && (
                    <div>
                      <label className="text-sm text-gray-600">
                        Especificar tipo
                      </label>

                      <input
                        type="text"
                        name="otroTipo"
                        value={maquina.otroTipo}
                        onChange={handleChange}
                        placeholder="¿Qué tipo de máquina es?"
                        required
                        className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  )}

                  {/* MARCA */}
                  <div>
                    <label className="text-sm text-while-300">
                      Marca
                    </label>

                    <input
                      type="text"
                      name="marca"
                      value={maquina.marca}
                      onChange={handleChange}
                      placeholder="Ej. Engel"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>

                  {/* MODELO */}
                  <div>
                    <label className="text-sm text-while-300">
                      Modelo
                    </label>

                    <input
                      type="text"
                      name="modelo"
                      value={maquina.modelo}
                      onChange={handleChange}
                      placeholder="Modelo"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>

                </div>
              </section>

              {/* UBICACIÓN */}
              <section>

                <h3 className="mb-4 text-sm font-semibold text-gray-300">
                  Ubicación y estado
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div>
                    <label className="text-sm text-while-300">
                      Área
                    </label>

                    <select
                      name="area"
                      value={maquina.area}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-slate-900"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Producción">Producción</option>
                      <option value="Ensamble">Ensamble</option>
                      <option value="Inyección">Inyección</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Calidad">Calidad</option>
                      <option value="Almacén">Almacén</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-while-300">
                      Ubicación
                    </label>

                    <input
                      type="text"
                      name="ubicacion"
                      value={maquina.ubicacion}
                      onChange={handleChange}
                      placeholder="Ej. Línea 2"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-while-300">
                      Estado
                    </label>

                    <select
                      name="estado"
                      value={maquina.estado}
                      onChange={handleChange}
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-slate-900"
                    >
                      <option value="Operativa">Operativa</option>
                      <option value="Detenida">Detenida</option>
                      <option value="Mantenimiento"> En mantenimiento
                      </option> <option value="Fuera de servicio">
                       Fuera de servicio
                      </option>
                    </select>
                  </div>

                </div>
              </section>

              {/* CONECTIVIDAD */}
              <section>

                  <div>
                    <label className="text-sm text-while 300">
                      Comunicación
                      <br />
                    </label>
                    <br />
                  <div>
                    <label className="text-sm text-While-300">
                      
                      Dirección IP
                    </label>
                    <br />

                    <input

                      type="text"
                      name="ip"
                      value={maquina.ip}
                      onChange={handleChange}
                      placeholder="Ejemplo 192.X.X.X"
                      className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    

                  </div>

                </div>
              </section>

              {/* DESCRIPCIÓN */}
              <section>
                <label className="text-sm text-While-300">
                  Descripción
                </label>
                <br />

                <textarea
                  name="descripcion"
                  value={maquina.descripcion}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Descripción de la máquina..."
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                />
              </section>

              {/* BOTONES */}
              {errorGuardar && <p role="alert" className="text-sm text-red-400">{errorGuardar}</p>}
              <div className="flex justify-end gap-3 pt-4 border-t">

                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-sm rounded-lg bg-yellow-600 text-white hover:bg-pink-700"
                >
                  {guardando ? "Guardando..." : "Guardar Máquina"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────────── App ─────────────── */
export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadMachines = async () => {
      try {
        const response = await fetch("http://localhost:3001/maquinas");
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || `Error HTTP ${response.status}`);
        if (!Array.isArray(body)) throw new Error("La API no devolvió una lista de máquinas.");

        const rows = body.filter((row): row is Record<string, unknown> =>
          row !== null && typeof row === "object" && !Array.isArray(row)
        );
        const nextMachines = rows.map(mapMachine);
        if (active) {
          setMachines(nextMachines);
          setSelectedMachine(current => current ? nextMachines.find(machine => machine.id === current.id) ?? null : null);
          setDataError(null);
        }
      } catch (error) {
        if (active) {
          setMachines([]);
          setSelectedMachine(null);
          setDataError(error instanceof Error ? error.message : "No se pudieron cargar las máquinas.");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadMachines();
    const refresh = window.setInterval(loadMachines, 15000);
    return () => {
      active = false;
      window.clearInterval(refresh);
    };
  }, []);

  const handleSelectMachine = useCallback((m: Machine) => {
    setSelectedMachine(m);
    setView("machine-detail");
  }, []);

  const handleAcknowledge = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  }, []);

  const handleAddMachine = useCallback(async (machine: Machine) => {
    const response = await fetch("http://localhost:3001/maquinas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(machine.raw),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || `Error HTTP ${response.status}`);

    const savedMachine = mapMachine(body, 0);
    setMachines(previous => [...previous.filter(existing => existing.id !== savedMachine.id), savedMachine]);
  }, []);

  const unackedCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="flex min-h-dvh w-full overflow-x-hidden bg-background text-foreground md:h-dvh md:overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <Sidebar view={view} setView={setView} alertCount={unackedCount} databaseConnected={!isLoading && !dataError} />

      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-14 pb-20 md:pt-0 md:pb-0">
        {isLoading && <p className="px-6 pt-4 text-sm text-muted-foreground">Cargando máquinas desde SQL Server...</p>}
        {dataError && <div role="alert" className="mx-4 mt-4 break-words rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 sm:m-6 sm:mb-0">No se pudieron cargar datos de SQL Server: {dataError}</div>}
        {!isLoading && !dataError && machines.length === 0 && <p className="px-6 pt-4 text-sm text-muted-foreground">La consulta se realizó correctamente, pero la tabla no devolvió máquinas.</p>}
        {view === "dashboard" && (
          <DashboardView machines={machines} alerts={alerts} onSelectMachine={handleSelectMachine} />
        )}
        {view === "machines" && (
          <MachinesView machines={machines} onSelectMachine={handleSelectMachine} onAddMachine={handleAddMachine} />
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