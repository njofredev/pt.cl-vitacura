'use client';

import React, { useState, useEffect } from 'react';
import { getArancelesAction, toggleArancelOdontogramAction, toggleCategoryVisibilityAction, Arancel } from '@/app/actions/arancelActions';
import { 
  Search, ShieldAlert, Sparkles, Filter, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
  Scissors, Pill, Smile, FlaskConical, Baby, Wrench, Activity, Layers, RefreshCw, AlertTriangle 
} from 'lucide-react';

const getCategoryIcon = (category: string) => {
  const cat = category.toUpperCase().trim();
  if (cat.includes('CIRUGÍA') || cat.includes('CIRUGIA')) return <Scissors size={14} />;
  if (cat.includes('ENDODONCIA')) return <Pill size={14} />;
  if (cat.includes('GENERAL')) return <Smile size={14} />;
  if (cat.includes('IMPLANTOLOGÍA') || cat.includes('IMPLANTOLOGIA')) return <Sparkles size={14} />;
  if (cat.includes('LABORATORIOS') || cat.includes('LABORATORIO')) return <FlaskConical size={14} />;
  if (cat.includes('ODONTOPEDIATRÍA') || cat.includes('ODONTOPEDIATRIA')) return <Baby size={14} />;
  if (cat.includes('OPERATORIA')) return <Wrench size={14} />;
  if (cat.includes('ORTODONCIA')) return <Activity size={14} />;
  if (cat.includes('PERIODONCIA')) return <Activity size={14} />;
  if (cat.includes('PRÓTESIS FIJA') || cat.includes('PROTESIS FIJA')) return <Layers size={14} />;
  if (cat.includes('PRÓTESIS REMOVIBLE') || cat.includes('PROTESIS REMOVIBLE')) return <RefreshCw size={14} />;
  if (cat.includes('RADIOLOGÍA') || cat.includes('RADIOLOGIA')) return <Search size={14} />;
  if (cat.includes('TTM')) return <AlertTriangle size={14} />;
  return <Sparkles size={14} />;
};

const sortCategories = (cats: string[]) => {
  const customOrder = [
    'CIRUGÍA', 'CIRUGIA',
    'ENDODONCIA',
    'GENERAL',
    'IMPLANTOLOGÍA', 'IMPLANTOLOGIA',
    'LABORATORIOS', 'LABORATORIO',
    'ODONTOPEDIATRÍA', 'ODONTOPEDIATRIA',
    'OPERATORIA',
    'ORTODONCIA',
    'PERIODONCIA',
    'PRÓTESIS FIJA', 'PROTESIS FIJA',
    'TTM -DOF', 'TTM-DOF', 'TTM',
    'PRÓTESIS REMOVIBLE', 'PROTESIS REMOVIBLE',
    'RADIOLOGÍA', 'RADIOLOGIA'
  ].map(c => c.toUpperCase().trim());

  return [...cats].sort((a, b) => {
    const idxA = customOrder.findIndex(c => a.toUpperCase().trim().includes(c));
    const idxB = customOrder.findIndex(c => b.toUpperCase().trim().includes(c));
    
    const valA = idxA === -1 ? 999 : idxA;
    const valB = idxB === -1 ? 999 : idxB;
    
    if (valA !== valB) return valA - valB;
    return a.localeCompare(b);
  });
};

