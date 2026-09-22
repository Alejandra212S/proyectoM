import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, TrendingUp, Wind, Activity, AlertTriangle, MapPin } from 'lucide-react';

interface WaterQuality {
  pH: number;
  temperature: number;
  turbidity: number;
  heavyMetals: number;
  status: 'normal' | 'warning' | 'critical';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [waterData, setWaterData] = useState<WaterQuality>({
    pH: 7.2,
    temperature: 24,
    turbidity: 15,
    heavyMetals: 0.02,
    status: 'normal'
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setWaterData(prev => {
        const newPH = Math.max(6, Math.min(9, prev.pH + (Math.random() - 0.5) * 0.2));
        const newTemp = Math.max(20, Math.min(30, prev.temperature + (Math.random() - 0.5) * 0.5));
        const newTurbidity = Math.max(0, Math.min(100, prev.turbidity + (Math.random() - 0.5) * 5));
        const newHeavyMetals = Math.max(0, Math.min(1, prev.heavyMetals + (Math.random() - 0.5) * 0.01));

        let newStatus: 'normal' | 'warning' | 'critical' = 'normal';
        if (newPH < 6.5 || newPH > 8.5 || newTurbidity > 50 || newHeavyMetals > 0.1) {
          newStatus = 'warning';
        }
        if (newPH < 6 || newPH > 9 || newTurbidity > 70 || newHeavyMetals > 0.5) {
          newStatus = 'critical';
        }

        return {
          pH: newPH,
          temperature: newTemp,
          turbidity: newTurbidity,
          heavyMetals: newHeavyMetals,
          status: newStatus
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (waterData.status) {
      case 'normal':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (waterData.status) {
      case 'normal':
        return 'Normal';
      case 'warning':
        return 'Riesgo';
      case 'critical':
        return 'Crítico';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl p-4 shadow-md mb-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Estudiante: <span className="font-semibold text-gray-800">Jaiver Ruano</span></div>
            <div className="text-sm text-gray-600 mb-1">Curso: <span className="font-semibold text-gray-800">Proyecto de ingeniería</span></div>
            <div className="text-sm text-gray-600">Tema: <span className="font-semibold text-gray-800">Prototipo de bajo nivel</span></div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-800">Calidad del Agua</h1>
            <Droplets className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600">Ríos Urbanos - Cali, Colombia</p>
        </div>

        <div className={`${getStatusColor()} rounded-2xl p-6 mb-6 text-white shadow-lg`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-semibold">Estado Actual</span>
            <Activity className="w-6 h-6" />
          </div>
          <div className="text-4xl font-bold mb-1">{getStatusText()}</div>
          <div className="text-sm opacity-90">Actualización en tiempo real</div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Indicadores de Calidad</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">pH</div>
                  <div className="text-2xl font-bold text-gray-800">{waterData.pH.toFixed(1)}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Rango: 6.5-8.5</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Wind className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Temperatura</div>
                  <div className="text-2xl font-bold text-gray-800">{waterData.temperature.toFixed(1)}°C</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Rango: 20-25°C</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-cyan-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500 p-2 rounded-lg">
                  <Droplets className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Turbidez</div>
                  <div className="text-2xl font-bold text-gray-800">{waterData.turbidity.toFixed(0)} NTU</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Max: 50 NTU</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Metales Pesados</div>
                  <div className="text-2xl font-bold text-gray-800">{waterData.heavyMetals.toFixed(2)} mg/L</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Max: 0.1 mg/L</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-6 shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ubicación</h2>
          <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-xl p-6 flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-800">Río Cali</div>
              <div className="text-sm text-gray-600">Sector Centro, Cali</div>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/monitoreo')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors"
        >
          Ver Detalles
        </button>
      </div>
    </div>
  );
}
