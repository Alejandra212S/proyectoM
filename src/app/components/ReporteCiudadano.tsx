import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, Send, CheckCircle, AlertTriangle, Trash, Droplets, Wind } from 'lucide-react';

interface Report {
  problemType: string;
  description: string;
  photo: string | null;
  location: string;
  timestamp: string;
}

export default function ReporteCiudadano() {
  const navigate = useNavigate();
  const [problemType, setProblemType] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);

  const problemTypes = [
    'Basuras y residuos sólidos',
    'Vertimientos o desechos residuales',
    'Presencia de metales pesados',
    'Alta turbidez',
    'Olores extraños',
    'Color anormal del agua',
    'Espuma o contaminantes visibles',
    'Muerte de fauna acuática',
    'Otro'
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        () => {
          setLocation('3.4372, -76.5225 (Cali, Colombia)');
        }
      );
    } else {
      setLocation('3.4372, -76.5225 (Cali, Colombia)');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!problemType || !description || !location) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    const newReport: Report = {
      problemType,
      description,
      photo,
      location,
      timestamp: new Date().toLocaleString('es-CO')
    };

    setReports(prev => [newReport, ...prev]);
    setSubmitted(true);

    setTimeout(() => {
      setProblemType('');
      setDescription('');
      setPhoto(null);
      setLocation('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-6">
      <div className="max-w-2xl mx-auto">
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
              <h1 className="text-2xl font-bold text-gray-800">Reporte Ciudadano</h1>
              <p className="text-sm text-gray-600">Ayúdanos a proteger nuestros ríos</p>
            </div>
            <Droplets className="w-8 h-8 text-green-600" />
          </div>
        </div>

        {submitted && (
          <div className="bg-green-500 text-white rounded-xl p-4 mb-6 flex items-center gap-3 shadow-lg">
            <CheckCircle className="w-6 h-6" />
            <div>
              <div className="font-semibold">¡Reporte enviado exitosamente!</div>
              <div className="text-sm opacity-90">Gracias por contribuir al cuidado del agua</div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Reportar Anomalía
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Problema *
              </label>
              <select
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                required
              >
                <option value="">Seleccione un tipo de problema</option>
                {problemTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción Detallada *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describa lo que observó en el río..."
                rows={4}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fotografía (Opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                {photo ? (
                  <div className="relative">
                    <img src={photo} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <span className="text-gray-600">Toque para subir una foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ubicación (GPS) *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Latitud, Longitud"
                  className="flex-1 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <MapPin className="w-5 h-5" />
                  GPS
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Enviar Reporte
            </button>
          </form>
        </div>

        {reports.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Reportes Enviados</h2>
            <div className="space-y-4">
              {reports.map((report, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border-l-4 border-green-500">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-gray-800">{report.problemType}</div>
                    <div className="text-xs text-gray-500">{report.timestamp}</div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {report.location}
                  </div>
                  {report.photo && (
                    <img src={report.photo} alt="Report" className="mt-3 max-h-32 rounded-lg" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
