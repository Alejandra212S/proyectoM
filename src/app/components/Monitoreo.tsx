import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft, Activity, AlertCircle, TrendingUp, Clock } from 'lucide-react';

interface DataPoint {
  time: string;
  pH: number;
  temperature: number;
  turbidity: number;
  heavyMetals: number;
}

export default function Monitoreo() {
  const navigate = useNavigate();
  const [data, setData] = useState<DataPoint[]>([
    { time: '10:00', pH: 7.2, temperature: 24, turbidity: 15, heavyMetals: 0.02 },
    { time: '10:05', pH: 7.3, temperature: 24.5, turbidity: 18, heavyMetals: 0.03 },
    { time: '10:10', pH: 7.1, temperature: 24.2, turbidity: 20, heavyMetals: 0.025 },
    { time: '10:15', pH: 7.4, temperature: 25, turbidity: 17, heavyMetals: 0.02 },
    { time: '10:20', pH: 7.2, temperature: 24.8, turbidity: 19, heavyMetals: 0.028 },
  ]);

  const [currentReading, setCurrentReading] = useState({
    pH: 7.2,
    temperature: 24.8,
    turbidity: 19,
    heavyMetals: 0.028
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newPH = Math.max(6, Math.min(9, currentReading.pH + (Math.random() - 0.5) * 0.3));
      const newTemp = Math.max(20, Math.min(30, currentReading.temperature + (Math.random() - 0.5) * 0.5));
      const newTurbidity = Math.max(0, Math.min(100, currentReading.turbidity + (Math.random() - 0.5) * 8));
      const newHeavyMetals = Math.max(0, Math.min(1, currentReading.heavyMetals + (Math.random() - 0.5) * 0.015));

      const newDataPoint: DataPoint = {
        time: timeStr,
        pH: newPH,
        temperature: newTemp,
        turbidity: newTurbidity,
        heavyMetals: newHeavyMetals
      };

      setCurrentReading({
        pH: newPH,
        temperature: newTemp,
        turbidity: newTurbidity,
        heavyMetals: newHeavyMetals
      });

      setData(prev => {
        const newData = [...prev, newDataPoint];
        if (newData.length > 10) {
          return newData.slice(-10);
        }
        return newData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentReading]);

  const handleGenerateAlert = () => {
    navigate('/alertas');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-6">
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
              <h1 className="text-2xl font-bold text-gray-800">Monitoreo en Tiempo Real</h1>
              <p className="text-sm text-gray-600">Datos actualizados cada 5 segundos</p>
            </div>
            <Activity className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-xs text-gray-500 mb-1">pH Actual</div>
            <div className="text-2xl font-bold text-blue-600">{currentReading.pH.toFixed(2)}</div>
            <div className="text-xs text-gray-400 mt-1">
              {currentReading.pH >= 6.5 && currentReading.pH <= 8.5 ? '✓ Normal' : '⚠ Fuera de rango'}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-xs text-gray-500 mb-1">Temperatura</div>
            <div className="text-2xl font-bold text-orange-600">{currentReading.temperature.toFixed(1)}°C</div>
            <div className="text-xs text-gray-400 mt-1">
              {currentReading.temperature <= 25 ? '✓ Normal' : '⚠ Elevada'}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-xs text-gray-500 mb-1">Turbidez</div>
            <div className="text-2xl font-bold text-cyan-600">{currentReading.turbidity.toFixed(0)} NTU</div>
            <div className="text-xs text-gray-400 mt-1">
              {currentReading.turbidity <= 50 ? '✓ Normal' : '⚠ Alta'}
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md">
            <div className="text-xs text-gray-500 mb-1">Metales</div>
            <div className="text-2xl font-bold text-purple-600">{currentReading.heavyMetals.toFixed(3)} mg/L</div>
            <div className="text-xs text-gray-400 mt-1">
              {currentReading.heavyMetals <= 0.1 ? '✓ Normal' : '⚠ Alto'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Gráfica de pH</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[5, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="pH" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-800">Gráfica de Temperatura</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[15, 35]} />
              <Tooltip />
              <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-semibold text-gray-800">Gráfica de Turbidez</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="turbidity" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Historial de Mediciones</h2>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {data.slice().reverse().map((entry, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <span className="font-semibold text-gray-700">{entry.time}</span>
                <div className="flex gap-4 text-xs">
                  <span>pH: {entry.pH.toFixed(2)}</span>
                  <span>T: {entry.temperature.toFixed(1)}°C</span>
                  <span>Turb: {entry.turbidity.toFixed(0)}</span>
                  <span>Met: {entry.heavyMetals.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerateAlert}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
        >
          <AlertCircle className="w-5 h-5" />
          Generar Alerta
        </button>
      </div>
    </div>
  );
}
