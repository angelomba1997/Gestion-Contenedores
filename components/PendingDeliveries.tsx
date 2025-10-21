import React from 'react';
import { StatusEnum, type Fraction } from '../types';
import { TrashIcon } from './icons/TrashIcon';

export interface PendingSummaryItem {
    fraction: Fraction;
    capacity: number;
    [StatusEnum.EN_PREPARACION]: number;
    [StatusEnum.SIN_STOCK]: number;
}

interface PendingDeliveriesProps {
    summary: PendingSummaryItem[];
}

export const PendingDeliveries: React.FC<PendingDeliveriesProps> = ({ summary }) => {
    if (summary.length === 0) {
        return (
             <div className="bg-white p-8 rounded-lg shadow-md text-center text-slate-500">
                <p className="text-xl">No hay entregas pendientes en este momento.</p>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-slate-700 mb-6 border-b pb-3">Resumen de Entregas Pendientes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {summary.map(({ fraction, capacity, ...counts }) => {
                    const totalPending = counts[StatusEnum.EN_PREPARACION] + counts[StatusEnum.SIN_STOCK];
                    if (totalPending === 0) return null;

                    return (
                        <div key={`${fraction.id}-${capacity}`} className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-full ${fraction.color}`}>
                                    <TrashIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{fraction.name}</h3>
                                    <p className="text-sm text-slate-500">{capacity} Litros</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center p-2 rounded-md bg-violet-100">
                                    <span className="font-semibold text-violet-800">🟡 En preparación</span>
                                    <span className="font-bold text-lg text-violet-900">{counts[StatusEnum.EN_PREPARACION]}</span>
                                </div>
                                <div className="flex justify-between items-center p-2 rounded-md bg-cyan-100">
                                    <span className="font-semibold text-cyan-800">🔴 No hay stock</span>
                                    <span className="font-bold text-lg text-cyan-900">{counts[StatusEnum.SIN_STOCK]}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};