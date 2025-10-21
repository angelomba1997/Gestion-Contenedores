import React, { useState } from 'react';
import { FRACTIONS } from '../constants';
import { RequestTypeEnum, StatusEnum } from '../types';
import type { ContainerRequest, RequestItemDetail } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { StatusBadge } from './StatusBadge';
import { CheckIcon } from './icons/CheckIcon';

interface ItemListProps {
    items: RequestItemDetail[];
    title: string;
    titleColor: string;
}

const ItemList: React.FC<ItemListProps> = ({ items, title, titleColor }) => {
    if (items.length === 0) return null;

    return (
        <div>
            <h4 className={`font-semibold mb-2 ${titleColor}`}>{title}</h4>
            <ul className="space-y-2">
                {items.map((item, index) => {
                    const fraction = FRACTIONS.find(f => f.id === item.fractionId);
                    if (!fraction) return null;
                    return (
                        <li key={index} className="flex items-center gap-2 text-sm">
                            <div className={`p-1 rounded-full ${fraction.color}`}>
                                <TrashIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium">{fraction.name}</span>
                            <span className="text-slate-500">{item.capacity} Litros</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};


interface RequestItemProps {
    request: ContainerRequest;
    onDeleteRequest: (id: string) => void;
    onMarkAsDelivered: (id: string) => void;
}

export const RequestItem: React.FC<RequestItemProps> = ({ request, onDeleteRequest, onMarkAsDelivered }) => {
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const itemsToAdd = request.items.filter(item => item.requestType === RequestTypeEnum.ADD);
    const itemsToRemove = request.items.filter(item => item.requestType === RequestTypeEnum.REMOVE);

    const handleDeleteClick = () => {
        onDeleteRequest(request.id);
    };

    const handleDeliverClick = () => {
        onMarkAsDelivered(request.id);
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-xl">
            <div className="p-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                     <div>
                        <p className="text-sm text-slate-500">Establecimiento</p>
                        <p className="font-bold text-lg text-slate-800">{request.establishment}</p>
                    </div>
                    <div className="flex-shrink-0">
                        <StatusBadge statusId={request.statusId} statusDetail={request.statusDetail} />
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <ItemList items={itemsToAdd} title="A Recibir" titleColor="text-blue-600" />
                   <ItemList items={itemsToRemove} title="A Devolver" titleColor="text-red-600" />
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                     <div className="flex gap-x-6">
                        <div>
                            <p className="font-semibold">Fecha Solicitud</p>
                            <p>{new Date(request.date).toLocaleString('es-ES')}</p>
                        </div>
                        <div>
                            <p className="font-semibold">ID Solicitud</p>
                            <p className="font-mono">#{request.id}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {request.statusId !== StatusEnum.REALIZADO && (
                            <button 
                                onClick={handleDeliverClick} 
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
                                aria-label="Marcar como entregado"
                            >
                                <CheckIcon className="w-4 h-4" />
                                Entregado
                            </button>
                        )}
                        {isConfirmingDelete ? (
                            <div className="flex items-center gap-2">
                                <button onClick={handleDeleteClick} className="px-3 py-1 text-xs font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Confirmar</button>
                                <button onClick={() => setIsConfirmingDelete(false)} className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-200 rounded-md hover:bg-slate-300">Cancelar</button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsConfirmingDelete(true)} 
                                className="p-2 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-600 transition"
                                aria-label="Eliminar solicitud"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};