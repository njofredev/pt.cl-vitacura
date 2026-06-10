'use client';

import React, { useState, useEffect } from 'react';
import { callDentalinkApiAction, getDentalinkEnvTokenAction } from '@/app/actions/dentalinkActions';
import { 
  Play, 
  Key, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  ArrowLeft, 
  Code, 
  FileText,
  Check,
  Copy,
  AlertCircle,
  Activity,
  Search,
  List
} from 'lucide-react';
import Link from 'next/link';

export default function DentalinkTestingPage() {
  // Config state
  const [token, setToken] = useState('');
  const [hasEnvToken, setHasEnvToken] = useState(false);
  const [envTokenMasked, setEnvTokenMasked] = useState('');
  const [endpoint, setEndpoint] = useState('agendas');
  
  // Params state for agendas
  const [sucursal, setSucursal] = useState('3'); // Default: Vitacura
  const [fecha, setFecha] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [duracion, setDuracion] = useState('15');
  const [profesional, setProfesional] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');

  // Build the dynamic preview URL for visual feedback
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    async function checkEnvToken() {
      const res = await getDentalinkEnvTokenAction();
      if (res.hasToken) {
        setHasEnvToken(true);
        setEnvTokenMasked(res.maskedToken);
        setToken('ENV_TOKEN');
      }
    }
    checkEnvToken();
  }, []);

  useEffect(() => {
    const baseUrl = `https://api.dentalink.healthatom.com/api/v5/${endpoint}`;
    const url = new URL(baseUrl);
    
    if (endpoint === 'agendas') {
      const qParams: Record<string, any> = {};
      if (sucursal) qParams.id_sucursal = { eq: Number(sucursal) };
      if (fecha) qParams.fecha = { eq: fecha };
      if (duracion) qParams.duracion = { eq: Number(duracion) };
      if (profesional) qParams.id_profesional = { eq: Number(profesional) };
      
      if (Object.keys(qParams).length > 0) {
        url.searchParams.set('q', JSON.stringify(qParams));
      }
    }
    
    setPreviewUrl(url.toString());
  }, [endpoint, sucursal, fecha, duracion, profesional]);

  const handleTestApi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    const qParams: Record<string, any> = {};
    if (endpoint === 'agendas') {
      if (sucursal) qParams.id_sucursal = sucursal;
      if (fecha) qParams.fecha = fecha;
      if (duracion) qParams.duracion = duracion;
      if (profesional) qParams.id_profesional = profesional;
    }

    try {
      const response = await callDentalinkApiAction({
        token,
        endpoint,
        qParams: endpoint === 'agendas' ? qParams : undefined,
      });
      setResult(response);
    } catch (err: any) {
      setResult({
        success: false,
        status: 500,
        statusText: 'Client Error',
        duration: 0,
        errorText: err.message || 'Error executing request',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render table of agendas or list
  const renderVisualData = () => {
    if (!result || !result.success || !result.data) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.7 }}>
          <AlertCircle size={40} style={{ margin: '0 auto 12px', color: 'hsl(var(--warning-hsl))' }} />
          <p>No se encontraron resultados estructurados o la solicitud falló.</p>
        </div>
      );
    }

    const dataList = result.data.data;

    if (!Array.isArray(dataList) || dataList.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.7 }}>
          <List size={40} style={{ margin: '0 auto 12px' }} />
          <p>La consulta se completó con éxito, pero retornó una lista vacía.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Prueba modificando los filtros (ej. Sucursal, Fecha o Profesional ID).</p>
        </div>
      );
    }

    if (endpoint === 'agendas') {
      return (
        <div className="table-container animate-fade-in">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Profesional</th>
                <th>Sucursal</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Duración</th>
                <th>Paciente ID / Nombre</th>
              </tr>
            </thead>
            <tbody>
              {dataList.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {item.nombre_profesional || `ID: ${item.id_profesional}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>ID: {item.id_profesional}</div>
                  </td>
                  <td>ID: {item.id_sucursal || sucursal}</td>
                  <td>{item.fecha}</td>
                  <td>
                    <span className="badge badge-en_revision" style={{ textTransform: 'none', fontWeight: 600 }}>
                      {item.hora_inicio} - {item.hora_fin}
                    </span>
                  </td>
                  <td>{item.duracion} min</td>
                  <td>
                    {item.id_paciente ? (
                      <div>
                        <div>{item.nombre_paciente || 'Paciente registrado'}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>ID: {item.id_paciente}</div>
                      </div>
                    ) : (
                      <span className="badge badge-aprobado">Disponible</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Default list fallback
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {dataList.slice(0, 10).map((item: any, idx: number) => (
          <div key={idx} className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>{item.nombre || item.id || `Item ${idx}`}</span>
            <pre style={{ fontSize: '0.8rem', opacity: 0.8 }}>{JSON.stringify(item, null, 2)}</pre>
          </div>
        ))}
        {dataList.length > 10 && (
          <p style={{ fontSize: '0.8rem', opacity: 0.6, textAlign: 'center', marginTop: '10px' }}>
            Mostrando 10 de {dataList.length} registros. Usa la pestaña JSON para ver la respuesta completa.
          </p>
        )}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-en_revision">ENTORNO DE PRUEBAS</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Dentalink API Playground</h1>
          <p style={{ opacity: 0.7, marginTop: '4px' }}>Valida credenciales, endpoints y parámetros de Dentalink en tiempo real.</p>
        </div>

        <Link href="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={16} /> Volver al Dashboard
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }} className="lg:grid-cols-12">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Card 1: Configuration Form */}
          <div className="glass-panel" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={18} style={{ color: 'hsl(var(--primary-hsl))' }} /> Configuración de la Solicitud
            </h2>

            <form onSubmit={handleTestApi}>
              {/* Token Input */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Token de Autorización</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Header: Authorization</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-input"
                    value={token === 'ENV_TOKEN' ? '' : token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={hasEnvToken ? `Usando .env (${envTokenMasked})` : "Token api..."}
                    style={{ paddingRight: '40px' }}
                  />
                  <Key size={16} style={{ position: 'absolute', right: '14px', top: '15px', opacity: 0.4 }} />
                </div>
              </div>

              {/* Endpoint selection */}
              <div className="form-group">
                <label className="form-label">Endpoint de la API</label>
                <select 
                  className="form-select" 
                  value={endpoint} 
                  onChange={(e) => setEndpoint(e.target.value)}
                >
                  <option value="agendas">GET /v5/agendas (Disponibilidad de Agendas)</option>
                  <option value="profesionales">GET /v5/profesionales (Listado de Profesionales)</option>
                </select>
              </div>

              {/* Dynamic inputs based on selected endpoint */}
              {endpoint === 'agendas' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Sucursal</label>
                    <select 
                      className="form-select" 
                      value={sucursal} 
                      onChange={(e) => setSucursal(e.target.value)}
                    >
                      <option value="3">Vitacura (id: 3)</option>
                      <option value="2">Los Tribunales (id: 2)</option>
                      <option value="1">Sucursal 1 (id: 1)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Fecha (AAAA-MM-DD)</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={fecha} 
                      onChange={(e) => setFecha(e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duración (Minutos)</label>
                    <select 
                      className="form-select" 
                      value={duracion} 
                      onChange={(e) => setDuracion(e.target.value)}
                    >
                      <option value="15">15 min (Bloque estándar)</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">60 min</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ID Profesional (0 - 100)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Ej: 626 o vacío"
                      min="0"
                      max="100"
                      value={profesional} 
                      onChange={(e) => setProfesional(e.target.value)} 
                    />
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '2px' }}>
                      Rango de dentistas activos (0 a 100).
                    </span>
                  </div>
                </div>
              )}

              {/* Live constructed URL preview */}
              <div style={{ margin: '20px 0', padding: '12px 16px', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.6, display: 'block', marginBottom: '6px' }}>
                  URL DE SOLICITUD GENERADA
                </span>
                <code style={{ fontSize: '0.8rem', color: 'hsl(var(--accent-hsl))', wordBreak: 'break-all' }}>
                  {previewUrl}
                </code>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', height: '48px', marginTop: '10px' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>Ejecutando consulta...</>
                ) : (
                  <>
                    <Play size={16} fill="white" /> Probar API Dentalink
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Card 2: Response display */}
        <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} style={{ color: result?.success ? 'hsl(var(--success-hsl))' : 'hsl(var(--muted-hsl))' }} /> 
              Respuesta del Servidor
            </h2>

            {result && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`badge ${result.success ? 'badge-aprobado' : 'badge-rechazado'}`}>
                  HTTP {result.status} {result.statusText}
                </span>
                <span className="badge badge-pendiente" style={{ textTransform: 'none' }}>
                  {result.duration} ms
                </span>
              </div>
            )}
          </div>

          {!result && !isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, opacity: 0.5, textAlign: 'center', padding: '40px 20px' }}>
              <Search size={48} style={{ marginBottom: '16px' }} />
              <p style={{ fontWeight: 500 }}>Sin datos solicitados aún</p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Configura los parámetros a la izquierda y presiona "Probar API Dentalink".</p>
            </div>
          )}

          {isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                border: '3px solid var(--glass-border)', 
                borderTopColor: 'hsl(var(--primary-hsl))',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }} />
              <p style={{ opacity: 0.8, fontWeight: 500 }}>Llamando a Dentalink API a través de proxy seguro...</p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Tab Selector */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px', gap: '10px' }}>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'visual' ? '2px solid hsl(var(--primary-hsl))' : '2px solid transparent',
                    color: activeTab === 'visual' ? 'hsl(var(--foreground-hsl))' : 'hsla(var(--foreground-hsl) / 0.6)',
                    padding: '8px 16px',
                    borderRadius: 0,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('visual')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} /> Visualización Limpia
                  </span>
                </button>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === 'json' ? '2px solid hsl(var(--primary-hsl))' : '2px solid transparent',
                    color: activeTab === 'json' ? 'hsl(var(--foreground-hsl))' : 'hsla(var(--foreground-hsl) / 0.6)',
                    padding: '8px 16px',
                    borderRadius: 0,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('json')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Code size={14} /> Raw JSON
                  </span>
                </button>
              </div>

              {/* Tab Contents */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {activeTab === 'visual' ? (
                  renderVisualData()
                ) : (
                  <div style={{ position: 'relative', flex: 1, background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)', padding: '20px', maxHeight: '500px', overflowY: 'auto' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ position: 'absolute', right: '15px', top: '15px', padding: '6px 12px', fontSize: '0.75rem', height: 'auto' }}
                      onClick={() => copyToClipboard(JSON.stringify(result.data || result.errorText, null, 2))}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                    <pre style={{ fontSize: '0.85rem', fontFamily: 'var(--font-geist-mono, monospace)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(result.data || { error: result.errorText }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
