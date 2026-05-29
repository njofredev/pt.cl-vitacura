'use client';

import React, { useState, useEffect } from 'react';
import { getArancelesAction, toggleArancelOdontogramAction, toggleCategoryVisibilityAction, Arancel } from '@/app/actions/arancelActions';
import { Search, ShieldAlert, Sparkles, Filter, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

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
        setCategories(res.categories || []);
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

          <div style={{ display: 'flex', gap: '10px 16px', flexWrap: 'wrap', marginTop: '6px' }}>
            {categories.map((cat) => {
              const isHidden = hiddenCategories.includes(cat);
              const isToggling = togglingCategory === cat;

              return (
                <div
                  key={cat}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    backgroundColor: isHidden ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.04)',
                    border: isHidden ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.15)',
                    transition: 'all 0.2s ease',
                    opacity: isToggling ? 0.6 : 1
                  }}
                >
                  <span style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    color: isHidden ? 'hsl(var(--danger-hsl))' : 'hsl(var(--foreground-hsl))'
                  }}>
                    {cat}
                  </span>

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
                      padding: 0
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
      <div className="glass-panel animate-fade-in" style={{ padding: '24px 30px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', color: 'hsla(var(--foreground-hsl) / 0.5)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar prestación dental por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px', margin: 0, width: '100%' }}
          />
        </div>

        {/* Category Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '240px' }}>
          <Filter size={15} style={{ color: 'hsl(var(--primary-hsl))' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>Categoría:</span>
          <select
            className="form-input"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            style={{ margin: 0, flex: 1, height: '42px', padding: '0 12px' }}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px' }}>
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
            <span style={{ fontSize: '0.88rem', fontWeight: 800, padding: '0 8px' }}>
              Página {page} de {totalPages}
            </span>
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
