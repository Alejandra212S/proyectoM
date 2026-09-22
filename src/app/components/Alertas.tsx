import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, AlertCircle, Bell, Clock, MapPin, TrendingUp, CheckCircle } from 'lucide-react';

interface Alert {
  id: number;
  type: 'preventiva' | 'critica';
  title: string;
  message: string;
  parameter: string;
  value: string;
  location: string;
  timestamp: string;
  resolved: boolean;
}

export default function Alertas() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: 1,
      type: 'critica',
      title: 'Nivel Crítico de pH',
      message: 'El pH ha superado los niveles seguros. Se recomienda suspender actividades recreativas y verificar fuentes de contaminación.',
      parameter: 'pH',
      value: '9.2',
      location: 'Río Cali - Sector Centro',
      timestamp: '2026-05-01 14:30',
      resolved: false
    },
    {
      id: 2,
      type: 'preventiva',
      title: 'Turbidez Elevada',
      message: 'Se ha detectado un incremento en la turbidez del agua. Monitorear evolución en las próximas horas.',
      parameter: 'Turbidez',
      value: '55 NTU',
      location: 'Río Cali - Sector Norte',
      timestamp: '2026-05-01 13:15',
      resolved: false
    },
    {
      id: 3,
      type: 'preventiva',
      title: 'Temperatura Anormal',
      message: 'La temperatura del agua está por encima del promedio histórico. Verificar posibles descargas térmicas.',
      parameter: 'Temperatura',
      value: '28.5°C',
      location: 'Río Cali - Sector Sur',
      timestamp: '2026-05-01 12:00',
      resolved: false
    }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const random = Math.random();
      if (random > 0.85) {
        const newAlert: Alert = {
          id: Date.now(),
          type: random > 0.92 ? 'critica' : 'preventiva',
          title: random > 0.92 ? 'Metales Pesados Detectados' : 'Variación en Parámetros',
          message: random > 0.92
            ? 'Se han detectado niveles elevados de metales pesados. Activar protocolo de emergencia inmediatamente.'
            : 'Los parámetros de calidad muestran variaciones. Se recomienda monitoreo continuo.',
          parameter: random > 0.92 ? 'Metales Pesados' : 'pH',
          value: random > 0.92 ? '0.25 mg/L' : '8.8',
          location: 'Río Cali - Sector Centro',
          timestamp: new Date().toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          resolved: false
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleResolve = (id: number) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id ? { ...alert, resolved: true } : alert
      )
    );
  };

  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Sistema de Alertas</h1>
              <p className="text-sm text-gray-600">Monitoreo automático de calidad del agua</p>
            </div>
            <Bell className="w-8 h-8 text-red-600 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">Alertas Críticas</span>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold">
              {activeAlerts.filter(a => a.type === 'critica').length}
            </div>
            <div className="text-sm opacity-90 mt-1">Requieren atención inmediata</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm opacity-90">Alertas Preventivas</span>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-4xl font-bold">
              {activeAlerts.filter(a => a.type === 'preventiva').length}
            </div>
            <div className="text-sm opacity-90 mt-1">Monitoreo continuo</div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Alertas Activas</h2>
          <div className="space-y-4">
            {activeAlerts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-md">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">No hay alertas activas en este momento</p>
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`bg-white rounded-xl p-6 shadow-md border-l-4 ${
                    alert.type === 'critica' ? 'border-red-500' : 'border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {alert.type === 'critica' ? (
                        <div className="bg-red-100 p-3 rounded-lg">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                      ) : (
                        <div className="bg-yellow-100 p-3 rounded-lg">
                          <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{alert.title}</h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              alert.type === 'critica'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {alert.type === 'critica' ? 'CRÍTICA' : 'PREVENTIVA'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Parámetro
                      </div>
                      <div className="font-semibold text-gray-800">{alert.parameter}</div>
                      <div className="text-sm text-gray-600">{alert.value}</div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <MapPin className="w-3 h-3" />
                        Ubicación
                      </div>
                      <div className="font-semibold text-gray-800">{alert.location}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {alert.timestamp}
                    </div>
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Marcar como Resuelta
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {resolvedAlerts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Alertas Resueltas</h2>
            <div className="space-y-3">
              {resolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-white rounded-xl p-4 shadow-md border-l-4 border-green-500 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="font-semibold text-gray-700">{alert.title}</div>
                        <div className="text-xs text-gray-500">{alert.timestamp}</div>
                      </div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      RESUELTA
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
