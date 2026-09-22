import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Building, Shield, Info, FileText, Phone, Mail, ExternalLink } from 'lucide-react';

export default function Usuarios() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'ciudadanos' | 'autoridades' | 'empresas'>('ciudadanos');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-6">
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
              <h1 className="text-2xl font-bold text-gray-800">Información de Usuarios</h1>
              <p className="text-sm text-gray-600">Recursos y contactos por tipo de usuario</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-2 shadow-md mb-6 flex gap-2">
          <button
            onClick={() => setSelectedTab('ciudadanos')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              selectedTab === 'ciudadanos'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="w-5 h-5" />
              <span>Ciudadanos</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('autoridades')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              selectedTab === 'autoridades'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Autoridades</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedTab('empresas')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              selectedTab === 'empresas'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building className="w-5 h-5" />
              <span>Empresas</span>
            </div>
          </button>
        </div>

        {selectedTab === 'ciudadanos' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-8 h-8" />
                <h2 className="text-xl font-bold">Información para Ciudadanos</h2>
              </div>
              <p className="text-blue-100">
                Participa activamente en el cuidado de nuestros ríos y aprende cómo puedes contribuir a mantener el agua limpia.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                ¿Cómo Puedes Ayudar?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700">Reporta anomalías que observes en los ríos a través de la función de Reporte Ciudadano</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700">No arrojes basuras ni residuos a los cuerpos de agua</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700">Reduce el uso de químicos y detergentes en tu hogar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700">Participa en jornadas de limpieza de ríos y quebradas</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-600 font-bold">•</span>
                  <span className="text-gray-700">Educa a tu comunidad sobre la importancia del agua limpia</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Indicadores de Calidad del Agua
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-gray-800 mb-1">pH (6.5 - 8.5)</div>
                  <div className="text-sm text-gray-600">Mide la acidez o alcalinidad del agua. Valores fuera de rango pueden afectar la vida acuática.</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="font-semibold text-gray-800 mb-1">Temperatura (20-25°C)</div>
                  <div className="text-sm text-gray-600">Afecta el oxígeno disuelto y el metabolismo de organismos acuáticos.</div>
                </div>
                <div className="p-4 bg-cyan-50 rounded-lg">
                  <div className="font-semibold text-gray-800 mb-1">Turbidez (&lt; 50 NTU)</div>
                  <div className="text-sm text-gray-600">Mide la claridad del agua. Alta turbidez puede indicar contaminación.</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-gray-800 mb-1">Metales Pesados (&lt; 0.1 mg/L)</div>
                  <div className="text-sm text-gray-600">Sustancias tóxicas que pueden acumularse en organismos vivos.</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-4">Contacto y Recursos</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Línea de Atención: 018000-123456</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">Email: contacto@aguacali.gov.co</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'autoridades' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-8 h-8" />
                <h2 className="text-xl font-bold">Panel de Autoridades Ambientales</h2>
              </div>
              <p className="text-green-100">
                Herramientas y datos para la toma de decisiones y gestión ambiental de los recursos hídricos urbanos.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-green-600" />
                Funcionalidades Disponibles
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Monitoreo en tiempo real de todos los puntos de medición</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Sistema automático de generación de alertas preventivas y críticas</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Acceso a reportes ciudadanos con geolocalización</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Análisis histórico de tendencias y patrones</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Exportación de datos para informes técnicos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-gray-700">Panel de control de cumplimiento normativo</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-4">Protocolos de Acción</h3>
              <div className="space-y-3">
                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="font-semibold text-red-800 mb-2">Alerta Crítica</div>
                  <div className="text-sm text-gray-700">
                    1. Notificación inmediata a entidades responsables<br />
                    2. Activación de protocolo de emergencia<br />
                    3. Suspensión de actividades en la zona afectada<br />
                    4. Inspección y toma de muestras adicionales<br />
                    5. Seguimiento cada 2 horas hasta normalización
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="font-semibold text-yellow-800 mb-2">Alerta Preventiva</div>
                  <div className="text-sm text-gray-700">
                    1. Monitoreo intensivo del parámetro afectado<br />
                    2. Análisis de posibles fuentes de contaminación<br />
                    3. Comunicación a empresas y comunidad cercana<br />
                    4. Seguimiento cada 6 horas<br />
                    5. Registro y documentación para análisis
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-4">Contactos Institucionales</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-800">CVC - Corporación Autónoma Regional del Valle del Cauca</div>
                  <div className="text-sm text-gray-600 mt-1">Tel: (602) 620 6600</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-800">DAGMA - Departamento Administrativo de Gestión del Medio Ambiente</div>
                  <div className="text-sm text-gray-600 mt-1">Tel: (602) 660 0000</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-800">Secretaría de Salud Municipal</div>
                  <div className="text-sm text-gray-600 mt-1">Tel: (602) 898 5050</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'empresas' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Building className="w-8 h-8" />
                <h2 className="text-xl font-bold">Portal de Empresas de Servicios Públicos</h2>
              </div>
              <p className="text-purple-100">
                Información y recursos para empresas prestadoras de servicios públicos relacionados con el agua.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-purple-600" />
                Beneficios del Sistema
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">Detección temprana de eventos de contaminación que puedan afectar la captación</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">Optimización de procesos de tratamiento basado en datos en tiempo real</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">Cumplimiento de normativas ambientales y sanitarias</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">Reducción de costos operativos mediante gestión predictiva</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 font-bold">•</span>
                  <span className="text-gray-700">Información para comunicación con usuarios y autoridades</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-4">Integración de Datos</h3>
              <div className="space-y-3">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-gray-800 mb-2">API de Datos en Tiempo Real</div>
                  <div className="text-sm text-gray-600 mb-2">
                    Acceso a datos de calidad del agua mediante API REST para integración con sistemas SCADA
                  </div>
                  <a href="#" className="text-purple-600 text-sm flex items-center gap-1 hover:underline">
                    Ver Documentación
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-gray-800 mb-2">Exportación de Reportes</div>
                  <div className="text-sm text-gray-600">
                    Descarga de datos históricos en formatos CSV, Excel y PDF para análisis y auditorías
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-gray-800 mb-2">Webhooks de Alertas</div>
                  <div className="text-sm text-gray-600">
                    Notificaciones automáticas a sistemas externos cuando se generan alertas críticas
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-4">Empresas Participantes</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-800">EMCALI EICE ESP</div>
                  <div className="text-sm text-gray-600 mt-1">Empresas Municipales de Cali</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-800">Acuavalle S.A. E.S.P.</div>
                  <div className="text-sm text-gray-600 mt-1">Operador regional de acueducto</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-800">Centros de Investigación</div>
                  <div className="text-sm text-gray-600 mt-1">Universidades y laboratorios ambientales</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-semibold text-gray-800 mb-4">Soporte Técnico</h3>
              <div className="space-y-3">
                <a href="#" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Phone className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">Línea Empresarial: 018000-789012</span>
                </a>
                <a href="#" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Mail className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">Email: empresas@aguacali.gov.co</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