export default function ArancelManager() {
  const [aranceles, setAranceles] = useState<Arancel[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);
  const [togglingCategory, setTogglingCategory] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 15;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const res = await getArancelesAction(search, category, page, limit);
      if (res.success && res.data) {
        setAranceles(res.data);
        setTotal(res.total || 0);
        setCategories(sortCategories(res.categories || []));
        setHiddenCategories(res.hiddenCategories || []);
      } else {
        setError(res.error || 'No se pudieron cargar los datos.');
      }
    } catch (err) {
      setError('Error al comunicar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  // Reload data on filter change
  useEffect(() => {
    loadData();
  }, [category, page]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      loadData();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleToggle = async (id: number, currentStatus: boolean) => {
    setToggleLoadingId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await toggleArancelOdontogramAction(id, !currentStatus);
      if (res.success) {
        setAranceles(prev =>
          prev.map(item => (item.id === id ? { ...item, show_in_odontogram: !currentStatus } : item))
        );
        setSuccess('Preferencia actualizada correctamente.');
        setTimeout(() => setSuccess(null), 2000);
      } else {
        setError(res.error || 'Error al cambiar estado.');
      }
    } catch (err) {
      setError('Error en la solicitud.');
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleCategoryToggle = async (cat: string, currentlyHidden: boolean) => {
    setTogglingCategory(cat);
    setError(null);
    setSuccess(null);
    try {
      const res = await toggleCategoryVisibilityAction(cat, !currentlyHidden);
      if (res.success) {
        setHiddenCategories(prev =>
          currentlyHidden ? prev.filter(c => c !== cat) : [...prev, cat]
        );
        setSuccess(`Visibilidad de la categoría "${cat.toUpperCase()}" actualizada correctamente.`);
        await loadData();
        setTimeout(() => setSuccess(null), 2500);
      } else {
        setError(res.error || 'Error al cambiar estado de categoría.');
      }
    } catch (err) {
      setError('Error en la solicitud.');
    } finally {
      setTogglingCategory(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Category Visibility Settings Panel */}
      {categories.length > 0 && (
        <div className="glass-panel animate-fade-in" style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--glass-border)', background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.02) 0%, rgba(59, 130, 246, 0.01) 100%), hsl(var(--card-hsl))' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--foreground-hsl)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} style={{ color: 'hsl(var(--primary-hsl))' }} /> Visibilidad de Categorías en Odontograma
          </h3>
          <p style={{ fontSize: '0.82rem', opacity: 0.75, margin: 0, color: 'hsla(var(--foreground-hsl) / 0.8)', fontWeight: 500 }}>
            Desactiva una categoría completa para ocultarla al instante (con todas sus prestaciones) dentro del odontograma interactivo.
          </p>

          <div style={{ display: 'flex', gap: '12px 18px', flexWrap: 'wrap', marginTop: '8px' }}>
            {categories.map((cat) => {
              const isHidden = hiddenCategories.includes(cat);
              const isToggling = togglingCategory === cat;

              return (
                <div
                  key={cat}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '8px 14px',
                    borderRadius: '16px',
                    backgroundColor: isHidden ? 'rgba(239, 68, 68, 0.03)' : 'rgba(16, 185, 129, 0.03)',
                    border: isHidden ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
                    transition: 'all 0.25s ease',
                    opacity: isToggling ? 0.6 : 1,
                    minWidth: '220px',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.01)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: isHidden ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isHidden ? '#ef4444' : '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getCategoryIcon(cat)}
                    </div>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      color: isHidden ? 'hsl(var(--danger-hsl))' : 'hsl(var(--foreground-hsl))'
                    }}>
                      {cat.toLowerCase()}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleCategoryToggle(cat, isHidden)}
                    style={{
                      width: '38px',
                      height: '20px',
                      borderRadius: '9999px',
                      backgroundColor: !isHidden ? '#10b981' : 'rgba(120, 120, 120, 0.2)',
                      border: !isHidden ? '1px solid #059669' : '1px solid rgba(120, 120, 120, 0.3)',
                      position: 'relative',
                      cursor: isToggling ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      padding: 0,
                      flexShrink: 0
                    }}
                    title={isHidden ? `Mostrar categoría ${cat} en odontograma` : `Esconder categoría ${cat} en odontograma`}
                  >
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '2px',
                      left: !isHidden ? '20px' : '2px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Category Filter Bar */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px 30px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        
        {/* Search Input */}
        <div className="form-group" style={{ flex: 1, minWidth: '280px', marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Buscar Prestación
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'hsla(var(--foreground-hsl) / 0.5)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Buscar prestación dental por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px', margin: 0, width: '100%' }}
            />
          </div>
        </div>

        {/* Category Selector */}
        <div className="form-group" style={{ minWidth: '240px', marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: 'hsl(var(--primary-hsl))' }} />
            Categoría
          </label>
          <select
            className="form-input"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            style={{ margin: 0, width: '100%', height: '42px', padding: '0 12px' }}
          >
            <option value="all">Todas las Categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Notifications */}
      {error && (
        <div className="badge-rechazado animate-fade-in" style={{ padding: '14px 20px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="badge-aprobado animate-fade-in" style={{ padding: '14px 20px', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* Table Section */}
      <div className="glass-panel animate-fade-in" style={{ padding: '0px', overflowX: 'auto', border: '1px solid var(--glass-border)' }}>
        
        {loading && aranceles.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem', fontWeight: 700 }}>
            Cargando prestaciones de Dentalink...
          </div>
        ) : aranceles.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', opacity: 0.6 }}>
            <ShieldAlert size={36} style={{ color: 'hsl(var(--accent-hsl))', margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>No se encontraron prestaciones</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>Intenta ajustar tu término de búsqueda o filtro de categoría.</div>
          </div>
        ) : (
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 24px', width: '80px' }}>Código ID</th>
                <th style={{ padding: '16px 24px' }}>Nombre de Prestación</th>
                <th style={{ padding: '16px 24px', width: '200px' }}>Categoría</th>
                <th style={{ padding: '16px 24px', width: '130px', textAlign: 'right' }}>Precio Base</th>
                <th style={{ padding: '16px 24px', width: '130px', textAlign: 'right' }}>Precio Preferente</th>
                <th style={{ padding: '16px 24px', width: '180px', textAlign: 'center' }}>¿Mostrar en Odontograma?</th>
              </tr>
            </thead>
            <tbody>
              {aranceles.map((arancel) => {
                const isActive = arancel.show_in_odontogram;
                const isToggling = toggleLoadingId === arancel.id;
                
                return (
                  <tr key={arancel.id} style={{ transition: 'all 0.2s ease', backgroundColor: isActive ? 'transparent' : 'rgba(239, 68, 68, 0.015)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700, opacity: 0.6 }}>#{arancel.id}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--foreground-hsl)' }}>
                      {arancel.name}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: 'hsla(var(--primary-hsl) / 0.08)',
                        color: 'hsl(var(--primary-hsl))',
                        border: '1px solid hsla(var(--primary-hsl) / 0.15)'
                      }}>
                        {arancel.category}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                      ${arancel.price_base?.toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: 'hsl(var(--primary-hsl))' }}>
                      ${arancel.price_pref?.toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => handleToggle(arancel.id, isActive)}
                          style={{
                            width: '46px',
                            height: '24px',
                            borderRadius: '9999px',
                            backgroundColor: isActive ? '#10b981' : 'rgba(120, 120, 120, 0.2)',
                            border: isActive ? '1px solid #059669' : '1px solid rgba(120, 120, 120, 0.3)',
                            position: 'relative',
                            cursor: isToggling ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: isToggling ? 0.6 : 1,
                            padding: 0
                          }}
                          title={isActive ? 'Desactivar de odontograma' : 'Activar para odontograma'}
                        >
                          <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            position: 'absolute',
                            top: '2px',
                            left: isActive ? '24px' : '2px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontSize: '0.82rem', opacity: 0.6, fontWeight: 600 }}>
            Mostrando prestaciones {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de un total de {total}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1 || loading}
              className="btn-secondary"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            {/* Page numbers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {(() => {
                const pages: (number | string)[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  let start = Math.max(2, page - 1);
                  let end = Math.min(totalPages - 1, page + 1);
                  
                  if (page <= 3) {
                    end = 4;
                  } else if (page >= totalPages - 2) {
                    start = totalPages - 3;
                  }
                  
                  if (start > 2) {
                    pages.push('...');
                  }
                  
                  for (let i = start; i <= end; i++) {
                    pages.push(i);
                  }
                  
                  if (end < totalPages - 1) {
                    pages.push('...');
                  }
                  
                  pages.push(totalPages);
                }

                return pages.map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`dots-${idx}`} style={{ padding: '0 8px', fontSize: '0.88rem', opacity: 0.5, fontWeight: 600 }}>
                        ...
                      </span>
                    );
                  }
                  const isCurrent = p === page;
                  return (
                    <button
                      key={`page-${p}`}
                      onClick={() => setPage(p as number)}
                      disabled={loading}
                      style={{
                        minWidth: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: isCurrent ? '1px solid #059669' : '1px solid var(--glass-border)',
                        backgroundColor: isCurrent ? '#10b981' : 'rgba(255, 255, 255, 0.03)',
                        color: isCurrent ? '#ffffff' : 'hsl(var(--foreground-hsl))',
                        opacity: loading ? 0.6 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                        }
                      }}
                    >
                      {p}
                    </button>
                  );
                });
              })()}
            </div>

            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="btn-secondary"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px', opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
