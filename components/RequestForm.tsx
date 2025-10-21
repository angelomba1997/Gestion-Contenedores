import React, { useState, useEffect, useRef } from 'react';
import { FRACTIONS } from '../constants';
import { RequestTypeEnum } from '../types';
import type { Capacity, ContainerRequest, FractionEnum, RequestItemDetail } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { DocumentArrowUpIcon } from './icons/DocumentArrowUpIcon';


interface ItemEditorProps {
    onAddItem: (item: Omit<RequestItemDetail, 'requestType'>) => void;
    availableStock?: Map<string, number>;
}

const ItemEditor: React.FC<ItemEditorProps> = ({ onAddItem, availableStock }) => {
    const [fractionId, setFractionId] = useState<FractionEnum>(FRACTIONS[0].id);
    const [availableCapacities, setAvailableCapacities] = useState<Capacity[]>(FRACTIONS[0].capacities);
    const [capacity, setCapacity] = useState<Capacity>(FRACTIONS[0].capacities[0]);

    useEffect(() => {
        const selectedFraction = FRACTIONS.find(f => f.id === fractionId);
        if (selectedFraction) {
            setAvailableCapacities(selectedFraction.capacities);
            if (!selectedFraction.capacities.includes(capacity)) {
                setCapacity(selectedFraction.capacities[0]);
            }
        }
    }, [fractionId, capacity]);

    const handleAdd = () => {
        onAddItem({ fractionId, capacity });
    };

    const currentStock = availableStock ? availableStock.get(`${fractionId}-${capacity}`) ?? 0 : null;
    const displayStock = currentStock !== null ? Math.max(0, currentStock) : 0;

    return (
        <div className="border border-dashed rounded-md">
            <div className="flex items-end gap-2 p-2">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500">Fracción</label>
                    <select
                        value={fractionId}
                        onChange={(e) => setFractionId(e.target.value as FractionEnum)}
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        {FRACTIONS.map(fraction => <option key={fraction.id} value={fraction.id}>{fraction.name}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500">Capacidad</label>
                    <select
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value) as Capacity)}
                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                        {availableCapacities.map(cap => <option key={cap} value={cap}>{cap}L</option>)}
                    </select>
                </div>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                    aria-label="Añadir contenedor"
                >
                    <PlusIcon className="w-5 h-5" />
                </button>
            </div>
            {availableStock && currentStock !== null && (
                <div className="border-t border-dashed mt-2 p-2 text-center">
                    <span className="text-xs text-slate-500">Disponibles (reales): </span>
                    <span className={`font-bold text-sm ${displayStock > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {displayStock}
                    </span>
                </div>
            )}
        </div>
    );
};

interface RequestFormProps {
    onSubmit: (newRequest: Omit<ContainerRequest, 'id' | 'statusId'>) => void;
    establishments: string[];
    onImportEstablishments: (csvText: string) => void;
    realTimeAvailability: Map<string, number>;
}

export const RequestForm: React.FC<RequestFormProps> = ({ onSubmit, establishments, onImportEstablishments, realTimeAvailability }) => {
    const [establishment, setEstablishment] = useState<string>('');
    const [requestDate, setRequestDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
    const [requestTime, setRequestTime] = useState<string>(() => {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    });
    const [itemsToAdd, setItemsToAdd] = useState<RequestItemDetail[]>([]);
    const [itemsToRemove, setItemsToRemove] = useState<RequestItemDetail[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
                onImportEstablishments(text);
                alert(`${text.split('\n').filter(Boolean).length} establecimientos importados con éxito.`);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset file input to allow re-uploading same file
    };

    const handleAddItem = (item: Omit<RequestItemDetail, 'requestType'>) => {
        setItemsToAdd(prev => [...prev, { ...item, requestType: RequestTypeEnum.ADD }]);
    };
    
    const handleRemoveItem = (item: Omit<RequestItemDetail, 'requestType'>) => {
        setItemsToRemove(prev => [...prev, { ...item, requestType: RequestTypeEnum.REMOVE }]);
    };
    
    const deleteItem = (index: number, type: 'add' | 'remove') => {
        if (type === 'add') {
            setItemsToAdd(prev => prev.filter((_, i) => i !== index));
        } else {
            setItemsToRemove(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!establishment || !requestDate || !requestTime || (itemsToAdd.length === 0 && itemsToRemove.length === 0)) {
            alert("Por favor, seleccione un establecimiento, fecha, hora y añada al menos un contenedor.");
            return;
        }

        const combinedDate = new Date(`${requestDate}T${requestTime}`).toISOString();

        onSubmit({
            establishment,
            date: combinedDate,
            items: [...itemsToAdd, ...itemsToRemove],
        });
        setEstablishment('');
        setRequestDate(() => new Date().toISOString().split('T')[0]);
        setRequestTime(() => {
            const now = new Date();
            return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        });
        setItemsToAdd([]);
        setItemsToRemove([]);
    };

    const renderItemList = (items: RequestItemDetail[], type: 'add' | 'remove') => (
        <ul className="space-y-2 mt-2">
            {items.map((item, index) => {
                const fraction = FRACTIONS.find(f => f.id === item.fractionId);
                return (
                    <li key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                        <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-full ${fraction?.color}`}>
                                <TrashIcon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-medium">{fraction?.name} - {item.capacity}L</span>
                        </div>
                        <button type="button" onClick={() => deleteItem(index, type)} className="text-red-500 hover:text-red-700">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </li>
                );
            })}
        </ul>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg sticky top-8">
            <h2 className="text-2xl font-bold text-slate-700 mb-6 border-b pb-3">Nueva Solicitud</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="establishment" className="block text-sm font-medium text-slate-600 mb-1">Establecimiento</label>
                    <div className="flex items-center gap-2">
                        <input
                            id="establishment"
                            type="text"
                            list="establishmentsDataList"
                            value={establishment}
                            onChange={(e) => setEstablishment(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                            required
                            placeholder="Buscar o escribir..."
                        />
                        <datalist id="establishmentsDataList">
                            {establishments.map(est => <option key={est} value={est} />)}
                        </datalist>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".csv"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={handleImportClick}
                            className="p-3 border border-slate-300 rounded-md hover:bg-slate-100 transition flex-shrink-0"
                            title="Importar establecimientos (.csv)"
                        >
                            <DocumentArrowUpIcon className="w-6 h-6 text-slate-600" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="fechaSolicitud" className="block text-sm font-medium text-slate-600 mb-1">Fecha:</label>
                        <input
                            type="date"
                            id="fechaSolicitud"
                            value={requestDate}
                            onChange={(e) => setRequestDate(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="horaSolicitud" className="block text-sm font-medium text-slate-600 mb-1">Hora:</label>
                        <input
                            type="time"
                            id="horaSolicitud"
                            value={requestTime}
                            onChange={(e) => setRequestTime(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                            required
                        />
                    </div>
                </div>
                
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-blue-600">Contenedores a Recibir</h3>
                    <ItemEditor onAddItem={handleAddItem} availableStock={realTimeAvailability} />
                    {itemsToAdd.length > 0 && renderItemList(itemsToAdd, 'add')}
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-red-600">Contenedores a Devolver</h3>
                    <ItemEditor onAddItem={handleRemoveItem} />
                     {itemsToRemove.length > 0 && renderItemList(itemsToRemove, 'remove')}
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105 disabled:bg-slate-300"
                    disabled={itemsToAdd.length === 0 && itemsToRemove.length === 0 || !establishment || !requestDate || !requestTime}
                >
                    Enviar Solicitud
                </button>
            </form>
        </div>
    );
};