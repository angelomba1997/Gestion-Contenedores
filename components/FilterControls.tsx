import React from 'react';
import { FRACTIONS, STATUSES } from '../constants';
import type { Filters, Capacity } from '../types';

interface FilterControlsProps {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
    establishments: string[];
}

const ALL_CAPACITIES: Capacity[] = [40, 120, 240, 1100];

export const FilterControls: React.FC<FilterControlsProps> = ({ filters, setFilters, establishments }) => {

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: name === 'capacity' && value !== 'ALL' ? Number(value) : value,
        }));
    };

    const clearFilters = () => {
        setFilters({
            fractionId: 'ALL',
            capacity: 'ALL',
            statusId: 'ALL',
            establishment: 'ALL',
        });
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {/* Establishment Filter */}
                <div>
                    <label htmlFor="establishment" className="sr-only">Filtrar por establecimiento</label>
                    <select
                        id="establishment"
                        name="establishment"
                        value={filters.establishment}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                        <option value="ALL">Todos los establecimientos</option>
                        {establishments.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>
                {/* Fraction Filter */}
                <div>
                    <label htmlFor="fractionId" className="sr-only">Filtrar por fracción</label>
                    <select
                        id="fractionId"
                        name="fractionId"
                        value={filters.fractionId}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                        <option value="ALL">Todas las fracciones</option>
                        {FRACTIONS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
                {/* Capacity Filter */}
                <div>
                    <label htmlFor="capacity" className="sr-only">Filtrar por capacidad</label>
                    <select
                        id="capacity"
                        name="capacity"
                        value={filters.capacity}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                        <option value="ALL">Todas las capacidades</option>
                        {ALL_CAPACITIES.map(c => <option key={c} value={c}>{c} L</option>)}
                    </select>
                </div>
                {/* Status Filter */}
                <div>
                    <label htmlFor="statusId" className="sr-only">Filtrar por estado</label>
                    <select
                        id="statusId"
                        name="statusId"
                        value={filters.statusId}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                        <option value="ALL">Todos los estados</option>
                        {STATUSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
            <button
                onClick={clearFilters}
                className="w-full md:w-auto px-4 py-2 border border-slate-300 text-slate-600 rounded-md hover:bg-slate-100 transition whitespace-nowrap"
            >
                Limpiar Filtros
            </button>
        </div>
    );
};