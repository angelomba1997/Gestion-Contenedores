import React from 'react';
import { STATUSES } from '../constants';
// FIX: 'StatusEnum' cannot be used as a value because it was imported using 'import type'. Changed to a value import.
import { StatusEnum } from '../types';

interface StatusBadgeProps {
    statusId: StatusEnum;
    statusDetail?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ statusId, statusDetail }) => {
    const status = STATUSES.find(s => s.id === statusId);
    if (!status) return null;

    let emoji = '';
    switch(statusId) {
        case StatusEnum.REALIZADO: emoji = '✅'; break;
        case StatusEnum.SIN_STOCK: emoji = '⚠️'; break;
        case StatusEnum.EN_PREPARACION: emoji = '📦'; break;
    }

    if (statusId === StatusEnum.SIN_STOCK && statusDetail) {
        const parts = statusDetail.split(' | ');
        return (
            <div className={`inline-flex items-start gap-2 px-3 py-2 rounded-lg text-sm font-medium ${status.color} ${status.textColor}`}>
                <span className="mt-0.5" aria-hidden="true">{emoji}</span>
                <div>
                    <p className="font-bold mb-1 sr-only">{status.name}</p>
                    <div className="text-xs space-y-1">
                        {parts.map((part, index) => {
                            const isOutOfStock = part.startsWith('No hay stock');
                            const basePart = part.replace('No hay stock: ', '').replace('Disponible: ', '');
                            const textColor = isOutOfStock ? 'text-red-700' : 'text-slate-700';

                            return (
                               <div key={index} className={textColor}>
                                 <span className="font-bold mr-1">{isOutOfStock ? 'No hay stock:' : 'Disponible:'}</span>
                                 <span>{basePart}</span>
                               </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
    
    const displayText = status.name;

    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.color} ${status.textColor}`}>
            <span aria-hidden="true">{emoji}</span>
            {displayText}
        </span>
    );
};